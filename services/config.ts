/**
 * Configuration for fall detection sensor
 */
export const SENSOR_CONFIG = {
  // Sampling rate for accelerometer data
  SAMPLE_INTERVAL: 100, // ms

  // Number of samples to analyze for fall detection
  WINDOW_SIZE: 10,

  // Threshold for fall detection (in g-force)
  FALL_THRESHOLD: 2.5,

  // Minimum duration of acceleration above threshold to trigger fall detection
  MIN_FALL_DURATION: 200, // ms

  // Cooldown period between fall detections
  FALL_COOLDOWN: 30000, // ms (30 seconds)

  // Period of inactivity monitoring after a fall
  POST_FALL_INACTIVITY: 300, // seconds (5 minutes)
} as const;

/**
 * Background task configuration
 */
export const BACKGROUND_CONFIG = {
  // Minimum interval for background fetch tasks
  MIN_FETCH_INTERVAL: 60, // seconds

  // Maximum number of retries for failed tasks
  MAX_RETRIES: 3,

  // Timeout for background operations
  TIMEOUT: 30000, // ms (30 seconds)
} as const;

/**
 * Location tracking configuration
 */
export const LOCATION_CONFIG = {
  // Accuracy level for location updates
  ACCURACY: "balanced",

  // Minimum distance between location updates
  DISTANCE_INTERVAL: 10, // meters

  // Minimum time between location updates
  TIME_INTERVAL: 60000, // ms (1 minute)
} as const;
