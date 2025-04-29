import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Accelerometer } from "expo-sensors";
import ActivityService from "./activityService";
import { SENSOR_CONFIG } from "./config";
import { Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const FALL_DETECTION_TASK_NAME = "background-fall-detection-task";

export class FallDetectionService {
  private static instance: FallDetectionService;
  private isTracking: boolean = false;
  private lastFallTime: number = 0;
  private potentialFallStartTime: number = 0;
  private isProcessingFall: boolean = false;
  private sensorData: Array<{
    x: number;
    y: number;
    z: number;
    timestamp: number;
  }> = [];
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
      await this.setupTask();

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

  private async setupTask() {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(
        FALL_DETECTION_TASK_NAME
      );
      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(FALL_DETECTION_TASK_NAME);
      }

      await TaskManager.defineTask(FALL_DETECTION_TASK_NAME, async () => {
        try {
          if (!this.isTracking) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }

          const data = this.sensorData[this.sensorData.length - 1];
          if (data) {
            await this.processSensorData(data);
          }
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error("[FallDetection] Error in background task:", error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      await BackgroundFetch.registerTaskAsync(FALL_DETECTION_TASK_NAME, {
        minimumInterval: SENSOR_CONFIG.SAMPLE_INTERVAL,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log("[FallDetection] Background task registered successfully");
    } catch (error) {
      console.error("[FallDetection] Error setting up background task:", error);
      throw error;
    }
  }

  private async processSensorData(acceleration: {
    x: number;
    y: number;
    z: number;
  }) {
    const now = Date.now();
    this.sensorData.push({
      x: acceleration.x,
      y: acceleration.y,
      z: acceleration.z,
      timestamp: now,
    });

    await AsyncStorage.setItem("lastSensorData", JSON.stringify(acceleration));

    const windowStartTime =
      now - SENSOR_CONFIG.WINDOW_SIZE * SENSOR_CONFIG.SAMPLE_INTERVAL;
    this.sensorData = this.sensorData.filter(
      (data) => data.timestamp >= windowStartTime
    );

    if (this.sensorData.length >= SENSOR_CONFIG.WINDOW_SIZE) {
      const magnitude = this.calculateAccelerationMagnitude();

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
  }

  private calculateAccelerationMagnitude(): number {
    const recentData = this.sensorData.slice(-SENSOR_CONFIG.WINDOW_SIZE);
    const avgX =
      recentData.reduce((sum, data) => sum + data.x, 0) / recentData.length;
    const avgY =
      recentData.reduce((sum, data) => sum + data.y, 0) / recentData.length;
    const avgZ =
      recentData.reduce((sum, data) => sum + data.z, 0) / recentData.length;

    return Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ);
  }

  private async handlePotentialFall(magnitude: number) {
    const now = Date.now();
    if (now - this.lastFallTime < SENSOR_CONFIG.FALL_COOLDOWN) {
      return;
    }

    this.lastFallTime = now;
    this.isProcessingFall = false;

    try {
      // Obtener la última ubicación guardada
      const lastLocationData = await AsyncStorage.getItem("lastLocationData");
      console.log(
        "[FallDetection] Last location data for fall:",
        lastLocationData
      );

      let location = { latitude: 0, longitude: 0, accuracy: 0 };
      if (lastLocationData) {
        const parsedLocation = JSON.parse(lastLocationData);
        if (parsedLocation.latitude && parsedLocation.longitude) {
          location = {
            latitude: parsedLocation.latitude,
            longitude: parsedLocation.longitude,
            accuracy: parsedLocation.accuracy,
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
      } else {
        console.error("[FallDetection] No location data available for fall");
      }

      await ActivityService.sendFallDetected(
        location,
        magnitude,
        SENSOR_CONFIG.POST_FALL_INACTIVITY
      );

      Alert.alert(
        "¡Caída Detectada!",
        "Se ha detectado una posible caída. Tu cuidador ha sido notificado.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("[FallDetection] Error handling potential fall:", error);
      Alert.alert(
        "Error de Comunicación",
        "No se pudo enviar la alerta de caída. Por favor, verifica tu conexión a internet.",
        [{ text: "OK" }]
      );
    }
  }
}

export default FallDetectionService;
