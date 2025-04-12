// context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/services/API";

interface User {
  id: number;
  email: string;
  role: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      console.log("🔄 Cargando usuario:", {
        hasToken: !!storedToken,
        hasUser: !!storedUser,
      });

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        console.log("✅ Usuario cargado:", {
          id: parsedUser.id,
          role: parsedUser.role,
        });
        setUser(parsedUser);
      } else {
        console.log("ℹ️ No hay sesión activa");
      }
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Error cargando usuario:", error);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await API.login(email, password);
      console.log("Login response:", response);

      if (!response.token || !response.user) {
        throw new Error("Invalid login response");
      }

      await AsyncStorage.setItem("token", response.token);
      await AsyncStorage.setItem("user", JSON.stringify(response.user));

      setUser(response.user);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
