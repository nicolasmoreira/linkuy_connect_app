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
  AccessibilityInfo,
  Keyboard,
  findNodeHandle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as BackgroundFetch from "expo-background-fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityService from "@/services/activityService";
import FallDetectionService from "@/services/fallDetectionService";
import { Ionicons } from "@expo/vector-icons";
import { SENSOR_CONFIG } from "@/services/config";

const LOCATION_TASK_NAME = "background-location-task";
const FALL_DETECTION_TASK_NAME = "background-fall-detection-task";

async function updateLocation(location: Location.LocationObject) {
  try {
    console.log("[Location] Updating location:", {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date().toISOString(),
    });

    // Guardar la ubicación en AsyncStorage para uso en detección de caídas
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: new Date().toISOString(),
    };

    console.log("[Location] Storing location data:", locationData);
    await AsyncStorage.setItem(
      "lastLocationData",
      JSON.stringify(locationData)
    );

    // Verificar que se guardó correctamente
    const storedData = await AsyncStorage.getItem("lastLocationData");
    console.log("[Location] Stored data verification:", storedData);

    await ActivityService.sendLocationUpdate(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
      },
      0,
      0
    );
    console.log("[Location] Update successful");
  } catch (error) {
    console.error("[Location] Error updating location:", error);
  }
}

