// API Types
export interface ApiGatewayResponse {
  statusCode: number;
  headers: { [key: string]: string };
  body: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ActivityPayload {
  user_id: number;
  type: string;
  location: Location;
  steps?: number;
  distance_km?: number;
  fall_intensity?: number;
  inactive_duration_sec?: number;
}

export interface User {
  id: number;
  email: string;
  role: string[];
  family_id: number;
  device_token?: string;
}

export interface Family {
  id: number;
  name: string;
  active: boolean;
}

export interface Settings {
  inactivity_threshold: number;
  do_not_disturb: boolean;
  do_not_disturb_start_time?: string;
  do_not_disturb_end_time?: string;
}

export interface Alert {
  id: number;
  type: "fall" | "inactivity" | "emergency";
  sent: boolean;
  created_at: string;
  user_id: number;
}

export type ActivityLogType =
  | "LOCATION_UPDATE"
  | "INACTIVITY_ALERT"
  | "FALL_DETECTED"
  | "EMERGENCY_BUTTON_PRESSED";

export interface ActivityLog {
  id: number;
  type: ActivityLogType;
  created_at: string;
  user: {
    id: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  message?: string;
  steps?: number;
  distance_km?: number;
  fall_intensity?: number;
  inactive_duration_sec?: number;
  metadata?: any;
}

export interface Notification {
  id: number;
  message: string;
  sent: boolean;
  created_at: string;
  user_id: number;
  family_id: number;
}
