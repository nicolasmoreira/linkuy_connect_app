import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "@/services/API";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityLogEntry {
  type:
    | "LOCATION_UPDATE"
    | "FALL_DETECTED"
    | "INACTIVITY_ALERT"
    | "EMERGENCY_BUTTON_PRESSED";
  createdAt: number;
  message: string;
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "location";
    case "EMERGENCY_BUTTON_PRESSED":
      return "warning";
    case "FALL_DETECTED":
      return "alert-circle";
    case "INACTIVITY_ALERT":
      return "time";
    default:
      return "information-circle";
  }
};

const getAlertColor = (type: string, isDark: boolean) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return isDark ? "text-blue-400" : "text-blue-600";
    case "EMERGENCY_BUTTON_PRESSED":
      return isDark ? "text-red-400" : "text-red-600";
    case "FALL_DETECTED":
      return isDark ? "text-orange-400" : "text-orange-600";
    case "INACTIVITY_ALERT":
      return isDark ? "text-yellow-400" : "text-yellow-600";
    default:
      return isDark ? "text-gray-400" : "text-gray-600";
  }
};

const formatEventType = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "Ubicación";
    case "EMERGENCY_BUTTON_PRESSED":
      return "Emergencia";
    case "FALL_DETECTED":
      return "Caída";
    case "INACTIVITY_ALERT":
      return "Inactividad";
    default:
      return type;
  }
};

const getAlertMessage = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "Actualización de ubicación";
    case "EMERGENCY_BUTTON_PRESSED":
      return "Se presionó el botón de emergencia";
    case "FALL_DETECTED":
      return "Se detectó una caída";
    case "INACTIVITY_ALERT":
      return "Se detectó inactividad prolongada";
    default:
      return "Evento registrado";
  }
};

function formatDate(date: string) {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
    locale: es,
  });
}

export default function ActivityLogScreen() {
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const fetchActivityLog = async () => {
    try {
      console.log("Fetching activity logs...");
      const response = await API.getActivityLogs();
      console.log("Activity logs response:", response);

      if (response.data && Array.isArray(response.data)) {
        const formattedLog = response.data.map((log) => ({
          type: log.type as ActivityLogEntry["type"],
          createdAt: new Date(log.created_at).getTime(),
          message: getAlertMessage(log.type),
        }));
        console.log("Formatted activity log:", formattedLog);
        setActivityLog(formattedLog);
      } else {
        console.log("No data received or invalid format");
        setActivityLog([]);
      }
    } catch (error) {
      console.error("Error fetching activity log:", error);
      setActivityLog([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivityLog();
  };

  useEffect(() => {
    fetchActivityLog();
  }, []);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#fff" : "#000"}
          />
        }
      >
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-6">
            <Pressable
              className="p-2"
              onPress={() => router.push("/(tabs-caregiver)/home")}
              accessibilityLabel="Volver al panel principal"
              accessibilityRole="button"
              accessibilityHint="Presiona para volver al panel principal"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "#fff" : "#000"}
              />
            </Pressable>
            <Text
              className="text-2xl font-bold text-gray-800 dark:text-white"
              accessibilityRole="header"
            >
              Registro de Actividad
            </Text>
            <View className="w-8" />
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="mt-4 text-gray-600 dark:text-gray-300">
                Cargando actividad...
              </Text>
            </View>
          ) : activityLog.length > 0 ? (
            <View>
              {activityLog.map((entry, index) => (
                <View
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 p-4 mb-3 rounded-lg shadow-sm"
                >
                  <View className="flex-row items-center mb-2">
                    <View className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                      <Ionicons
                        name={getAlertIcon(entry.type)}
                        size={20}
                        color={isDark ? "#60A5FA" : "#2563EB"}
                      />
                    </View>
                    <Text
                      className={`ml-3 text-base font-semibold ${getAlertColor(
                        entry.type,
                        isDark
                      )}`}
                    >
                      {formatEventType(entry.type)}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {formatDate(entry.createdAt.toString())}
                  </Text>
                  <Text className="text-gray-700 dark:text-gray-300">
                    {entry.message}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="items-center justify-center py-8">
              <View className="items-center">
                <Ionicons
                  name="time-outline"
                  size={48}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
                <Text className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                  No hay registros de actividad disponibles.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
