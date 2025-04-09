import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ActivityService from "@/services/activityService";

/* ------------------------------------------------------------------
   Tipos y Constantes
------------------------------------------------------------------ */

type AccelerometerSubscription = { remove: () => void };

type LocationTaskEvent = {
  data?: {
    locations: Location.LocationObject[];
  };
  error?: any;
};

const LOCATION_TASK_NAME = "BACKGROUND_LOCATION_TASK";
const INACTIVITY_TASK_NAME = "BACKGROUND_INACTIVITY_TASK";
const LOCATION_UPDATE_FETCH_TASK = "BACKGROUND_LOCATION_UPDATE_FETCH_TASK";

// Claves para AsyncStorage
const STORAGE_KEYS = {
  LAST_MOVEMENT_TIME: "INACTIVITY:lastMovementTime",
  LATEST_LOCATION_LAT: "INACTIVITY:latestLocationLat",
  LATEST_LOCATION_LON: "INACTIVITY:latestLocationLon",
};

/* ------------------------------------------------------------------
   Funciones para persistir y leer datos en AsyncStorage
------------------------------------------------------------------ */
async function storeLastMovementTime(timestamp: number) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_MOVEMENT_TIME, timestamp.toString());
  } catch (error) {
    console.error("Error guardando lastMovementTime:", error);
  }
}

async function getLastMovementTime(): Promise<number> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_MOVEMENT_TIME);
    if (value) {
      return parseInt(value, 10);
    }
  } catch (error) {
    console.error("Error leyendo lastMovementTime:", error);
  }
  return Date.now();
}

async function storeLatestLocation(coords: Location.LocationObjectCoords) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LATEST_LOCATION_LAT, coords.latitude.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.LATEST_LOCATION_LON, coords.longitude.toString());
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
  } catch (error) {
    console.error("Error leyendo última ubicación:", error);
  }
  return null;
}

/* ------------------------------------------------------------------
   Tareas en Segundo Plano
------------------------------------------------------------------ */

/**
 * Tarea de ubicación en background.
 * Se encarga de almacenar la última ubicación recibida.
 * No envía el update, ya que eso lo hará la tarea de BackgroundFetch.
 */
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

/**
 * Tarea para enviar actualización de ubicación periódicamente en background.
 * Esta tarea se ejecuta cada 60 segundos y lee la última ubicación almacenada.
 */
