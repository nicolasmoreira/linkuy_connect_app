import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import MapViewComponent from "@/components/MapViewComponent";
import API from "@/services/API";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CaregiverHome() {
  const [seniorLocation, setSeniorLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLocation = async () => {
    try {
      setError(null);
      const response = await API.getActivityLogLocations();
      if (response.data && response.data.length > 0) {
        const latestLocation = response.data[0];
        setSeniorLocation({
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
        });
        setLastUpdated(format(new Date(), "HH:mm:ss", { locale: es }));
      } else {
        setSeniorLocation(null);
        setError("No hay datos de ubicación disponibles");
      }
    } catch (error) {
      console.error("Error fetching senior location:", error);
      setError(
        "Error al obtener la ubicación. Verifica tu conexión a internet."
      );
      setSeniorLocation(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocation();
  };

  if (loading) {
    return (
      <View
        className="flex-1 bg-white dark:bg-gray-900 justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Cargando ubicación...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-gray-900"
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
        <View className="items-center mb-6">
          <Text
            className="text-3xl font-bold text-gray-800 dark:text-white mb-2"
            accessibilityRole="header"
          >
            Panel de Cuidado
          </Text>
          <Text
            className="text-gray-600 dark:text-gray-300"
            accessibilityRole="text"
          >
            Última actualización: {lastUpdated}
          </Text>
        </View>

        <View className="mb-6">
          <Text
            className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2"
            accessibilityRole="text"
          >
            Ubicación Actual
          </Text>
          <View className="h-64 rounded-xl overflow-hidden">
            {seniorLocation ? (
              <MapViewComponent location={seniorLocation} />
            ) : (
              <View className="flex-1 justify-center items-center bg-gray-100 dark:bg-gray-800">
                <Text className="text-gray-500 dark:text-gray-400 text-center px-4">
                  {error || "No hay datos de ubicación disponibles"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View className="flex-row justify-around space-x-4">
          <Pressable
            className={`
              flex-1 bg-blue-600 px-6 py-4 rounded-xl
              ${refreshing ? "opacity-70" : ""}
            `}
            onPress={() => router.push("/(tabs-caregiver)/activity-log")}
            disabled={refreshing}
            accessibilityLabel="Ver historial de ubicaciones"
            accessibilityRole="button"
            accessibilityHint="Presiona para ver el historial de ubicaciones"
            accessibilityState={{ disabled: refreshing }}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Historial
            </Text>
          </Pressable>

          <Pressable
            className={`
              flex-1 bg-gray-600 px-6 py-4 rounded-xl
              ${refreshing ? "opacity-70" : ""}
            `}
            onPress={() => router.push("/(tabs-caregiver)/settings")}
            disabled={refreshing}
            accessibilityLabel="Abrir configuración"
            accessibilityRole="button"
            accessibilityHint="Presiona para abrir la configuración"
            accessibilityState={{ disabled: refreshing }}
          >
            <Text className="text-white text-lg font-semibold text-center">
              Configuración
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
