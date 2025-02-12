// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

interface User {
  id: number;
  email: string;
  role: string[];
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ user: null, login: async () => false, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await api.login(email, password);
        const loggedUser: User = {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          token: result.token,
        };
        await AsyncStorage.setItem("user", JSON.stringify(loggedUser));
        setUser(loggedUser);
        return true;
    } catch (error: any) {
      Alert.alert("Error", error.message || "Login failed");
      return false;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
