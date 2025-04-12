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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPinFocused, setIsPinFocused] = useState(false);
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !pin) {
      Alert.alert("Error", "Por favor, ingresa tu correo y PIN.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando login con:", email);
      const success = await login(email, pin);

      if (!success) {
        throw new Error("Credenciales incorrectas");
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      Alert.alert("Error", error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (isFocused: boolean) => `
    bg-gray-100 dark:bg-gray-800 
    p-4 rounded-lg mt-4 
    text-gray-900 dark:text-white
    border-2 ${isFocused ? "border-blue-500" : "border-transparent"}
  `;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-1 px-6 justify-center">
        <View className="items-center mb-8">
          <Text
            className="text-3xl font-bold text-gray-800 dark:text-white mb-2"
            accessibilityRole="header"
          >
            Bienvenido a LinkuyConnect
          </Text>
          <Text
            className="text-gray-600 dark:text-gray-300 text-center"
            accessibilityRole="text"
          >
            Monitoreo y cuidado para adultos mayores
          </Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text
              className="text-gray-700 dark:text-gray-300 mb-1"
              accessibilityRole="text"
            >
              Correo electrónico
            </Text>
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
              accessibilityHint="Ingresa tu correo electrónico"
            />
          </View>

          <View>
            <Text
              className="text-gray-700 dark:text-gray-300 mb-1"
              accessibilityRole="text"
            >
              PIN
            </Text>
            <TextInput
              className={inputStyle(isPinFocused)}
              placeholder="Ingresa tu PIN"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              keyboardType="number-pad"
              onFocus={() => setIsPinFocused(true)}
              onBlur={() => setIsPinFocused(false)}
              accessibilityLabel="Campo de PIN"
              accessibilityHint="Ingresa tu PIN"
            />
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            className={`
              mt-6 p-4 rounded-lg
              ${isLoading ? "bg-blue-400" : "bg-blue-600"}
              ${isLoading ? "opacity-70" : ""}
            `}
            accessibilityLabel="Botón de inicio de sesión"
            accessibilityHint="Presiona para iniciar sesión"
            accessibilityState={{ disabled: isLoading }}
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
