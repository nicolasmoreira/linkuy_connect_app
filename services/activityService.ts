import { EVENT_TYPES } from "@/constants/EventTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL =
  "https://46ulygv0l0.execute-api.us-east-2.amazonaws.com/activity";

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface ActivityPayload {
  user_id: number;
  type: string;
  location: Location;
  steps?: number;
  distance_km?: number;
  fall_intensity?: number;
  inactive_duration_sec?: number;
  message?: string;
}

interface ApiGatewayResponse {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

interface FallAlertData {
  type: "FALL_DETECTED" | "FALL_EMERGENCY" | "EMERGENCY_BUTTON_PRESSED";
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  sensorData?: {
    acceleration: {
      x: number;
      y: number;
      z: number;
    };
    gyroscope: {
      x: number;
      y: number;
      z: number;
    };
  };
}

export default class ActivityService {
  private static userId: number | null = null;

  static async setUserId(id: number) {
    this.userId = id;
  }

  static async sendLocationUpdate(
    location: Location,
    steps: number,
    distance: number
  ) {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId first.");
    }

    return this.sendRequest(EVENT_TYPES.LOCATION_UPDATE, {
      user_id: this.userId,
      type: EVENT_TYPES.LOCATION_UPDATE,
      location,
      steps,
      distance_km: distance,
    });
  }

  static async sendFallDetected(
    location: Location,
    fallIntensity: number,
    inactiveDurationSec: number
  ) {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId first.");
    }

    return this.sendRequest(EVENT_TYPES.FALL_DETECTED, {
      user_id: this.userId,
      type: EVENT_TYPES.FALL_DETECTED,
      location,
      fall_intensity: fallIntensity,
      inactive_duration_sec: inactiveDurationSec,
    });
  }

  static async sendInactivityAlert(
    location: Location,
    inactivityDuration: number
  ) {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId first.");
    }

    return this.sendRequest(EVENT_TYPES.INACTIVITY_ALERT, {
      user_id: this.userId,
      type: EVENT_TYPES.INACTIVITY_ALERT,
      location,
      inactive_duration_sec: inactivityDuration,
    });
  }

  static async sendAlert(alertData: FallAlertData): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error("User ID not set. Call setUserId first.");
      }

      const payload = {
        user_id: this.userId,
        type: alertData.type,
        location: alertData.location,
        sensorData: alertData.sensorData,
        timestamp: new Date().toISOString(),
      };

      console.log(
        "[ActivityService] Sending alert payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[ActivityService] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ActivityService] Error response body:", errorText);
        throw new Error(
          `Failed to send ${alertData.type
            .toLowerCase()
            .replace(/_/g, " ")} alert: ${response.status} ${
            response.statusText
          }`
        );
      }

      const responseData = await response.json();
      console.log(
        "[ActivityService] Success response:",
        JSON.stringify(responseData, null, 2)
      );

      console.log(
        `[ActivityService] ${alertData.type} alert sent successfully`
      );
    } catch (error) {
      console.error(
        `[ActivityService] Error sending ${alertData.type
          .toLowerCase()
          .replace(/_/g, " ")} alert:`,
        error
      );
      throw error;
    }
  }

  private static async sendRequest(type: string, payload: any) {
    try {
      // Send the payload directly without double stringification
      const requestBody = JSON.stringify(payload);

      console.log("📤 Request body being sent:", requestBody);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("📥 Response status:", response.status);
      console.log(
        "📥 Response headers:",
        JSON.stringify(response.headers, null, 2)
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Error response:", JSON.stringify(errorData, null, 2));
        throw new Error(
          errorData.error || `Error en el request: ${response.statusText}`
        );
      }

      const responseData = await response.json();
      console.log("📥 API response:", JSON.stringify(responseData, null, 2));

      return responseData;
    } catch (error) {
      console.error(`❌ Error sending ${type}:`, error);
      throw error;
    }
  }
}
