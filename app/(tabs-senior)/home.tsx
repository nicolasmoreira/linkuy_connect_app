import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityService from "@/services/activityService";
import { Location as AppLocation } from "@/types";

/* ------------------------------------------------------------------
   Tipos y Constantes
------------------------------------------------------------------ */

type AccelerometerSubscription = { remove: () => void };
type LocationSubscription = { remove: () => void };

type LocationTaskEvent = {
  data?: {
    locations: Location.LocationObject[];
  };
  error?: any;
};

const LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";
const INACTIVITY_TASK_NAME = "BACKGROUND_INACTIVITY_TASK";
const LOCATION_UPDATE_FETCH_TASK = "BACKGROUND_LOCATION_UPDATE_FETCH_TASK";
const FALL_THRESHOLD = 3.5;
const INACTIVITY_THRESHOLD_SECONDS = 300; // 5 minutes

// Claves para AsyncStorage
const STORAGE_KEYS = {
  LAST_MOVEMENT_TIME: "INACTIVITY:lastMovementTime",
  LATEST_LOCATION_LAT: "INACTIVITY:latestLocationLat",
  LATEST_LOCATION_LON: "INACTIVITY:latestLocationLon",
};

/* ------------------------------------------------------------------
   Funciones de Persistencia
------------------------------------------------------------------ */

async function storeLastMovementTime(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_MOVEMENT_TIME,
      timestamp.toString()
    );
  } catch (error) {
    console.error("Error guardando lastMovementTime:", error);
  }
}

async function getLastMovementTime(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_MOVEMENT_TIME);
    return value ? parseInt(value, 10) : Date.now();
  } catch (error) {
    console.error("Error leyendo lastMovementTime:", error);
    return Date.now();
  }
}

async function storeLatestLocation(
  coords: Location.LocationObjectCoords
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LATEST_LOCATION_LAT,
      coords.latitude.toString()
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LATEST_LOCATION_LON,
      coords.longitude.toString()
    );
  } catch (error) {
    console.error("Error guardando última ubicación:", error);
  }
}

async function getLatestLocation(): Promise<Location.LocationObjectCoords | null> {
  try {
    const lat = await AsyncStorage.getItem(STORAGE_KEYS.LATEST_LOCATION_LAT);
    const lon = await AsyncStorage.getItem(STORAGE_KEYS.LATEST_LOCATION_LON);

    if (lat && lon) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        altitude: 0,
        accuracy: 0,
        altitudeAccuracy: 0,
        heading: 0,
        speed: 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Error leyendo última ubicación:", error);
    return null;
  }
}

/* ------------------------------------------------------------------
   Tareas en Segundo Plano
------------------------------------------------------------------ */

