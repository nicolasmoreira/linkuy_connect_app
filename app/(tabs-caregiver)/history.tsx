// app/(tabs-caregiver)/history.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";

interface HistoryEntry {
  type: "fall" | "inactivity" | "emergency";
  createdAt: number;
  message: string;
}

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        History of Alerts
      </Text>

      <ScrollView className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <View key={index} className="p-4 mb-2 border-b border-gray-300 dark:border-gray-600">
              <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {new Date(entry.createdAt).toLocaleString()}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                Type: {entry.type}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                Message: {entry.message}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            No alert history available.
          </Text>
        )}
      </ScrollView>

      <Pressable
        className="bg-blue-600 p-4 rounded-xl mt-6 w-48 items-center"
        onPress={() => router.push("/(tabs-caregiver)/caregiver")}
        accessibilityLabel="Back to Dashboard"
        role="button"
      >
        <Text className="text-white text-lg font-semibold">Back</Text>
      </Pressable>
    </View>
  );
}
