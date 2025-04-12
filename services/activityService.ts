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

  static async sendAlert(payload: any) {
    if (!this.userId) {
      throw new Error("User ID not set. Call setUserId first.");
    }

    console.log("📝 Raw payload received:", JSON.stringify(payload, null, 2));
    console.log("📝 Current userId:", this.userId);

    // Create a clean payload with only the required fields and ensure correct types
    const cleanPayload = {
      user_id: Number(this.userId),
      type: String(payload.type),
      location: {
        latitude: Number(payload.location.latitude),
        longitude: Number(payload.location.longitude),
        accuracy: payload.location.accuracy
          ? Number(payload.location.accuracy)
          : null,
      },
    };

    console.log("📝 Cleaned payload:", JSON.stringify(cleanPayload, null, 2));

    // Validate the payload before sending
    if (!cleanPayload.user_id || !cleanPayload.type || !cleanPayload.location) {
      console.error("❌ Invalid payload: missing required fields");
      throw new Error("Invalid payload: missing required fields");
    }

    // Validate location exactly as the Lambda does
    if (
      !cleanPayload.location ||
      typeof cleanPayload.location.latitude !== "number" ||
      typeof cleanPayload.location.longitude !== "number" ||
      cleanPayload.location.latitude < -90 ||
      cleanPayload.location.latitude > 90 ||
      cleanPayload.location.longitude < -180 ||
      cleanPayload.location.longitude > 180
    ) {
      console.error(
        "❌ Invalid location: must have valid latitude and longitude"
      );
      throw new Error(
        "Invalid location: must have valid latitude and longitude"
      );
    }

    // Create the final payload with the exact structure the Lambda expects
    const finalPayload = {
      user_id: cleanPayload.user_id,
      type: cleanPayload.type,
      location: {
        latitude: cleanPayload.location.latitude,
        longitude: cleanPayload.location.longitude,
        accuracy: cleanPayload.location.accuracy,
      },
    };

    console.log("📝 Final payload:", JSON.stringify(finalPayload, null, 2));

    // Ensure the request body is properly formatted
    const requestBody = {
      body: JSON.stringify(finalPayload),
    };

    console.log(
      "📤 Request body being sent:",
      JSON.stringify(requestBody, null, 2)
    );

    return this.sendRequest(payload.type, finalPayload);
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
