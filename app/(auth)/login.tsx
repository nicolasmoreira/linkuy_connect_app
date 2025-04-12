import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface LoginResponse {
  status: string;
  message?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    role: string[];
  };
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPinFocused, setIsPinFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !pin) {
      Alert.alert("Error", "Por favor ingresa tu email y PIN");
      return;
    }

    if (pin.length !== 8) {
      Alert.alert("Error", "El PIN debe tener 8 caracteres");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[Login] Starting login process");
      console.log("[Login] Email:", email);
      console.log("[Login] PIN length:", pin.length);

      const response = (await login(email, pin)) as LoginResponse;
      console.log("[Login] API Response:", response);

      if (response.status === "success" && response.user && response.token) {
        console.log("[Login] Login successful");
        console.log("[Login] User role:", response.user.role);
        console.log("[Login] User ID:", response.user.id);

        await AsyncStorage.setItem("user", JSON.stringify(response.user));
        await AsyncStorage.setItem("token", response.token);

        const userRole = response.user.role[0]; // Tomamos el primer rol del array
        if (userRole === "ROLE_CAREGIVER") {
          console.log("[Login] Redirecting to caregiver home");
          router.replace("/(tabs-caregiver)/home");
        } else if (userRole === "ROLE_SENIOR") {
          console.log("[Login] Redirecting to senior home");
          router.replace("/(tabs-senior)/home");
        } else {
          console.error("[Login] Unknown user role:", userRole);
          setError("Rol de usuario no válido");
        }
      } else {
        console.error("[Login] Login failed:", response);
        setError(response.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      setError(
        error instanceof Error ? error.message : "Error al iniciar sesión"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (isFocused: boolean) => `
    bg-white dark:bg-gray-800 
    p-4 rounded-2xl mt-2
    text-gray-900 dark:text-white
    border-2 ${
      isFocused ? "border-blue-500" : "border-gray-200 dark:border-gray-700"
    }
    shadow-sm
  `;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-12">
          <Image
            source={require("@/assets/images/icon.png")}
            className="w-32 h-32 mb-8"
            accessibilityLabel="Logo de Linkuy Connect"
          />
          <Text
            className="text-4xl font-bold text-gray-800 dark:text-white mb-3"
            accessibilityRole="header"
          >
            Bienvenido
          </Text>
          <Text
            className="text-lg text-gray-600 dark:text-gray-300 text-center"
            accessibilityRole="text"
          >
            Monitoreo y cuidado para adultos mayores
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text
              className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1"
              accessibilityRole="text"
            >
              Correo electrónico
            </Text>
            <View className="relative">
              <TextInput
                className={inputStyle(isEmailFocused)}
                placeholder="ejemplo@correo.com"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase())}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                accessibilityLabel="Campo de correo electrónico"
                accessibilityHint="Ingresa tu correo electrónico para iniciar sesión"
              />
              <View className="absolute right-4 top-5">
                <Ionicons
                  name="mail-outline"
                  size={24}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </View>
            </View>
          </View>

          <View>
            <Text
              className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1"
              accessibilityRole="text"
            >
              PIN
            </Text>
            <View className="relative">
              <TextInput
                className={inputStyle(isPinFocused)}
                placeholder="Ingresa tu PIN"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
                maxLength={8}
                onFocus={() => setIsPinFocused(true)}
                onBlur={() => setIsPinFocused(false)}
                accessibilityLabel="Campo de PIN"
                accessibilityHint="Ingresa tu PIN numérico de 8 dígitos para iniciar sesión"
              />
              <Pressable
                onPress={() => setShowPin(!showPin)}
                className="absolute right-4 top-5"
                accessibilityLabel={showPin ? "Ocultar PIN" : "Mostrar PIN"}
                accessibilityRole="button"
              >
                <Ionicons
                  name={showPin ? "eye-off-outline" : "eye-outline"}
                  size={24}
                  color={isDark ? "#9CA3AF" : "#6B7280"}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`
              mt-8 p-4 rounded-2xl
              ${isLoading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"}
              shadow-sm
            `}
            accessibilityLabel="Botón de inicio de sesión"
            accessibilityHint="Presiona para iniciar sesión"
            accessibilityState={{ disabled: isLoading }}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Iniciar Sesión
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
