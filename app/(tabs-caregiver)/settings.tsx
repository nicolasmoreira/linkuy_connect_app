// app/(tabs-caregiver)/settings.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/services/api";
import LogoutButton from "@/components/LogoutButton";

interface Settings {
  inactivityThreshold: number;
  dndStartTime: string;
  dndEndTime: string;
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    inactivityThreshold: 30,
    dndStartTime: "22:00",
    dndEndTime: "07:00",
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching settings:", error);
        Alert.alert("Error", "No se pudo obtener la configuración.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (settings.inactivityThreshold < 1) {
      Alert.alert("Error", "El umbral de inactividad debe ser mayor a 0.");
      return;
    }

    try {
      const success = await api.updateSettings(settings);
      if (success) {
        Alert.alert("Éxito", "Configuración guardada correctamente.");
      } else {
        Alert.alert("Error", "No se pudo guardar la configuración.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo guardar la configuración.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-3xl font-bold text-gray-800 dark:text-white text-center">
        Settings
      </Text>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          Inactivity Threshold (minutes)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          keyboardType="numeric"
          value={String(settings.inactivityThreshold)}
          onChangeText={(text) =>
            setSettings({ ...settings, inactivityThreshold: Number(text) })
          }
          accessibilityLabel="Set inactivity threshold"
        />
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          Do Not Disturb (Start)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          value={settings.dndStartTime}
          onChangeText={(text) =>
            setSettings({ ...settings, dndStartTime: text })
          }
          accessibilityLabel="Set DND start time"
        />
      </View>

      <View className="mt-6">
        <Text className="text-lg font-semibold text-gray-800 dark:text-white">
          Do Not Disturb (End)
        </Text>
        <TextInput
          className="bg-gray-200 dark:bg-gray-700 p-4 rounded-lg mt-2 text-gray-900 dark:text-white"
          value={settings.dndEndTime}
          onChangeText={(text) =>
            setSettings({ ...settings, dndEndTime: text })
          }
          accessibilityLabel="Set DND end time"
        />
      </View>

      <Pressable
        className="bg-blue-600 p-4 rounded-xl mt-6 items-center"
        onPress={handleSave}
        accessibilityLabel="Save settings"
        role="button"
      >
        <Text className="text-white text-lg font-semibold">Save</Text>
      </Pressable>

      <Pressable
        className="mt-4"
        onPress={() => router.push("/(tabs-caregiver)/caregiver")}
        accessibilityLabel="Back to Dashboard"
        role="button"
      >
        <Text className="text-blue-500 text-center">Back</Text>
      </Pressable>

      {/* Botón de Logout agregado para el cuidador */}
      <View className="mt-8">
        <LogoutButton />
      </View>
    </View>
  );
}
