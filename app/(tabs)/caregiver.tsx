import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import MapViewComponent from "@/components/MapViewComponent";
import API from "@/services/API";

export default function CaregiverDashboard() {
  const [seniorLocation, setSeniorLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await API.getSeniorLocation();
        setSeniorLocation(data);
      } catch (error) {
        console.error("Error fetching senior location:", error);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        Panel de Cuidado
      </Text>

      <View className="mt-4">
        <MapViewComponent location={seniorLocation} />
      </View>

      <View className="flex-row justify-around mt-6">
        <Pressable
          className="bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.push("/(tabs)/history")}
          accessibilityLabel="Ver historial de ubicaciones"
          role="button"
        >
          <Text className="text-white text-lg font-semibold">Historial</Text>
        </Pressable>

        <Pressable
          className="bg-gray-600 px-6 py-3 rounded-xl"
          onPress={() => router.push("/(tabs)/settings")}
          accessibilityLabel="Abrir configuración"
          role="button"
        >
          <Text className="text-white text-lg font-semibold">Configuración</Text>
        </Pressable>
      </View>
    </View>
  );
}
