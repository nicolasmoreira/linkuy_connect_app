import { EVENT_TYPES } from "@/constants/EventTypes";

const API_URL = "https://46ulygv0l0.execute-api.us-east-2.amazonaws.com/activity";
const USER_ID = 1;

export default class ActivityService {
  static async sendLocationUpdate(location: any, steps: number, distance: number) {
    return this.sendRequest(EVENT_TYPES.LOCATION_UPDATE, { 
      user_id: USER_ID,
      location, 
      steps, 
      distance_km: distance 
    });
  }

  static async sendFallDetected(location: any, fallIntensity: number, inactiveDurationSec: number) {
    return this.sendRequest(EVENT_TYPES.FALL_DETECTED, { 
      user_id: USER_ID,
      location, 
      fall_intensity: fallIntensity, 
      inactive_duration_sec: inactiveDurationSec 
    });
  }

  static async sendInactivityAlert(location: any, inactivityDuration: number) {
    return this.sendRequest(EVENT_TYPES.INACTIVITY_ALERT, { 
      user_id: USER_ID,
      location, 
      inactivity_duration_sec: inactivityDuration 
    });
  }

  static async sendAlert(payload: any) {
    return this.sendRequest(payload.type, { 
      user_id: USER_ID,
      ...payload 
    });
  }

  private static async sendRequest(type: string, payload: any) {
    try {
      // No se incluye timestamp en el payload
      const requestBody = JSON.stringify({
        ...payload,
        type,
      });

      console.log(`📤 Enviando ${type}:`, requestBody);

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

      if (!response.ok) {
        throw new Error(`Error en el request: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Error enviando ${type}:`, error);
    }
  }
}
