import React, { createContext, useContext, useState, useEffect } from "react";
import { Alert } from "react-native";

interface AuthContextType {
  user: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Simulación de persistencia de sesión
    const storedUser = null; // Aquí iría AsyncStorage o SecureStore en Expo
    setUser(storedUser);
  }, []);

  const login = (email: string, password: string): boolean => {
    if (email === "admin@example.com" && password === "1234") {
      setUser(email);
      return true;
    } else {
      Alert.alert("Error", "Correo o contraseña incorrectos.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
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
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
