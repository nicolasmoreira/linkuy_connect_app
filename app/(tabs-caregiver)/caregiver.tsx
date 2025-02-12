// app/(tabs-caregiver)/caregiver.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import MapViewComponent from "@/components/MapViewComponent";
import api from "@/services/api";

export default function CaregiverDashboard() {
  const [seniorLocation, setSeniorLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const data = await api.getSeniorLocation();
        setSeniorLocation(data);
      } catch (error) {
        console.error("Error fetching senior location:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 60000); // Actualiza cada 60 segundos
    return () => clearInterval(interval);
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
        Panel de Cuidado
      </Text>

      <View className="mt-4">
        <MapViewComponent location={seniorLocation} />
      </View>

      <View className="flex-row justify-around mt-6">
        <Pressable
          className="bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.push("/(tabs-caregiver)/history")}
          accessibilityLabel="Ver historial de ubicaciones"
          role="button"
        >
          <Text className="text-white text-lg font-semibold">Historial</Text>
        </Pressable>

        <Pressable
          className="bg-gray-600 px-6 py-3 rounded-xl"
          onPress={() => router.push("/(tabs-caregiver)/settings")}
          accessibilityLabel="Abrir configuración"
          role="button"
        >
          <Text className="text-white text-lg font-semibold">Configuración</Text>
        </Pressable>
      </View>
    </View>
  );
}
