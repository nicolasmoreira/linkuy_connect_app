export type ActivityLogType =
  | "LOCATION_UPDATE"
  | "INACTIVITY_ALERT"
  | "FALL_DETECTED";

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  message?: string;
}
