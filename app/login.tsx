// app/login.tsx
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
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import API from "@/services/API";
import ActivityService from "@/services/activityService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPinFocused, setIsPinFocused] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleLogin = async () => {
    if (!email || !pin) {
      Alert.alert("Error", "Por favor, ingresa tu correo y PIN.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando proceso de login...");
      const result = await API.login(email, pin);
      console.log("Login exitoso, resultado:", result);

      console.log("Guardando token...");
      await AsyncStorage.setItem("userToken", result.token);

      console.log("Guardando información del usuario...");
      await AsyncStorage.setItem("user", JSON.stringify(result.user));
      console.log("Usuario guardado:", result.user);

      console.log("Configurando userId en ActivityService:", result.user.id);
      await ActivityService.setUserId(result.user.id);

      console.log("Verificando rol del usuario:", result.user.role);
      const userRole = result.user.role as string[];
      if (userRole.includes("ROLE_CAREGIVER")) {
        console.log("Redirigiendo a panel de cuidador...");
        router.push("/(tabs-caregiver)/caregiver");
      } else if (userRole.includes("ROLE_SENIOR")) {
        console.log("Redirigiendo a panel de adulto mayor...");
        router.push("/(tabs-senior)/home");
      } else {
        console.error("Rol de usuario desconocido:", userRole);
        Alert.alert("Error", "Rol de usuario desconocido.");
      }
    } catch (error: any) {
      console.error("Error en login:", error);
      Alert.alert("Error", error.message || "Credenciales incorrectas.");
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
              placeholder="••••••••"
              maxLength={8}
              keyboardType="numeric"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={pin}
              onChangeText={setPin}
              secureTextEntry
              onFocus={() => setIsPinFocused(true)}
              onBlur={() => setIsPinFocused(false)}
              accessibilityLabel="Campo de PIN"
              accessibilityHint="Ingresa tu PIN de 8 dígitos"
            />
          </View>

          <Pressable
            className={`
              bg-blue-600 p-4 rounded-xl mt-6 items-center
              ${isLoading ? "opacity-70" : ""}
            `}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="Iniciar sesión"
            accessibilityRole="button"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">Ingresar</Text>
            )}
          </Pressable>

          <Pressable
            className="mt-4"
            onPress={() =>
              Alert.alert(
                "Recuperar PIN",
                "Por favor, contacta a soporte para recuperar tu PIN.",
                [{ text: "OK", style: "default" }]
              )
            }
            accessibilityLabel="Recuperar PIN"
            accessibilityRole="button"
            accessibilityHint="Presiona para ver instrucciones de recuperación de PIN"
          >
            <Text className="text-blue-500 text-center">
              ¿Olvidaste tu PIN?
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
