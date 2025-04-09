// app/(tabs-caregiver)/history.tsx
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

interface HistoryEntry {
  type: "fall" | "inactivity" | "emergency";
  createdAt: number;
  message: string;
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case "fall":
      return "alert-circle";
    case "inactivity":
      return "time";
    case "emergency":
      return "warning";
    default:
      return "information-circle";
  }
};

const getAlertColor = (type: string, isDark: boolean) => {
  switch (type) {
    case "fall":
      return isDark ? "text-red-400" : "text-red-600";
    case "inactivity":
      return isDark ? "text-yellow-400" : "text-yellow-600";
    case "emergency":
      return isDark ? "text-red-500" : "text-red-700";
    default:
      return isDark ? "text-gray-400" : "text-gray-600";
  }
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const fetchHistory = async () => {
    try {
      const data = await API.getHistory();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <View
        className="flex-1 bg-white dark:bg-gray-900 justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Cargando historial...
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ paddingTop: insets.top }}
    >
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            className="p-2"
            onPress={() => router.push("/(tabs-caregiver)/caregiver")}
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
            Historial de Alertas
          </Text>
          <View className="w-8" /> {/* Spacer for alignment */}
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#fff" : "#000"}
            />
          }
        >
          {history.length > 0 ? (
            history.map((entry, index) => (
              <View
                key={index}
                className="bg-gray-100 dark:bg-gray-800 p-4 mb-3 rounded-lg"
              >
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name={getAlertIcon(entry.type)}
                    size={24}
                    className={getAlertColor(entry.type, isDark)}
                  />
                  <Text
                    className={`ml-2 text-lg font-semibold ${getAlertColor(entry.type, isDark)}`}
                  >
                    {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                  </Text>
                </View>
                <Text
                  className="text-gray-600 dark:text-gray-300 mb-1"
                  accessibilityRole="text"
                >
                  {new Date(entry.createdAt).toLocaleString()}
                </Text>
                <Text
                  className="text-gray-700 dark:text-gray-200"
                  accessibilityRole="text"
                >
                  {entry.message}
                </Text>
              </View>
            ))
          ) : (
            <View
              className="items-center justify-center py-8"
              accessibilityRole="text"
            >
              <Ionicons
                name="time-outline"
                size={48}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
              <Text className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                No hay historial de alertas disponible.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
