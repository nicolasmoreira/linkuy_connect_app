import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, ingresa tu correo y contraseña.");
      return;
    }

    // Simulación de autenticación (integrar API real aquí)
    if (email === "admin@example.com" && password === "1234") {
      router.push("/(tabs)/home");
    } else {
      Alert.alert("Error", "Credenciales incorrectas.");
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
        onChangeText={setEmail}
        keyboardType="email-address"
        accessibilityLabel="Campo de correo electrónico"
      />

      <TextInput
        className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-4 text-gray-900 dark:text-white"
        placeholder="Contraseña"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        accessibilityLabel="Campo de contraseña"
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
        onPress={() => Alert.alert("Soporte", "Contacta a soporte para recuperar tu contraseña.")}
        accessibilityLabel="Recuperar contraseña"
        role="button"
      >
        <Text className="text-blue-500 text-center">¿Olvidaste tu contraseña?</Text>
      </Pressable>
    </View>
  );
}
