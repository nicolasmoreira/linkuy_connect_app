import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import API from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { version } from "../../package.json";

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

interface LoginError {
  field?: "email" | "pin";
  message: string;
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
  const { registerForPushNotifications } = useNotifications();
  const router = useRouter();
  const [errors, setErrors] = useState<LoginError[]>([]);

  const validateForm = () => {
    const newErrors: LoginError[] = [];

    if (!email) {
      newErrors.push({
        field: "email",
        message: "El correo electrónico es requerido",
      });
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.push({
        field: "email",
        message: "Ingresa un correo electrónico válido",
      });
    }

    if (!pin) {
      newErrors.push({ field: "pin", message: "El PIN es requerido" });
    } else if (pin.length !== 8) {
      newErrors.push({ field: "pin", message: "El PIN debe tener 8 dígitos" });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors([]);

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

        // Register for push notifications and send token to backend
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          try {
            console.log("[Login] Sending device token to backend");
            await API.addDeviceToken(pushToken);
            console.log("[Login] Device token sent successfully");
          } catch (error) {
            console.error("[Login] Error sending device token:", error);
            // We don't want to block the login flow if token registration fails
          }
        }

        const userRole = response.user.role[0];
        if (userRole === "ROLE_CAREGIVER") {
          console.log("[Login] Redirecting to caregiver home");
          router.replace("/(tabs-caregiver)/home");
        } else if (userRole === "ROLE_SENIOR") {
          console.log("[Login] Redirecting to senior home");
          router.replace("/(tabs-senior)/home");
        } else {
          setErrors([{ message: "Rol de usuario no válido" }]);
        }
      } else {
        setErrors([{ message: response.message || "Error al iniciar sesión" }]);
      }
    } catch (error) {
      console.error("[Login] Error:", error);
      let errorMessage = "Error al iniciar sesión";

      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message === "Invalid credentials") {
            errorMessage = "Email o PIN incorrectos";
          }
        } catch {
          errorMessage = error.message;
        }
      }

      setErrors([{ message: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: "email" | "pin") => {
    return errors.find((error) => error.field === field)?.message;
  };

  const inputStyle = (isFocused: boolean, hasError: boolean) => `
    bg-white dark:bg-gray-800 
    p-4 rounded-xl mt-2
    text-gray-900 dark:text-white
    border ${
      hasError
        ? "border-red-500 dark:border-red-400"
        : isFocused
        ? "border-blue-500 dark:border-blue-400"
        : "border-gray-200 dark:border-gray-700"
    }
  `;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 justify-between">
        <View className="flex-1 justify-center">
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
              Linkuy Connect
            </Text>
            <Text
              className="text-lg text-gray-600 dark:text-gray-300 text-center mb-2"
              accessibilityRole="text"
            >
              Bienvenido
            </Text>
            <Text
              className="text-base text-gray-500 dark:text-gray-400 text-center"
              accessibilityRole="text"
            >
              Monitoreo y cuidado para adultos mayores
            </Text>
          </View>

          {errors.some((error) => !error.field) && (
            <View className="mb-6 p-4 bg-red-100 dark:bg-red-900 rounded-xl">
              <Text className="text-red-700 dark:text-red-100 text-base text-center">
                {errors.find((error) => !error.field)?.message}
              </Text>
            </View>
          )}

          <View className="space-y-6">
            <View className="mb-8">
              <Text
                className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
                accessibilityRole="text"
              >
                Correo electrónico
              </Text>
              <View className="relative">
                <TextInput
                  className={inputStyle(
                    isEmailFocused,
                    !!getFieldError("email")
                  )}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text.toLowerCase());
                    setErrors(
                      errors.filter((error) => error.field !== "email")
                    );
                  }}
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
              {getFieldError("email") && (
                <Text className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {getFieldError("email")}
                </Text>
              )}
            </View>

            <View className="mb-8">
              <Text
                className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
                accessibilityRole="text"
              >
                PIN
              </Text>
              <View className="relative">
                <TextInput
                  className={inputStyle(isPinFocused, !!getFieldError("pin"))}
                  placeholder="Ingresa tu PIN"
                  placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    setErrors(errors.filter((error) => error.field !== "pin"));
                  }}
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
              {getFieldError("pin") && (
                <Text className="text-red-500 dark:text-red-400 text-sm mt-1">
                  {getFieldError("pin")}
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              className={`
                mt-8 p-4 rounded-xl
                ${isLoading ? "bg-blue-400" : "bg-blue-600 active:bg-blue-700"}
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

        <View className="py-4">
          <Text className="text-center text-gray-400 dark:text-gray-500 text-sm">
            Versión {version}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
