import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapViewComponent from "@/components/MapViewComponent";
import API from "@/services/api";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";

export default function CaregiverHome() {
  const [seniorLocation, setSeniorLocation] = useState<{
    latitude: number;
    longitude: number;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
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
          created_at: latestLocation.created_at,
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

  const handleLocationPress = () => {
    if (!seniorLocation) return;

    const url = `https://www.google.com/maps/search/?api=1&query=${seniorLocation.latitude},${seniorLocation.longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error("Error opening maps:", err);
      Alert.alert("Error", "No se pudo abrir el mapa");
    });
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const locationTime = new Date(timestamp);
    const minutesAgo = differenceInMinutes(now, locationTime);

    if (minutesAgo < 1) return "Hace menos de un minuto";
    if (minutesAgo < 60) return `Hace ${minutesAgo} minutos`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `Hace ${hoursAgo} ${hoursAgo === 1 ? "hora" : "horas"}`;
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
            className="text-4xl font-bold text-gray-800 dark:text-white mb-2"
            accessibilityRole="header"
          >
            Panel de Cuidado
          </Text>
          <View className="flex-row items-center">
            <Ionicons
              name="time-outline"
              size={20}
              color={isDark ? "#9CA3AF" : "#4B5563"}
            />
            <Text
              className="text-gray-600 dark:text-gray-300 ml-2"
              accessibilityRole="text"
            >
              Última actualización: {lastUpdated}
            </Text>
          </View>
        </View>

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text
              className="text-2xl font-semibold text-gray-700 dark:text-gray-300"
              accessibilityRole="text"
            >
              Ubicación Actual
            </Text>
            <Pressable
              onPress={onRefresh}
              disabled={refreshing}
              className="p-2"
              accessibilityLabel="Actualizar ubicación"
              accessibilityHint="Presiona para actualizar la ubicación actual"
            >
              <Ionicons
                name="refresh-outline"
                size={24}
                color={isDark ? "#9CA3AF" : "#4B5563"}
              />
            </Pressable>
          </View>
          <View className="rounded-xl overflow-hidden shadow-lg">
            {seniorLocation ? (
              <>
                <MapViewComponent
                  location={seniorLocation}
                  height={400}
                  onLocationPress={handleLocationPress}
                />
                <View className="bg-white dark:bg-gray-800 p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="time-outline"
                        size={20}
                        color={isDark ? "#9CA3AF" : "#4B5563"}
                      />
                      <Text className="text-gray-600 dark:text-gray-400 ml-2">
                        {getTimeAgo(seniorLocation.created_at)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleLocationPress}
                      className="flex-row items-center bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded-lg"
                      accessibilityLabel="Abrir en Google Maps"
                      accessibilityHint="Presiona para abrir la ubicación en Google Maps"
                    >
                      <Ionicons
                        name="map-outline"
                        size={16}
                        color={isDark ? "#60A5FA" : "#2563EB"}
                      />
                      <Text className="text-blue-600 dark:text-blue-400 ml-2 text-sm">
                        Abrir en Maps
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <View className="h-64 justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                <Ionicons
                  name="location-outline"
                  size={48}
                  color={isDark ? "#9CA3AF" : "#4B5563"}
                />
                <Text className="text-gray-500 dark:text-gray-400 text-center px-4 mt-4">
                  {error || "No hay datos de ubicación disponibles"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
