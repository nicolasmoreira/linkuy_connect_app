import { Accelerometer } from "expo-sensors";
import { SENSOR_CONFIG } from "./config";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import ActivityService from "./activityService";

const FALL_DETECTION_TASK_NAME = "background-fall-detection-task";

export class FallDetectionService {
  private static instance: FallDetectionService;
  private isTracking: boolean = false;
  private lastFallTime: number = 0;
  private potentialFallStartTime: number = 0;
  private isProcessingFall: boolean = false;
  private notificationChannelId: string = "fall-detection";

  private constructor() {
    console.log("[FallDetection] Service initialized");
    this.setupNotificationChannel();
  }

  private async setupNotificationChannel() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        this.notificationChannelId,
        {
          name: "Fall Detection",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#2563EB",
        }
      );
    }
  }

  public static getInstance(): FallDetectionService {
    if (!FallDetectionService.instance) {
      FallDetectionService.instance = new FallDetectionService();
    }
    return FallDetectionService.instance;
  }

  public async startTracking() {
    if (this.isTracking) {
      console.log("[FallDetection] Already tracking");
      return;
    }

    try {
      console.log("[FallDetection] Starting sensor tracking...");
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable) {
        throw new Error("Accelerometer not available");
      }

      if (Platform.OS === "ios") {
        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Accelerometer permissions not granted");
        }
      }

      await Accelerometer.setUpdateInterval(SENSOR_CONFIG.SAMPLE_INTERVAL);

      Accelerometer.addListener((data) => {
        if (!this.isTracking) return;
        this.processSensorData(data);
      });

      this.isTracking = true;
      console.log("[FallDetection] Sensor tracking started successfully");

      if (Platform.OS === "android") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Linkuy Connect",
            body: "Monitoreando tu actividad",
            data: { type: "foreground-service" },
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error("[FallDetection] Error starting sensor tracking:", error);
      throw error;
    }
  }

  public async stopTracking() {
    if (!this.isTracking) {
      return;
    }

    try {
      console.log("[FallDetection] Stopping sensor tracking...");
      Accelerometer.removeAllListeners();
      this.isTracking = false;
      console.log("[FallDetection] Sensor tracking stopped successfully");

      if (Platform.OS === "android") {
        await Notifications.cancelAllScheduledNotificationsAsync();
      }
    } catch (error) {
      console.error("[FallDetection] Error stopping sensor tracking:", error);
      throw error;
    }
  }

  private async processSensorData(acceleration: {
    x: number;
    y: number;
    z: number;
  }) {
    const now = Date.now();

    // Guardar el último dato del sensor
    await AsyncStorage.setItem("lastSensorData", JSON.stringify(acceleration));

    // Calcular la magnitud
    const magnitude = Math.sqrt(
      Math.pow(acceleration.x, 2) +
        Math.pow(acceleration.y, 2) +
        Math.pow(acceleration.z, 2)
    );

    console.log("[FallDetection] Processing sensor data:", {
      magnitude: magnitude.toFixed(2),
      threshold: SENSOR_CONFIG.FALL_THRESHOLD,
      isAboveThreshold: magnitude > SENSOR_CONFIG.FALL_THRESHOLD,
    });

    if (magnitude > SENSOR_CONFIG.FALL_THRESHOLD) {
      if (!this.isProcessingFall) {
        this.potentialFallStartTime = now;
        this.isProcessingFall = true;
      }

      const fallDuration = now - this.potentialFallStartTime;
      if (fallDuration >= SENSOR_CONFIG.MIN_FALL_DURATION) {
        await this.handlePotentialFall(magnitude);
      }
    } else if (this.isProcessingFall) {
      this.isProcessingFall = false;
    }
  }

  private async handlePotentialFall(magnitude: number) {
    const now = Date.now();
    if (now - this.lastFallTime < SENSOR_CONFIG.FALL_COOLDOWN) {
      console.log("[FallDetection] Fall detection skipped - cooldown period");
      return;
    }

    this.lastFallTime = now;
    this.isProcessingFall = false;

    try {
      console.log(
        "[FallDetection] handlePotentialFall INICIO, magnitude:",
        magnitude
      );
      // Obtener la última ubicación guardada
      const lastLocationData = await AsyncStorage.getItem("lastLocationData");
      console.log(
        "[FallDetection] Last location data for fall:",
        lastLocationData
      );

      let location = { latitude: 0, longitude: 0, accuracy: 0 };
      if (lastLocationData) {
        try {
          const parsedLocation = JSON.parse(lastLocationData);
          if (parsedLocation.latitude && parsedLocation.longitude) {
            location = {
              latitude: parsedLocation.latitude,
              longitude: parsedLocation.longitude,
              accuracy: parsedLocation.accuracy || 0,
            };
            console.log(
              "[FallDetection] Using last known location for fall:",
              location
            );
          } else {
            console.error(
              "[FallDetection] Invalid location data in storage:",
              parsedLocation
            );
          }
        } catch (parseError) {
          console.error(
            "[FallDetection] Error parsing location data:",
            parseError
          );
        }
      } else {
        console.error("[FallDetection] No location data available for fall");
      }

      // Guardar el estado de la caída para que la tarea en segundo plano lo procese
      console.log(
        "[FallDetection] Guardando lastFallDetection en AsyncStorage..."
      );
      await AsyncStorage.setItem(
        "lastFallDetection",
        JSON.stringify({
          timestamp: now,
          magnitude,
          location,
          processed: false,
        })
      );
      console.log("[FallDetection] lastFallDetection guardado correctamente");

      // Enviar el evento de caída al backend también en foreground
      console.log(
        "[FallDetection] Intentando enviar evento de caída al backend (foreground)..."
      );
      try {
        const response = await ActivityService.sendFallDetected(
          location,
          magnitude,
          SENSOR_CONFIG.POST_FALL_INACTIVITY
        );
        console.log(
          "[FallDetection] Evento de caída enviado con éxito (foreground):",
          response
        );
      } catch (error) {
        console.error(
          "[FallDetection] Error enviando evento de caída (foreground):",
          error
        );
      }

      console.log("[FallDetection] Mostrando alerta de caída al usuario...");
      Alert.alert(
        "¡Caída Detectada!",
        "Se ha detectado una posible caída. Tu cuidador ha sido notificado.",
        [{ text: "OK" }]
      );
      console.log("[FallDetection] Alert mostrado");
    } catch (error) {
      console.error("[FallDetection] Error handling potential fall:", error);
      Alert.alert(
        "Error de Comunicación",
        "No se pudo procesar la caída. Por favor, verifica tu conexión a internet.",
        [{ text: "OK" }]
      );
      console.log("[FallDetection] Alert de error mostrado");
    }
  }
}

export default FallDetectionService;
