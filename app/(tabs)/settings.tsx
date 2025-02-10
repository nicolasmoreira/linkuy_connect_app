import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import API from "@/services/API";

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    inactivityThreshold: 30,
    dndStartTime: "22:00",
    dndEndTime: "07:00",
  });

  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await API.getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error obteniendo configuración:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (settings.inactivityThreshold < 1) {
      Alert.alert("Error", "El umbral de inactividad debe ser mayor a 0.");
      return;
    }

    const success = await API.updateSettings(settings);
    if (success) {
      Alert.alert("Éxito", "Configuración guardada correctamente.");
    } else {
      Alert.alert("Error", "No se pudo guardar la configuración.");
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        Configuración
      </Text>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          Umbral de Inactividad (minutos)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          keyboardType="numeric"
          value={String(settings.inactivityThreshold)}
          onChangeText={(text) => setSettings({ ...settings, inactivityThreshold: Number(text) })}
          accessibilityLabel="Configurar umbral de inactividad"
        />
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          No Molestar (Inicio)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          value={settings.dndStartTime}
          onChangeText={(text) => setSettings({ ...settings, dndStartTime: text })}
          accessibilityLabel="Configurar inicio de no molestar"
        />
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          No Molestar (Fin)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          value={settings.dndEndTime}
          onChangeText={(text) => setSettings({ ...settings, dndEndTime: text })}
          accessibilityLabel="Configurar fin de no molestar"
        />
      </View>

      <Pressable
        className="bg-blue-600 p-4 rounded-xl mt-6 items-center"
        onPress={handleSave}
        accessibilityLabel="Guardar configuración"
        role="button"
      >
        <Text className="text-white text-lg font-semibold">Guardar</Text>
      </Pressable>

      <Pressable
        className="mt-4"
        onPress={() => router.push("/(tabs)/home")}
        accessibilityLabel="Volver a la pantalla principal"
        role="button"
      >
        <Text className="text-blue-500 text-center">Volver</Text>
      </Pressable>
    </View>
  );
}
