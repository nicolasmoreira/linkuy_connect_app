// services/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

const API_BASE_URL = "http://127.0.0.1:8000/api";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface ActivityLog {
  id: number;
  type: string;
  created_at: string;
  user: {
    id: number;
  };
}

interface Location {
  id: number;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  created_at: string;
  user: {
    id: number;
  };
}

interface Settings {
  inactivity_threshold: number;
  do_not_disturb: boolean;
  do_not_disturb_start_time: string | null;
  do_not_disturb_end_time: string | null;
}

interface User {
  id: number;
  email: string;
  role: string[];
}

interface LoginResponse {
  status: string;
  message: string;
  token: string;
  user: User;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
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

    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };

    const headers = {
      ...defaultHeaders,
      ...request.headers,
    };

    console.log("[API] Making request:", {
      url: request.url,
      method: request.method,
      headers,
      body: request.body,
    });

    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });

    const text = await response.text();
    console.log("[API] Response text:", text);

    if (!response.ok) {
      try {
        const errorData = JSON.parse(text);
        throw new Error(JSON.stringify(errorData));
      } catch (error) {
        throw new Error(text);
      }
    }

    try {
      const data = JSON.parse(text);
      console.log("[API] Parsed response:", data);
      return data;
    } catch (error) {
      console.error("[API] Error parsing response:", error);
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

  setToken(token: string | null) {
    this.token = token;
  }

  // Auth Methods
  async login(email: string, password: string): Promise<LoginResponse> {
    console.log("[API] Login request:", { email, password: "******" });

    const response = await this.makeRequest({
      url: `${API_BASE_URL}/login`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log("[API] Login response:", response);

    if (response.status === "success") {
      this.token = response.token;
      await AsyncStorage.setItem("token", response.token);
      return response;
    } else {
      throw new Error(JSON.stringify(response));
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem("auth_token");
  }

  async checkToken(): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest({
      url: `${API_BASE_URL}/check-token`,
      method: "GET",
    });
  }

  // Activity Log Methods
  async getActivityLogs(): Promise<ApiResponse<ActivityLog[]>> {
    return this.makeRequest({
      url: `${API_BASE_URL}/activity-log`,
      method: "GET",
    });
  }

  async getActivityLogLocations(): Promise<ApiResponse<Location[]>> {
    return this.makeRequest({
      url: `${API_BASE_URL}/activity-log/locations`,
      method: "GET",
    });
  }

  // Settings Methods
  async getSettings(): Promise<ApiResponse<Settings>> {
    return this.makeRequest({
      url: `${API_BASE_URL}/settings`,
      method: "GET",
    });
  }

  async updateSettings(
    settings: Partial<Settings>
  ): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest({
      url: `${API_BASE_URL}/settings`,
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}

export default ApiService.getInstance();