TaskManager.defineTask(
  LOCATION_TASK_NAME,
  async ({ data, error }: LocationTaskEvent) => {
    if (error) {
      console.error("Error en tarea de ubicación (background):", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    try {
      if (data?.locations && data.locations.length > 0) {
        const location = data.locations[0];
        console.log("Ubicación en background:", location);
        await storeLatestLocation(location.coords);
      }
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (err) {
      console.error("Error procesando tarea de ubicación (background):", err);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  }
);

TaskManager.defineTask(LOCATION_UPDATE_FETCH_TASK, async () => {
  try {
    const latestLocation = await getLatestLocation();
    if (latestLocation) {
      console.log("BackgroundFetch: Enviando actualización de ubicación");
      await ActivityService.sendLocationUpdate(
        convertToLocation(latestLocation),
        0,
        0
      );
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    console.warn("BackgroundFetch: No hay ubicación almacenada para enviar");
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error(
      "Error en BackgroundFetch LOCATION_UPDATE_FETCH_TASK:",
      error
    );
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(INACTIVITY_TASK_NAME, async () => {
  try {
    const lastMovement = await getLastMovementTime();
    const inactiveTime = (Date.now() - lastMovement) / 1000;
    console.log("Verificando inactividad. Segundos inactivo:", inactiveTime);

    if (inactiveTime > INACTIVITY_THRESHOLD_SECONDS) {
      console.log("Inactividad detectada:", inactiveTime, "segundos");
      const storedLocation = await getLatestLocation();
      if (storedLocation) {
        await ActivityService.sendInactivityAlert(
          convertToLocation(storedLocation),
          inactiveTime
        );
      } else {
        console.warn("Ubicación no disponible para alerta de inactividad");
      }
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error("Error en tarea de inactividad:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/* ------------------------------------------------------------------
   Funciones de Utilidad
------------------------------------------------------------------ */

function convertToLocation(coords: Location.LocationObjectCoords): AppLocation {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy: coords.accuracy ?? undefined,
  };
}

async function requestLocationPermissions(): Promise<boolean> {
  try {
    console.log("Solicitando permisos de ubicación...");
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    console.log("Estado de permisos en primer plano:", fgStatus);

    if (fgStatus !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "No podemos acceder a tu ubicación. Habilita los permisos en la configuración de tu dispositivo."
      );
      return false;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    console.log("Estado de permisos en segundo plano:", bgStatus);

    if (bgStatus !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "No podemos acceder a tu ubicación en segundo plano. Habilita los permisos en la configuración de tu dispositivo."
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error solicitando permisos de ubicación:", error);
    return false;
  }
}

/* ------------------------------------------------------------------
   Componente Principal
------------------------------------------------------------------ */

export default function SeniorHomeScreen() {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const accelerometerSubscription = useRef<AccelerometerSubscription | null>(
    null
  );
  const locationSubscription = useRef<LocationSubscription | null>(null);
  const currentLocationRef = useRef<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    let foregroundInterval: NodeJS.Timeout;

    async function initializeLocationTracking() {
      try {
        setLoading(true);
        setError(null);

        // Obtener el ID del usuario del contexto de autenticación
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) {
          throw new Error("Error al obtener la información del usuario");
        }

        const user = JSON.parse(storedUser);
        ActivityService.setUserId(user.id);

        const hasPermissions = await requestLocationPermissions();
        if (!hasPermissions) {
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        console.log("Ubicación inicial:", currentLocation.coords);
        setLocation(currentLocation.coords);
        await storeLatestLocation(currentLocation.coords);
        currentLocationRef.current = currentLocation.coords;

        await registerBackgroundTasks();
        await startLocationTracking();
        startFallDetection();
        await registerInactivityTask();

        foregroundInterval = setInterval(updateLocation, 60_000);
      } catch (error) {
        console.error("Error en initializeLocationTracking:", error);
        setError("No se pudo iniciar el seguimiento de ubicación");
      } finally {
        setLoading(false);
      }
    }

    async function registerBackgroundTasks() {
      try {
        const isLocationTaskRegistered =
          await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (!isLocationTaskRegistered) {
          console.log("Registrando tarea de ubicación en background...");
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 60_000,
            distanceInterval: 0,
            foregroundService: {
              notificationTitle: "Ubicación activa",
              notificationBody:
                "La app está rastreando tu ubicación en background.",
              notificationColor: "#2563EB",
            },
          });
        }

        await BackgroundFetch.registerTaskAsync(LOCATION_UPDATE_FETCH_TASK, {
          minimumInterval: 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (err: any) {
        if (!err?.message?.includes("already registered")) {
          console.error("Error al registrar tareas en background:", err);
        }
      }
    }

    async function startLocationTracking() {
      try {
        console.log("Iniciando seguimiento de ubicación...");
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 60_000,
            distanceInterval: 0,
          },
          async (loc) => {
            console.log("Nueva ubicación recibida:", loc.coords);
            setLocation(loc.coords);
            await storeLatestLocation(loc.coords);
            currentLocationRef.current = loc.coords;
          }
        );
        console.log("Seguimiento de ubicación iniciado correctamente");
      } catch (error) {
        console.error("Error en startLocationTracking:", error);
        throw error;
      }
    }

    function startFallDetection() {
      accelerometerSubscription.current?.remove();
      accelerometerSubscription.current = Accelerometer.addListener(
        async ({ x, y, z }) => {
          try {
            const acceleration = Math.sqrt(x * x + y * y + z * z);
            if (acceleration > FALL_THRESHOLD) {
              console.log("Posible caída detectada:", acceleration);
              const coords = await getLatestLocation();
              if (coords) {
                await ActivityService.sendFallDetected(
                  convertToLocation(coords),
                  acceleration,
                  10
                );
              }
            } else {
              await storeLastMovementTime(Date.now());
            }
          } catch (error) {
            console.error("Error en detección de caída:", error);
          }
        }
      );
    }

    async function registerInactivityTask() {
      try {
        await BackgroundFetch.registerTaskAsync(INACTIVITY_TASK_NAME, {
          minimumInterval: 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Tarea de inactividad registrada");
      } catch (err: any) {
        if (!err?.message?.includes("already registered")) {
          console.error("Error al registrar tarea de inactividad:", err);
        }
      }
    }

    async function updateLocation() {
      if (currentLocationRef.current) {
        console.log(
          "Foreground: Enviando actualización programada de ubicación"
        );
        await ActivityService.sendLocationUpdate(
          convertToLocation(currentLocationRef.current),
          0,
          0
        );
      }
    }

    initializeLocationTracking();

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (accelerometerSubscription.current) {
        accelerometerSubscription.current.remove();
      }
      if (foregroundInterval) {
        clearInterval(foregroundInterval);
      }
    };
  }, []);

  const handleCall911 = () => {
    Linking.openURL("tel:911");
  };

  const handleEmergencyAlert = async () => {
    try {
      if (!location) {
        Alert.alert(
          "Error",
          "No se pudo obtener tu ubicación. Por favor, asegúrate de que la aplicación tenga permisos de ubicación y vuelve a intentarlo."
        );
        return;
      }

      await ActivityService.sendAlert({
        type: "EMERGENCY_BUTTON_PRESSED",
        location: convertToLocation(location),
        message: "Alerta de emergencia activada por el usuario senior.",
      });

      Alert.alert(
        "Alerta enviada",
        "Tu alerta de emergencia ha sido enviada. Un cuidador será notificado inmediatamente."
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al enviar la alerta.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
        <Text className="text-red-600 dark:text-red-400 text-center">
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
      <Text className="text-4xl font-bold text-gray-800 dark:text-white text-center mt-4">
        Bienvenido
      </Text>
      <Text className="mt-4 text-xl text-gray-700 dark:text-gray-300 text-center">
        Esta aplicación te ayuda a mantener tu seguridad.
      </Text>
      <View className="mt-8 flex-row justify-around w-full">
        <Pressable
          className="bg-blue-600 w-32 h-32 rounded-full justify-center items-center mx-2"
          onPress={handleCall911}
          accessibilityLabel="Llamar al 911"
          accessibilityHint="Presiona para llamar a los servicios de emergencia"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold text-center">
            LLAMAR 911
          </Text>
        </Pressable>
        <Pressable
          className="bg-red-600 w-32 h-32 rounded-full justify-center items-center mx-2"
          onPress={handleEmergencyAlert}
          accessibilityLabel="Enviar alerta de emergencia"
          accessibilityHint="Presiona para enviar una alerta de emergencia a tu cuidador"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold text-center">
            ENVIAR ALERTA
          </Text>
        </Pressable>
      </View>
      <View className="mt-10 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-full">
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-300">
          Instrucciones:
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Tu ubicación se actualiza automáticamente cada minuto (foreground y
          background).
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Si no se detecta movimiento por más de 5 minutos, se enviará una
          alerta a tu cuidador.
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - En caso de caída, la app intentará detectar el impacto y enviará una
          alerta automática.
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Para contactar a los servicios de emergencia, presiona "911".
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Para enviar manualmente una alerta de emergencia, presiona "ENVIAR
          ALERTA".
        </Text>
      </View>
    </View>
  );
}
