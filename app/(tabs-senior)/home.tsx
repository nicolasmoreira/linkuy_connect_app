import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityService from "@/services/activityService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Ionicons } from "@expo/vector-icons";

const LOCATION_TASK_NAME = "background-location-task";
const INACTIVITY_TASK_NAME = "inactivity-alert-task";
const LOCATION_UPDATE_FETCH_TASK = "location-update-fetch-task";

async function updateLocation(location: Location.LocationObject) {
  try {
    console.log("Updating location:", location);
    await ActivityService.sendLocationUpdate(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      },
      0,
      0
    );
  } catch (error) {
    console.error("Error updating location:", error);
  }
}

export default function SeniorHome() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [backgroundPermission, setBackgroundPermission] =
    useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const currentLocationRef = useRef<Location.LocationObject | null>(null);

  useEffect(() => {
    initializeLocationTracking();
    return () => {
      stopLocationTracking();
    };
  }, []);

  const initializeLocationTracking = async () => {
    try {
      setError(null);
      setLoading(true);

      // Verificar si el userId está configurado
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        setError(
          "Usuario no configurado. Por favor, inicia sesión nuevamente."
        );
        return;
      }

      const user = JSON.parse(storedUser);
      ActivityService.setUserId(user.id);

      // Verificar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === "granted");

      if (status !== "granted") {
        setError("Se requieren permisos de ubicación para esta funcionalidad");
        return;
      }

      // Verificar permisos de ubicación en segundo plano
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      setBackgroundPermission(backgroundStatus === "granted");

      if (backgroundStatus !== "granted") {
        setError(
          "Se requieren permisos de ubicación en segundo plano para esta funcionalidad"
        );
        return;
      }

      // Iniciar el seguimiento de ubicación
      await startLocationTracking();
      setIsTracking(true);
    } catch (error) {
      console.error("Error initializing location tracking:", error);
      setError("Error al inicializar el seguimiento de ubicación");
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Exactamente 1 minuto
        distanceInterval: 0, // No importa la distancia
        foregroundService: {
          notificationTitle: "Seguimiento de ubicación",
          notificationBody: "Linkuy Connect está rastreando tu ubicación",
          notificationColor: "#2563EB",
        },
        activityType: Location.ActivityType.Other,
        showsBackgroundLocationIndicator: true,
      });
    } catch (error) {
      console.error("Error starting location tracking:", error);
      throw error;
    }
  };

  const stopLocationTracking = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(false);
    } catch (error) {
      console.error("Error stopping location tracking:", error);
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      // Obtener la ubicación actual
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Error",
          "Se requieren permisos de ubicación para enviar la alerta"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      console.log("[Emergency] Current location:", location);

      await ActivityService.sendAlert({
        type: "EMERGENCY_BUTTON_PRESSED",
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        },
      });

      Alert.alert(
        "Alerta Enviada",
        "Tu cuidador ha sido notificado de la emergencia"
      );
    } catch (error) {
      console.error("Error sending emergency alert:", error);
      Alert.alert("Error", "No se pudo enviar la alerta de emergencia");
    }
  };

  const handle911Call = () => {
    Linking.openURL("tel:911");
  };

  if (loading) {
    return (
      <View
        className="flex-1 bg-white dark:bg-gray-900 justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Inicializando seguimiento de ubicación...
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-2">
          {/* Header */}
          <View className="mb-4">
            <Text
              className="text-3xl font-bold text-gray-800 dark:text-white"
              accessibilityRole="header"
              accessibilityLabel="Bienvenido a Linkuy Connect"
            >
              ¡Bienvenido!
            </Text>
            <Text className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Estamos aquí para cuidarte
            </Text>
          </View>

          {error && (
            <View className="bg-red-100 dark:bg-red-900 p-4 rounded-xl mb-4">
              <Text className="text-red-700 dark:text-red-200 text-lg">
                {error}
              </Text>
            </View>
          )}

          {/* Botones de Emergencia */}
          <View className="mb-8">
            <Text
              className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2"
              accessibilityRole="text"
            >
              ¿Necesitas ayuda?
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
              Presiona uno de estos botones según tu emergencia
            </Text>

            {/* Botón de Alerta */}
            <View className="mb-8">
              <Pressable
                className="bg-red-600 px-6 py-5 rounded-3xl flex-row items-center justify-center active:bg-red-700"
                style={{
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
                onPress={handleEmergencyAlert}
                accessibilityRole="button"
                accessibilityLabel="Enviar alerta de emergencia"
                accessibilityHint="Presiona para enviar una alerta de emergencia a tu cuidador"
              >
                <View className="flex-row items-center w-full">
                  <View className="bg-red-500 p-3 rounded-2xl">
                    <Ionicons name="alert-circle" size={32} color="white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white text-xl font-bold">
                      Alertar a mi Cuidador
                    </Text>
                    <Text className="text-white text-base opacity-90">
                      Para emergencias no graves
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            {/* Botón de 911 */}
            <View className="mt-2">
              <Pressable
                className="bg-blue-600 px-6 py-5 rounded-3xl flex-row items-center justify-center active:bg-blue-700"
                style={{
                  shadowColor: "#2563EB",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
                onPress={handle911Call}
                accessibilityRole="button"
                accessibilityLabel="Llamar al 911"
                accessibilityHint="Presiona para llamar al servicio de emergencias 911"
              >
                <View className="flex-row items-center w-full">
                  <View className="bg-blue-500 p-3 rounded-2xl">
                    <Ionicons name="call" size={32} color="white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-white text-xl font-bold">
                      Llamar al 911
                    </Text>
                    <Text className="text-white text-base opacity-90">
                      Para emergencias graves
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Estado y Permisos en una tarjeta */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-6 overflow-hidden">
            <View className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <Text
                className="text-xl font-bold text-gray-800 dark:text-gray-200"
                accessibilityRole="text"
              >
                Estado del Sistema
              </Text>
            </View>

            <View className="p-4 space-y-4">
              {/* Estado del Seguimiento */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-2 rounded-full ${
                      isTracking ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Ionicons
                      name="location"
                      size={24}
                      color={isTracking ? "#22C55E" : "#EF4444"}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Seguimiento
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Tu ubicación está siendo monitoreada
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ${
                    isTracking
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isTracking ? "Activo" : "Inactivo"}
                </Text>
              </View>

              {/* Permisos */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-2 rounded-full ${
                      locationPermission ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={locationPermission ? "#22C55E" : "#EF4444"}
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Permisos
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400">
                      Acceso a tu ubicación
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ${
                    locationPermission
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {locationPermission ? "Concedido" : "Pendiente"}
                </Text>
              </View>
            </View>
          </View>

          {/* Instrucciones en una tarjeta */}
          <View className="bg-blue-50 dark:bg-blue-900 rounded-2xl shadow-md overflow-hidden">
            <View className="border-b border-blue-100 dark:border-blue-800 px-4 py-3">
              <Text
                className="text-xl font-bold text-blue-800 dark:text-blue-200"
                accessibilityRole="text"
              >
                Información Importante
              </Text>
            </View>

            <View className="p-4 space-y-4">
              <View className="flex-row items-start">
                <View className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                  <Ionicons
                    name="information-circle"
                    size={24}
                    color="#2563EB"
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-blue-800 dark:text-blue-200">
                    Seguimiento Automático
                  </Text>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Tu ubicación se actualiza cada minuto para mantenerte seguro
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-red-100 dark:bg-red-800 rounded-full p-2">
                  <Ionicons name="alert-circle" size={24} color="#DC2626" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-blue-800 dark:text-blue-200">
                    Botón de Alerta
                  </Text>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Usa el botón rojo para avisar a tu cuidador si necesitas
                    ayuda
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-blue-100 dark:bg-blue-800 rounded-full p-2">
                  <Ionicons name="call" size={24} color="#1E40AF" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium text-blue-800 dark:text-blue-200">
                    Llamada de Emergencia
                  </Text>
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    El botón azul te conecta directamente con el 911 para
                    emergencias graves
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Definir tareas en segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Error in location task:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    if (location) {
      const now = new Date();
      const seconds = now.getSeconds();
      // Solo enviamos la actualización si estamos en el segundo 0 del minuto
      if (seconds === 0) {
        console.log(
          "[Location] Sending location update at:",
          now.toISOString()
        );
        await updateLocation(location);
      } else {
        console.log(
          "[Location] Skipping update at:",
          now.toISOString(),
          "seconds:",
          seconds
        );
      }
    }
  }
});

TaskManager.defineTask(INACTIVITY_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Error in inactivity task:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    if (location) {
      await ActivityService.sendInactivityAlert(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
        },
        300 // 5 minutos de inactividad
      );
    }
  }
});
