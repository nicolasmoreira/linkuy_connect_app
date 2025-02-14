// app/login.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "@/services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !pin) {
      Alert.alert("Error", "Por favor, ingresa tu correo y PIN.");
      return;
    }

    try {
      const result = await API.login(email, pin);
      // Guardar el token y la información del usuario en AsyncStorage
      await AsyncStorage.setItem("userToken", result.token);
      await AsyncStorage.setItem("userInfo", JSON.stringify(result.user));
      
      const userRole = result.user.role as string[];  // Type assertion
      if (userRole.includes("ROLE_CAREGIVER")) {
        router.push("/(tabs-caregiver)/caregiver");
      } else if (userRole.includes("ROLE_SENIOR")) {
        router.push("/(tabs-senior)/home");
      } else {
        Alert.alert("Error", "Rol de usuario desconocido.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Credenciales incorrectas.");
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        Iniciar Sesión
      </Text>

      <TextInput
        className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-6 text-gray-900 dark:text-white"
        placeholder="Correo electrónico"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={(text) => setEmail(text.toLowerCase())}
        keyboardType="email-address"
        accessibilityLabel="Campo de correo electrónico"
      />

      <TextInput
        className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-4 text-gray-900 dark:text-white"
        placeholder="PIN"
        maxLength={8}
        keyboardType="numeric"
        placeholderTextColor="#aaa"
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        accessibilityLabel="Campo de PIN"
      />

      <Pressable
        className="bg-blue-600 p-4 rounded-xl mt-6 items-center"
        onPress={handleLogin}
        accessibilityLabel="Iniciar sesión"
        role="button"
      >
        <Text className="text-white text-lg font-semibold">Ingresar</Text>
      </Pressable>

      <Pressable
        className="mt-4"
        onPress={() =>
          Alert.alert("Soporte", "Contacta a soporte para recuperar tu PIN.")
        }
        accessibilityLabel="Recuperar PIN"
        role="button"
      >
        <Text className="text-blue-500 text-center">¿Olvidaste tu PIN?</Text>
      </Pressable>
    </View>
  );
}