export default function SeniorHome() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isFallDetectionActive, setIsFallDetectionActive] =
    useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const emergencyButtonRef = useRef(null);
  const call911ButtonRef = useRef(null);

  // Solicitar permisos inmediatamente al montar el componente
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // Solicitar permisos de ubicación en primer plano
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === "granted");

        if (status === "granted") {
          // Solicitar permisos de ubicación en segundo plano
          const { status: backgroundStatus } =
            await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus === "denied") {
            Alert.alert(
              "Permisos de Ubicación",
              "Linkuy Connect necesita acceso a tu ubicación en segundo plano para funcionar correctamente. Por favor, ve a Configuración > Linkuy Connect > Ubicación y selecciona 'Siempre'.",
              [
                {
                  text: "Ir a Configuración",
                  onPress: () => Linking.openSettings(),
                },
                {
                  text: "Cancelar",
                  style: "cancel",
                },
              ]
            );
          }
        }
      } catch (error) {
        console.error("Error requesting permissions:", error);
      }
    };

    requestPermissions();
  }, []);

  // Inicializar el seguimiento de ubicación
  useEffect(() => {
    initializeLocationTracking();
    return () => {
      stopLocationTracking();
      FallDetectionService.getInstance().stopTracking();
    };
  }, []);

  // Add screen reader announcement when important state changes
  useEffect(() => {
    if (!loading) {
      const announcement = `Pantalla principal de Linkuy Connect. ${
        isTracking ? "Seguimiento activo" : "Seguimiento inactivo"
      }. ${
        isFallDetectionActive
          ? "Detección de caídas activa"
          : "Detección de caídas inactiva"
      }. ${
        locationPermission
          ? "Permisos de ubicación concedidos"
          : "Permisos de ubicación pendientes"
      }`;

      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [loading, isTracking, isFallDetectionActive, locationPermission]);

  // Add screen reader announcement for error states
  useEffect(() => {
    if (error) {
      AccessibilityInfo.announceForAccessibility(`Error: ${error}`);
    }
  }, [error]);

  // Añadir soporte para navegación por teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        // Enfocar el primer botón cuando se muestra el teclado
        if (emergencyButtonRef.current) {
          const reactTag = findNodeHandle(emergencyButtonRef.current);
          if (reactTag) {
            AccessibilityInfo.setAccessibilityFocus(reactTag);
          }
        }
      }
    );

    return () => {
      keyboardDidShowListener.remove();
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

      // Registrar la tarea de detección de caídas
      console.log("[FallDetection] Registering fall detection task...");
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(
        FALL_DETECTION_TASK_NAME
      );
      console.log("[FallDetection] Task registered:", isTaskRegistered);

      if (!isTaskRegistered) {
        console.log("[FallDetection] Task not registered, registering now...");
        await TaskManager.defineTask(
          FALL_DETECTION_TASK_NAME,
          async ({ data, error }) => {
            if (error) {
              console.error(
                "[FallDetection] Error in fall detection task:",
                error
              );
              return BackgroundFetch.BackgroundFetchResult.Failed;
            }

            try {
              console.log("[FallDetection] Task executed with data:", data);

              // Obtener la última caída detectada
              const lastFallDetection = await AsyncStorage.getItem(
                "lastFallDetection"
              );
              console.log(
                "[FallDetection] Last fall detection:",
                lastFallDetection
              );

              if (!lastFallDetection) {
                console.log("[FallDetection] No fall detection to process");
                return BackgroundFetch.BackgroundFetchResult.NoData;
              }

              const fallData = JSON.parse(lastFallDetection);

              // Si ya fue procesada, no hacer nada
              if (fallData.processed) {
                console.log("[FallDetection] Fall already processed");
                return BackgroundFetch.BackgroundFetchResult.NoData;
              }

              // Enviar la alerta de caída
              await ActivityService.sendFallDetected(
                fallData.location,
                fallData.magnitude,
                SENSOR_CONFIG.POST_FALL_INACTIVITY
              );

              // Marcar como procesada
              await AsyncStorage.setItem(
                "lastFallDetection",
                JSON.stringify({
                  ...fallData,
                  processed: true,
                })
              );

              return BackgroundFetch.BackgroundFetchResult.NewData;
            } catch (error) {
              console.error(
                "[FallDetection] Error in fall detection task:",
                error
              );
              return BackgroundFetch.BackgroundFetchResult.Failed;
            }
          }
        );
      }

      // Iniciar el seguimiento de ubicación
      await startLocationTracking();
      setIsTracking(true);

      // Iniciar la detección de caídas
      console.log("[FallDetection] Starting fall detection tracking...");
      await FallDetectionService.getInstance().startTracking();
      setIsFallDetectionActive(true);
      console.log(
        "[FallDetection] Fall detection tracking started successfully"
      );
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

      await ActivityService.sendEmergencyButtonPressed({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
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
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16),
        }}
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
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
      }}
      accessibilityRole="none"
      accessibilityLabel="Pantalla principal de Linkuy Connect"
      accessibilityHint="Pantalla principal con botones de emergencia y estado del sistema"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        accessibilityRole="none"
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 py-2">
          {/* Header */}
          <View className="mb-4">
            <Text
              className="text-3xl font-bold text-gray-800 dark:text-white"
              accessibilityRole="header"
              accessibilityLabel="Linkuy Connect"
              accessibilityHint="Título de la aplicación"
            >
              Linkuy Connect
            </Text>
          </View>

          {error && (
            <View
              className="bg-red-100 dark:bg-red-900 p-4 rounded-xl mb-4"
              accessibilityRole="alert"
              accessibilityLabel="Mensaje de error"
              accessibilityHint="Información importante sobre un error"
            >
              <Text className="text-red-700 dark:text-red-200 text-lg">
                {error}
              </Text>
            </View>
          )}

          {/* Botones de Emergencia */}
          <View
            className="mb-8"
            accessibilityRole="none"
            accessibilityLabel="Botones de emergencia"
            accessibilityHint="Sección con botones para situaciones de emergencia"
          >
            <View className="mb-8">
              <Pressable
                ref={emergencyButtonRef}
                className="bg-red-600 px-8 py-6 rounded-3xl flex-row items-center justify-center active:bg-red-700"
                style={{
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                  minHeight: 56,
                }}
                onPress={handleEmergencyAlert}
                accessibilityRole="button"
                accessibilityLabel="Enviar alerta de emergencia"
                accessibilityHint="Presiona para enviar una alerta de emergencia a tu cuidador. Para emergencias no graves."
                accessibilityState={{ disabled: loading }}
                accessibilityActions={[
                  { name: "activate", label: "Enviar alerta" },
                  {
                    name: "longpress",
                    label: "Enviar alerta con confirmación",
                  },
                ]}
                onAccessibilityAction={({ nativeEvent: { actionName } }) => {
                  if (actionName === "longpress") {
                    Alert.alert(
                      "Confirmar Alerta",
                      "¿Estás seguro de que deseas enviar una alerta de emergencia?",
                      [
                        {
                          text: "Cancelar",
                          style: "cancel",
                        },
                        {
                          text: "Enviar",
                          onPress: handleEmergencyAlert,
                        },
                      ]
                    );
                  }
                }}
              >
                <View className="flex-row items-center w-full">
                  <View
                    className="bg-red-500 p-4 rounded-2xl"
                    style={{ minWidth: 48, minHeight: 48 }}
                    accessibilityRole="image"
                    accessibilityLabel="Icono de alerta"
                  >
                    <Ionicons name="alert-circle" size={32} color="white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="text-white text-xl font-bold"
                      accessibilityRole="text"
                    >
                      Alertar a mi Cuidador
                    </Text>
                    <Text
                      className="text-white text-base opacity-90"
                      accessibilityRole="text"
                    >
                      Para emergencias no graves
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>

            <View className="mt-2">
              <Pressable
                ref={call911ButtonRef}
                className="bg-blue-600 px-8 py-6 rounded-3xl flex-row items-center justify-center active:bg-blue-700"
                style={{
                  shadowColor: "#2563EB",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                  minHeight: 56,
                }}
                onPress={handle911Call}
                accessibilityRole="button"
                accessibilityLabel="Llamar al 911"
                accessibilityHint="Presiona para llamar al servicio de emergencias 911. Para emergencias graves."
                accessibilityState={{ disabled: loading }}
                accessibilityActions={[
                  { name: "activate", label: "Llamar al 911" },
                  {
                    name: "longpress",
                    label: "Llamar al 911 con confirmación",
                  },
                ]}
                onAccessibilityAction={({ nativeEvent: { actionName } }) => {
                  if (actionName === "longpress") {
                    Alert.alert(
                      "Confirmar Llamada",
                      "¿Estás seguro de que deseas llamar al 911?",
                      [
                        {
                          text: "Cancelar",
                          style: "cancel",
                        },
                        {
                          text: "Llamar",
                          onPress: handle911Call,
                        },
                      ]
                    );
                  }
                }}
              >
                <View className="flex-row items-center w-full">
                  <View
                    className="bg-blue-500 p-3 rounded-2xl"
                    accessibilityRole="image"
                    accessibilityLabel="Icono de llamada"
                  >
                    <Ionicons name="call" size={32} color="white" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text
                      className="text-white text-xl font-bold"
                      accessibilityRole="text"
                    >
                      Llamar al 911
                    </Text>
                    <Text
                      className="text-white text-base opacity-90"
                      accessibilityRole="text"
                    >
                      Para emergencias graves
                    </Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Estado y Permisos en una tarjeta */}
          <View
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-md mb-6 overflow-hidden"
            accessibilityRole="none"
            accessibilityLabel="Estado del sistema"
            accessibilityHint="Sección que muestra el estado actual del sistema"
          >
            <View className="p-6">
              {/* Estado del Seguimiento */}
              <View className="flex-row justify-between items-center mb-8">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-4 rounded-full ${
                      isTracking ? "bg-green-100" : "bg-red-100"
                    }`}
                    style={{ minWidth: 48, minHeight: 48 }}
                    accessibilityRole="image"
                    accessibilityLabel={`Estado del seguimiento: ${
                      isTracking ? "Activo" : "Inactivo"
                    }`}
                    accessibilityHint="Indica si el seguimiento de ubicación está activo"
                  >
                    <Ionicons
                      name="location"
                      size={24}
                      color={isTracking ? "#15803D" : "#B91C1C"}
                    />
                  </View>
                  <View className="ml-5 flex-1">
                    <Text
                      className="text-base font-medium text-gray-900 dark:text-gray-100"
                      accessibilityRole="text"
                    >
                      Seguimiento
                    </Text>
                    <Text
                      className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                      accessibilityRole="text"
                    >
                      Tu ubicación está siendo monitoreada
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ml-4 ${
                    isTracking
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                  accessibilityRole="text"
                  accessibilityLabel={`Estado: ${
                    isTracking ? "Activo" : "Inactivo"
                  }`}
                  accessibilityHint={`El seguimiento está ${
                    isTracking ? "activo" : "inactivo"
                  }`}
                >
                  {isTracking ? "Activo" : "Inactivo"}
                </Text>
              </View>

              {/* Estado de la Detección de Caídas */}
              <View className="flex-row justify-between items-center mb-8">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-4 rounded-full ${
                      isFallDetectionActive ? "bg-green-100" : "bg-red-100"
                    }`}
                    style={{ minWidth: 48, minHeight: 48 }}
                    accessibilityRole="image"
                    accessibilityLabel={`Estado de detección de caídas: ${
                      isFallDetectionActive ? "Activo" : "Inactivo"
                    }`}
                    accessibilityHint="Indica si la detección de caídas está activa"
                  >
                    <Ionicons
                      name="alert-circle"
                      size={24}
                      color={isFallDetectionActive ? "#15803D" : "#B91C1C"}
                    />
                  </View>
                  <View className="ml-5 flex-1">
                    <Text
                      className="text-base font-medium text-gray-900 dark:text-gray-100"
                      accessibilityRole="text"
                    >
                      Detección de Caídas
                    </Text>
                    <Text
                      className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                      accessibilityRole="text"
                    >
                      Sistema de detección de caídas
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ml-4 ${
                    isFallDetectionActive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                  accessibilityRole="text"
                  accessibilityLabel={`Estado: ${
                    isFallDetectionActive ? "Activo" : "Inactivo"
                  }`}
                  accessibilityHint={`La detección de caídas está ${
                    isFallDetectionActive ? "activa" : "inactiva"
                  }`}
                >
                  {isFallDetectionActive ? "Activo" : "Inactivo"}
                </Text>
              </View>

              {/* Permisos */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-4 rounded-full ${
                      locationPermission ? "bg-green-100" : "bg-red-100"
                    }`}
                    style={{ minWidth: 48, minHeight: 48 }}
                    accessibilityRole="image"
                    accessibilityLabel={`Estado de permisos: ${
                      locationPermission ? "Concedido" : "Pendiente"
                    }`}
                    accessibilityHint="Indica si los permisos de ubicación están concedidos"
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={locationPermission ? "#15803D" : "#B91C1C"}
                    />
                  </View>
                  <View className="ml-5 flex-1">
                    <Text
                      className="text-base font-medium text-gray-900 dark:text-gray-100"
                      accessibilityRole="text"
                    >
                      Permisos
                    </Text>
                    <Text
                      className="text-sm text-gray-700 dark:text-gray-300 mt-1"
                      accessibilityRole="text"
                    >
                      Acceso a tu ubicación
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ml-4 ${
                    locationPermission
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                  accessibilityRole="text"
                  accessibilityLabel={`Estado: ${
                    locationPermission ? "Concedido" : "Pendiente"
                  }`}
                  accessibilityHint={`Los permisos de ubicación están ${
                    locationPermission ? "concedidos" : "pendientes"
                  }`}
                >
                  {locationPermission ? "Concedido" : "Pendiente"}
                </Text>
              </View>
            </View>
          </View>

          {/* Instrucciones en una tarjeta */}
          <View
            className="bg-blue-50 dark:bg-blue-900 rounded-2xl shadow-md overflow-hidden"
            accessibilityRole="none"
            accessibilityLabel="Información importante"
            accessibilityHint="Sección con información importante sobre el uso de la aplicación"
          >
            <View className="border-b border-blue-100 dark:border-blue-800 px-4 py-3">
              <Text
                className="text-xl font-bold text-blue-800 dark:text-blue-200"
                accessibilityRole="header"
                accessibilityLabel="Información importante"
                accessibilityHint="Título de la sección de información"
              >
                Información Importante
              </Text>
            </View>

            <View className="p-4 space-y-4">
              <View className="flex-row items-start">
                <View
                  className="bg-red-100 dark:bg-red-800 rounded-full p-2"
                  accessibilityRole="image"
                  accessibilityLabel="Icono de alerta"
                  accessibilityHint="Icono que indica información sobre alertas"
                >
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={isDark ? "#F87171" : "#DC2626"}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="text-base font-medium text-blue-800 dark:text-blue-200"
                    accessibilityRole="text"
                  >
                    Botón de Alerta
                  </Text>
                  <Text
                    className="text-sm text-blue-700 dark:text-blue-300"
                    accessibilityRole="text"
                  >
                    Usa el botón rojo para avisar a tu cuidador si necesitas
                    ayuda
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View
                  className="bg-blue-100 dark:bg-blue-800 rounded-full p-2"
                  accessibilityRole="image"
                  accessibilityLabel="Icono de llamada"
                  accessibilityHint="Icono que indica información sobre llamadas de emergencia"
                >
                  <Ionicons
                    name="call"
                    size={24}
                    color={isDark ? "#60A5FA" : "#1E40AF"}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    className="text-base font-medium text-blue-800 dark:text-blue-200"
                    accessibilityRole="text"
                  >
                    Llamada de Emergencia
                  </Text>
                  <Text
                    className="text-sm text-blue-700 dark:text-blue-300"
                    accessibilityRole="text"
                  >
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
    console.error("[Location] Error in location task:", error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    if (location) {
      const now = new Date();
      const lastUpdate = await AsyncStorage.getItem("lastLocationUpdate");
      const lastUpdateTime = lastUpdate ? new Date(lastUpdate) : null;

      console.log("[Location] Task received data:", {
        currentTime: now.toISOString(),
        lastUpdateTime: lastUpdateTime?.toISOString(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
        },
      });

      // Si no hay última actualización o han pasado más de 60 segundos
      if (!lastUpdateTime || now.getTime() - lastUpdateTime.getTime() > 60000) {
        console.log(
          "[Location] Sending location update at:",
          now.toISOString()
        );
        await updateLocation(location);
        await AsyncStorage.setItem("lastLocationUpdate", now.toISOString());
      } else {
        const timeSinceLastUpdate =
          (now.getTime() - lastUpdateTime.getTime()) / 1000;
        console.log(
          "[Location] Skipping update - too soon since last update:",
          {
            secondsSinceLastUpdate: timeSinceLastUpdate,
            nextUpdateIn: 60 - timeSinceLastUpdate,
          }
        );
      }
    } else {
      console.log("[Location] No location data received in task");
    }
  } else {
    console.log("[Location] No data received in task");
  }
});