TaskManager.defineTask(LOCATION_UPDATE_FETCH_TASK, async () => {
  try {
    const latestLocation = await getLatestLocation();
    if (latestLocation) {
      console.log("BackgroundFetch: Enviando actualización de ubicación desde BackgroundFetch");
      await ActivityService.sendLocationUpdate(latestLocation, 0, 0);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      console.warn("BackgroundFetch: No hay ubicación almacenada para enviar");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error("Error en BackgroundFetch LOCATION_UPDATE_FETCH_TASK:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Tarea para detectar inactividad.
 */
TaskManager.defineTask(INACTIVITY_TASK_NAME, async () => {
  try {
    const lastMovement = await getLastMovementTime();
    const inactiveTime = (Date.now() - lastMovement) / 1000;
    console.log("Verificando inactividad. Segundos inactivo:", inactiveTime);
    if (inactiveTime > 300) {
      console.log("Inactividad detectada:", inactiveTime, "segundos");
      const storedLocation = await getLatestLocation();
      if (storedLocation) {
        await ActivityService.sendInactivityAlert(storedLocation, inactiveTime);
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
   Componente Principal
------------------------------------------------------------------ */
export default function SeniorHomeScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);

  const accelerometerSubscription = useRef<AccelerometerSubscription | null>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  // Ref para almacenar la ubicación actual (para foreground)
  const currentLocationRef = useRef<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    async function startLocationTracking() {
      setLoading(true);

      // Solicitar permisos en primer plano
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "No podemos acceder a tu ubicación. Habilita los permisos en la configuración de tu dispositivo."
        );
        setLoading(false);
        return;
      }

      // Solicitar permisos en segundo plano
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "No podemos acceder a tu ubicación en segundo plano. Habilita los permisos en la configuración de tu dispositivo."
        );
        setLoading(false);
        return;
      }

      // Registrar tarea de ubicación en background
      const isLocationTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isLocationTaskRegistered) {
        console.log("Registrando tarea de ubicación en background...");
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 60_000, // Sugerencia: cada 1 minuto
          distanceInterval: 0,
          foregroundService: {
            notificationTitle: "Ubicación activa",
            notificationBody: "La app está rastreando tu ubicación en background.",
            notificationColor: "#2563EB",
          },
        });
      } else {
        console.log("La tarea de ubicación en background ya estaba registrada.");
      }

      // Registrar tarea de BackgroundFetch para enviar actualización de ubicación cada 60 segundos
      try {
        await BackgroundFetch.registerTaskAsync(LOCATION_UPDATE_FETCH_TASK, {
          minimumInterval: 60, // cada 60 segundos
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Tarea BackgroundFetch para actualización de ubicación registrada");
      } catch (err: any) {
        if (err?.message?.includes("already registered")) {
          console.log("La tarea BackgroundFetch para actualización de ubicación ya estaba registrada");
        } else {
          console.error("Error al registrar tarea BackgroundFetch para ubicación:", err);
        }
      }

      // Suscripción en primer plano para obtener la ubicación en tiempo real y actualizar la ref
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 60_000, // se actualiza la ref, pero el envío se controla por el setInterval
          distanceInterval: 0,
        },
        async (loc) => {
          console.log("Ubicación (foreground):", loc.coords);
          setLocation(loc.coords);
          await storeLatestLocation(loc.coords);
          currentLocationRef.current = loc.coords;
        }
      );

      setLoading(false);
    }

    function startFallDetection() {
      accelerometerSubscription.current?.remove();
      accelerometerSubscription.current = Accelerometer.addListener(async ({ x, y, z }) => {
        try {
          const acceleration = Math.sqrt(x * x + y * y + z * z);
          const FALL_THRESHOLD = 3.5;
          if (acceleration > FALL_THRESHOLD) {
            console.log("Posible caída detectada:", acceleration);
            const coords = await getLatestLocation();
            if (coords) {
              await ActivityService.sendFallDetected(coords, acceleration, 10);
            }
          } else {
            await storeLastMovementTime(Date.now());
          }
        } catch (error) {
          console.error("Error en detección de caída:", error);
        }
      });
    }

    async function registerInactivityTask() {
      try {
        await BackgroundFetch.registerTaskAsync(INACTIVITY_TASK_NAME, {
          minimumInterval: 60, // cada 60 segundos
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Tarea de inactividad registrada");
      } catch (err: any) {
        if (err?.message?.includes("already registered")) {
          console.log("La tarea de inactividad ya estaba registrada");
        } else {
          console.error("Error al registrar tarea de inactividad:", err);
        }
      }
    }

    startLocationTracking();
    startFallDetection();
    registerInactivityTask();

    // En foreground, se envía la actualización cada 60 segundos
    const foregroundInterval = setInterval(async () => {
      if (currentLocationRef.current) {
        console.log("Foreground: Enviando actualización programada de ubicación");
        await ActivityService.sendLocationUpdate(currentLocationRef.current, 0, 0);
      }
    }, 60_000);

    return () => {
      accelerometerSubscription.current?.remove();
      locationSubscription.current?.remove();
      clearInterval(foregroundInterval);
    };
  }, []);

  const handleCall911 = () => {
    Linking.openURL("tel:911");
  };

  const handleEmergencyAlert = async () => {
    try {
      await ActivityService.sendAlert({
        type: "EMERGENCY_BUTTON_PRESSED",
        location,
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

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" />
      ) : (
        <>
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
              <Text className="text-white text-xl font-bold text-center">LLAMAR 911</Text>
            </Pressable>
            <Pressable
              className="bg-red-600 w-32 h-32 rounded-full justify-center items-center mx-2"
              onPress={handleEmergencyAlert}
              accessibilityLabel="Enviar alerta de emergencia"
              accessibilityHint="Presiona para enviar una alerta de emergencia a tu cuidador"
              accessibilityRole="button"
            >
              <Text className="text-white text-xl font-bold text-center">ENVIAR ALERTA</Text>
            </Pressable>
          </View>
          <View className="mt-10 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-full">
            <Text className="text-lg font-semibold text-gray-800 dark:text-gray-300">
              Instrucciones:
            </Text>
            <Text className="mt-2 text-gray-600 dark:text-gray-400">
              - Tu ubicación se actualiza automáticamente cada minuto (foreground y background).
            </Text>
            <Text className="mt-2 text-gray-600 dark:text-gray-400">
              - Si no se detecta movimiento por más de 5 minutos, se enviará una alerta a tu cuidador.
            </Text>
            <Text className="mt-2 text-gray-600 dark:text-gray-400">
              - En caso de caída, la app intentará detectar el impacto y enviará una alerta automática.
            </Text>
            <Text className="mt-2 text-gray-600 dark:text-gray-400">
              - Para contactar a los servicios de emergencia, presiona "911".
            </Text>
            <Text className="mt-2 text-gray-600 dark:text-gray-400">
              - Para enviar manualmente una alerta de emergencia, presiona "ENVIAR ALERTA".
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
