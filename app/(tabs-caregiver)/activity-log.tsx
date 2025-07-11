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
import API from "@/services/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ActivityLog, ActivityLogType } from "@/types/index";

const ACTIVITY_CONFIG: Record<
  ActivityLogType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: {
      dark: string;
      light: string;
    };
    displayName: string;
    message: string;
  }
> = {
  LOCATION_UPDATE: {
    icon: "location",
    color: {
      dark: "text-blue-400",
      light: "text-blue-600",
    },
    displayName: "Ubicación",
    message: "Actualización de ubicación",
  },
  FALL_DETECTED: {
    icon: "alert-circle",
    color: {
      dark: "text-orange-400",
      light: "text-orange-600",
    },
    displayName: "Caída",
    message: "Se detectó una caída",
  },
  INACTIVITY_ALERT: {
    icon: "time",
    color: {
      dark: "text-yellow-400",
      light: "text-yellow-600",
    },
    displayName: "Inactividad",
    message: "Se detectó inactividad prolongada",
  },
  EMERGENCY_BUTTON_PRESSED: {
    icon: "warning",
    color: {
      dark: "text-red-400",
      light: "text-red-600",
    },
    displayName: "Emergencia",
    message: "Se presionó el botón de emergencia",
  },
};

function formatDate(timestamp: string) {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.error("[ActivityLog] Invalid date:", timestamp);
      return "Fecha no disponible";
    }
    return format(date, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
      locale: es,
    });
  } catch (error) {
    console.error("[ActivityLog] Error formatting date:", error);
    return "Fecha no disponible";
  }
}

export default function ActivityLogScreen() {
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
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
        const formattedLog = response.data.map((log) => {
          console.log("[ActivityLog] Processing entry:", {
            type: log.type,
            created_at: log.created_at,
          });

          return {
            ...log,
            message: ACTIVITY_CONFIG[log.type as ActivityLogType].message,
          } as ActivityLog;
        });
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
                        name={ACTIVITY_CONFIG[entry.type].icon}
                        size={20}
                        color={isDark ? "#60A5FA" : "#2563EB"}
                      />
                    </View>
                    <Text
                      className={`ml-3 text-base font-semibold ${
                        isDark
                          ? ACTIVITY_CONFIG[entry.type].color.dark
                          : ACTIVITY_CONFIG[entry.type].color.light
                      }`}
                    >
                      {ACTIVITY_CONFIG[entry.type].displayName}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {formatDate(entry.created_at)}
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
