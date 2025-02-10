import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import API from "@/services/API";
import EmergencyButton from "@/components/EmergencyButton"; // Botón de emergencia

export default function HomeScreen() {
  const [latestAlert, setLatestAlert] = useState<{ type: string; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const alerts = await API.getHistory();
        if (alerts.length > 0) {
          setLatestAlert(alerts[0]); // Última alerta recibida
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <ScrollView className="px-6 py-4">
        {/* Título */}
        <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
          Bienvenido a LinkuyConnect
        </Text>

        {/* Alerta más reciente */}
        {latestAlert ? (
          <View className="bg-red-500 p-4 rounded-lg mt-4">
            <Text className="text-white text-lg font-semibold">Alerta: {latestAlert.type}</Text>
            <Text className="text-white">{latestAlert.message}</Text>
          </View>
        ) : (
          <Text className="text-gray-600 dark:text-gray-300 text-center mt-4">
            No hay alertas recientes.
          </Text>
        )}

        {/* Botones de navegación */}
        <View className="flex-row justify-around mt-6">
          <Pressable
            className="bg-blue-600 px-6 py-3 rounded-xl"
            onPress={() => router.push("/(tabs)/caregiver")}
            accessibilityLabel="Ir a la pantalla de cuidadores"
            role="button"
          >
            <Text className="text-white text-lg font-semibold">Cuidadores</Text>
          </Pressable>

          <Pressable
            className="bg-gray-600 px-6 py-3 rounded-xl"
            onPress={() => router.push("/(tabs)/history")}
            accessibilityLabel="Ver historial de alertas"
            role="button"
          >
            <Text className="text-white text-lg font-semibold">Historial</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Botón de emergencia flotante */}
      <View className="absolute bottom-10 right-10">
        <EmergencyButton />
      </View>
    </SafeAreaView>
  );
}
