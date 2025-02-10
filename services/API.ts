interface Location {
  latitude: number;
  longitude: number;
}

interface SensorData {
  location: Location | null;
  stepCount: number;
  acceleration: { x: number; y: number; z: number };
}

interface AlertData {
  type: "fall" | "inactivity" | "emergency";
  location: Location | null;
  message: string;
}

interface HistoryEntry {
  type: "fall" | "inactivity" | "emergency";
  createdAt: number;
  message: string;
}

interface Settings {
  inactivityThreshold: number;
  dndStartTime: string;
  dndEndTime: string;
}

const API = {
  sendSensorData: async (data: SensorData): Promise<boolean> => {
    try {
      console.log("Enviando datos de sensores:", data);
      // Aquí se integraría la llamada real a la API
      return true;
    } catch (error) {
      console.error("Error enviando datos de sensores:", error);
      return false;
    }
  },

  sendAlert: async (alertData: AlertData): Promise<boolean> => {
    try {
      console.log("Enviando alerta:", alertData);
      // Aquí se integraría la llamada real
      return true;
    } catch (error) {
      console.error("Error enviando alerta:", error);
      return false;
    }
  },

  getHistory: async (): Promise<HistoryEntry[]> => {
    try {
      return [
        { type: "fall", createdAt: Date.now() - 3600000, message: "Caída detectada" },
        { type: "inactivity", createdAt: Date.now() - 7200000, message: "Inactividad prolongada" },
      ];
    } catch (error) {
      console.error("Error obteniendo historial:", error);
      return [];
    }
  },

  getSeniorLocation: async (): Promise<Location> => {
    try {
      return { latitude: 37.78825 + Math.random() * 0.001, longitude: -122.4324 + Math.random() * 0.001 };
    } catch (error) {
      console.error("Error obteniendo ubicación del adulto mayor:", error);
      return { latitude: 0, longitude: 0 }; // Ubicación por defecto en caso de error
    }
  },

  getSettings: async (): Promise<Settings> => {
    try {
      return { inactivityThreshold: 30, dndStartTime: "22:00", dndEndTime: "07:00" };
    } catch (error) {
      console.error("Error obteniendo configuración:", error);
      return { inactivityThreshold: 30, dndStartTime: "22:00", dndEndTime: "07:00" }; // Valores predeterminados
    }
  },

  updateSettings: async (settings: Settings): Promise<boolean> => {
    try {
      console.log("Actualizando configuración:", settings);
      return true;
    } catch (error) {
      console.error("Error actualizando configuración:", error);
      return false;
    }
  },
};

export default API;
