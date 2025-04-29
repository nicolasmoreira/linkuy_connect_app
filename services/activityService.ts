import { EVENT_TYPES } from "@/constants/EventTypes";

const API_URL =
  "https://46ulygv0l0.execute-api.us-east-2.amazonaws.com/activity";

interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
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

  static async sendEmergencyButtonPressed(location: Location) {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId first.");
    }

    return this.sendRequest(EVENT_TYPES.EMERGENCY_BUTTON_PRESSED, {
      user_id: this.userId,
      type: EVENT_TYPES.EMERGENCY_BUTTON_PRESSED,
      location,
    });
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
