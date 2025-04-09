// services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import {
  User,
  Family,
  Settings,
  Alert,
  ActivityLog,
  Notification,
  ApiGatewayResponse,
} from "@/types";

// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Reemplaza con tu URL real
const API_BASE_URL =
  "http://ec2-18-118-160-81.us-east-2.compute.amazonaws.com/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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

interface LoginResponse {
  status: string;
  message: string;
  token: string;
  user: {
    id: number;
    email: string;
    role: string[];
  };
}

interface ApiError {
  status: string;
  message: string;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private isOnline: boolean = true;

  private constructor() {
    this.initializeNetworkListener();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async initializeNetworkListener() {
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;

    NetInfo.addEventListener((state: NetInfoState) => {
      this.isOnline = state.isConnected ?? false;
      if (this.isOnline) {
        this.processOfflineQueue();
      }
    });
  }

  private async processOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem("offline_queue");
      if (queue) {
        const requests = JSON.parse(queue);
        for (const request of requests) {
          await this.retryRequest(request);
        }
        await AsyncStorage.removeItem("offline_queue");
      }
    } catch (error) {
      console.error("Error processing offline queue:", error);
    }
  }

  private async retryRequest(
    request: any,
    retries = MAX_RETRIES
  ): Promise<any> {
    try {
      return await this.makeRequest(request);
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return this.retryRequest(request, retries - 1);
      }
      throw error;
    }
  }

  private async makeRequest(request: any): Promise<any> {
    if (!this.isOnline) {
      await this.addToOfflineQueue(request);
      throw new Error("Offline mode: Request queued");
    }

    const headers = await this.getAuthHeaders();
    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text);
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error("Invalid JSON response");
    }
  }

  private async addToOfflineQueue(request: any) {
    try {
      const queue = await AsyncStorage.getItem("offline_queue");
      const requests = queue ? JSON.parse(queue) : [];
      requests.push(request);
      await AsyncStorage.setItem("offline_queue", JSON.stringify(requests));
    } catch (error) {
      console.error("Error adding to offline queue:", error);
    }
  }

  private async getAuthHeaders() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem("auth_token");
    }
    return {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  // Auth Methods
  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const response = await this.makeRequest({
      url: `${API_BASE_URL}/login`,
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    await AsyncStorage.setItem("auth_token", response.token);
    return response;
  }

  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem("auth_token");
  }

  // User Methods
  async getUser(): Promise<User> {
    return this.makeRequest({
      url: `${API_BASE_URL}/user`,
      method: "GET",
    });
  }

  async updateUser(user: Partial<User>): Promise<User> {
    return this.makeRequest({
      url: `${API_BASE_URL}/user`,
      method: "PUT",
      body: JSON.stringify(user),
    });
  }

  // Family Methods
  async getFamily(): Promise<Family> {
    return this.makeRequest({
      url: `${API_BASE_URL}/family`,
      method: "GET",
    });
  }

  // Settings Methods
  async getSettings(): Promise<Settings> {
    return this.makeRequest({
      url: `${API_BASE_URL}/settings`,
      method: "GET",
    });
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    return this.makeRequest({
      url: `${API_BASE_URL}/settings`,
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // Alert Methods
  async getAlerts(): Promise<Alert[]> {
    return this.makeRequest({
      url: `${API_BASE_URL}/alerts`,
      method: "GET",
    });
  }

  // Activity Methods
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.makeRequest({
      url: `${API_BASE_URL}/activity-logs`,
      method: "GET",
    });
  }

  async getHistory(): Promise<HistoryEntry[]> {
    return this.makeRequest({
      url: `${API_BASE_URL}/history`,
      method: "GET",
    });
  }

  async getSeniorLocation(): Promise<{ latitude: number; longitude: number }> {
    return this.makeRequest({
      url: `${API_BASE_URL}/location`,
      method: "GET",
    });
  }

  // Notification Methods
  async getNotifications(): Promise<Notification[]> {
    return this.makeRequest({
      url: `${API_BASE_URL}/notifications`,
      method: "GET",
    });
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    return this.makeRequest({
      url: `${API_BASE_URL}/notifications/${notificationId}/read`,
      method: "PUT",
    });
  }
}

export default ApiService.getInstance();
