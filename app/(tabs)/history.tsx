import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import API from "@/services/API";

export default function HistoryScreen() {
  const [history, setHistory] = useState<{ latitude: number; longitude: number; timestamp: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await API.getHistory();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching location history:", error);
      }
    };

    fetchHistory();
  }, []);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        Historial de Ubicaciones
      </Text>

      <ScrollView className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <View
              key={index}
              className="p-4 mb-2 border-b border-gray-300 dark:border-gray-600"
            >
              <Text className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {new Date(entry.timestamp).toLocaleString()}
              </Text>
              <Text className="text-gray-600 dark:text-gray-400">
                Lat: {entry.latitude}, Lng: {entry.longitude}
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            No hay datos de ubicación disponibles.
          </Text>
        )}
      </ScrollView>

      <Pressable
        className="bg-blue-600 p-4 rounded-xl mt-6 w-48 items-center"
        onPress={() => router.push("/(tabs)/home")}
        accessibilityLabel="Volver a la pantalla principal"
        role="button"
      >
        <Text className="text-white text-lg font-semibold">Volver</Text>
      </Pressable>
    </View>
  );
}
