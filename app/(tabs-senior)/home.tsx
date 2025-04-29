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
            console.log("[FallDetection] Task executed with data:", data);
            if (error) {
              console.error("[FallDetection] Task error:", error);
              return;
            }
            if (data) {
              console.log("[FallDetection] Task received data:", data);

              // Obtener el último dato del sensor
              const lastSensorData = await AsyncStorage.getItem(
                "lastSensorData"
              );
              console.log("[FallDetection] Last sensor data:", lastSensorData);

              if (lastSensorData) {
                const sensorData = JSON.parse(lastSensorData);
                const magnitude = Math.sqrt(
                  Math.pow(sensorData.x, 2) +
                    Math.pow(sensorData.y, 2) +
                    Math.pow(sensorData.z, 2)
                );

                console.log("[FallDetection] Processing sensor data:", {
                  magnitude: magnitude.toFixed(2),
                  threshold: SENSOR_CONFIG.FALL_THRESHOLD,
                  isAboveThreshold: magnitude > SENSOR_CONFIG.FALL_THRESHOLD,
                });

                if (magnitude > SENSOR_CONFIG.FALL_THRESHOLD) {
                  try {
                    // Obtener la última ubicación guardada
                    const lastLocationData = await AsyncStorage.getItem(
                      "lastLocationData"
                    );
                    console.log(
                      "[FallDetection] Raw last location data from storage:",
                      lastLocationData
                    );

                    if (lastLocationData) {
                      const location = JSON.parse(lastLocationData);
                      console.log(
                        "[FallDetection] Parsed location data:",
                        location
                      );

                      if (location.latitude && location.longitude) {
                        console.log(
                          "[FallDetection] Sending fall detected with location:",
                          {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            accuracy: location.accuracy,
                          }
                        );

                        await ActivityService.sendFallDetected(
                          {
                            latitude: location.latitude,
                            longitude: location.longitude,
                            accuracy: location.accuracy,
                          },
                          magnitude,
                          SENSOR_CONFIG.POST_FALL_INACTIVITY
                        );
                      } else {
                        console.error(
                          "[FallDetection] Invalid location data:",
                          location
                        );
                        throw new Error("Invalid location data");
                      }
                    } else {
                      console.error(
                        "[FallDetection] No location data found in storage"
                      );
                      throw new Error("No location data available");
                    }
                  } catch (locationError) {
                    console.error(
                      "[FallDetection] Error processing location:",
                      locationError
                    );
                    // Enviar la alerta de caída sin ubicación
                    await ActivityService.sendFallDetected(
                      {
                        latitude: 0,
                        longitude: 0,
                        accuracy: 0,
                      },
                      magnitude,
                      SENSOR_CONFIG.POST_FALL_INACTIVITY
                    );
                  }
                }
              } else {
                console.log("[FallDetection] No sensor data available");
              }
            } else {
              console.log("[FallDetection] No data received in task");
            }
            return BackgroundFetch.BackgroundFetchResult.NewData;
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
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-2">
          {/* Header */}
          <View className="mb-4">
            <Text
              className="text-3xl font-bold text-gray-800 dark:text-white"
              accessibilityRole="header"
              accessibilityLabel="Linkuy Connect"
            >
              Linkuy Connect
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
            <View className="p-6 space-y-6">
              {/* Estado del Seguimiento */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-3 rounded-full ${
                      isTracking ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Ionicons
                      name="location"
                      size={24}
                      color={isTracking ? "#22C55E" : "#EF4444"}
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Seguimiento
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

              {/* Estado de la Detección de Caídas */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-3 rounded-full ${
                      isFallDetectionActive ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={24}
                      color={isFallDetectionActive ? "#22C55E" : "#EF4444"}
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Detección de Caídas
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Sistema de detección de caídas
                    </Text>
                  </View>
                </View>
                <Text
                  className={`text-base font-bold ${
                    isFallDetectionActive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isFallDetectionActive ? "Activo" : "Inactivo"}
                </Text>
              </View>

              {/* Permisos */}
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View
                    className={`p-3 rounded-full ${
                      locationPermission ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={24}
                      color={locationPermission ? "#22C55E" : "#EF4444"}
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Permisos
                    </Text>
                    <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                <View className="bg-red-100 dark:bg-red-800 rounded-full p-2">
                  <Ionicons
                    name="alert-circle"
                    size={24}
                    color={isDark ? "#F87171" : "#DC2626"}
                  />
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
                  <Ionicons
                    name="call"
                    size={24}
                    color={isDark ? "#60A5FA" : "#1E40AF"}
                  />
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

TaskManager.defineTask(FALL_DETECTION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("[FallDetection] Error in fall detection task:", error);
    return;
  }
  if (data) {
    console.log("[FallDetection] Task received data:", data);

    // Obtener el último dato del sensor
    const lastSensorData = await AsyncStorage.getItem("lastSensorData");
    console.log("[FallDetection] Last sensor data:", lastSensorData);

    if (lastSensorData) {
      const sensorData = JSON.parse(lastSensorData);
      const magnitude = Math.sqrt(
        Math.pow(sensorData.x, 2) +
          Math.pow(sensorData.y, 2) +
          Math.pow(sensorData.z, 2)
      );

      console.log("[FallDetection] Processing sensor data:", {
        magnitude: magnitude.toFixed(2),
        threshold: SENSOR_CONFIG.FALL_THRESHOLD,
        isAboveThreshold: magnitude > SENSOR_CONFIG.FALL_THRESHOLD,
      });

      if (magnitude > SENSOR_CONFIG.FALL_THRESHOLD) {
        try {
          // Obtener la última ubicación guardada
          const lastLocationData = await AsyncStorage.getItem(
            "lastLocationData"
          );
          console.log(
            "[FallDetection] Raw last location data from storage:",
            lastLocationData
          );

          if (lastLocationData) {
            const location = JSON.parse(lastLocationData);
            console.log("[FallDetection] Parsed location data:", location);

            if (location.latitude && location.longitude) {
              console.log(
                "[FallDetection] Sending fall detected with location:",
                {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                }
              );

              await ActivityService.sendFallDetected(
                {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy,
                },
                magnitude,
                SENSOR_CONFIG.POST_FALL_INACTIVITY
              );
            } else {
              console.error("[FallDetection] Invalid location data:", location);
              throw new Error("Invalid location data");
            }
          } else {
            console.error("[FallDetection] No location data found in storage");
            throw new Error("No location data available");
          }
        } catch (locationError) {
          console.error(
            "[FallDetection] Error processing location:",
            locationError
          );
          // Enviar la alerta de caída sin ubicación
          await ActivityService.sendFallDetected(
            {
              latitude: 0,
              longitude: 0,
              accuracy: 0,
            },
            magnitude,
            SENSOR_CONFIG.POST_FALL_INACTIVITY
          );
        }
      }
    } else {
      console.log("[FallDetection] No sensor data available");
    }
  } else {
    console.log("[FallDetection] No data received in task");
  }
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
