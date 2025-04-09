// app/(tabs-caregiver)/settings.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "@/services/API";
import LogoutButton from "@/components/LogoutButton";
import { Settings } from "@/types";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>({
    inactivity_threshold: 30,
    do_not_disturb: true,
    do_not_disturb_start_time: "22:00",
    do_not_disturb_end_time: "07:00",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await API.getSettings();
        setSettings((prev) => ({ ...prev, ...data }));
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
    if (settings.inactivity_threshold < 1) {
      Alert.alert("Error", "El umbral de inactividad debe ser mayor a 0.");
      return;
    }

    setSaving(true);
    try {
      const success = await API.updateSettings(settings);
      if (success) {
        Alert.alert("Éxito", "Configuración guardada correctamente.");
      } else {
        Alert.alert("Error", "No se pudo guardar la configuración.");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudo guardar la configuración."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        className="flex-1 bg-white dark:bg-gray-900 justify-center items-center"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="mt-4 text-gray-600 dark:text-gray-300">
          Cargando configuración...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ paddingTop: insets.top }}
    >
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            className="p-2"
            onPress={() => router.push("/(tabs-caregiver)/caregiver")}
            accessibilityLabel="Volver al panel principal"
            accessibilityRole="button"
            accessibilityHint="Presiona para volver al panel principal"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#fff" : "#000"}
            />
          </Pressable>
          <Text
            className="text-2xl font-bold text-gray-800 dark:text-white"
            accessibilityRole="header"
          >
            Configuración
          </Text>
          <View className="w-8" /> {/* Spacer for alignment */}
        </View>

        <View className="space-y-6">
          <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <Text
              className="text-lg font-semibold text-gray-800 dark:text-white mb-2"
              accessibilityRole="text"
            >
              Umbral de Inactividad
            </Text>
            <Text
              className="text-gray-600 dark:text-gray-300 mb-2"
              accessibilityRole="text"
            >
              Tiempo en minutos antes de generar una alerta
            </Text>
            <TextInput
              className="bg-white dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-white"
              keyboardType="numeric"
              value={String(settings.inactivity_threshold)}
              onChangeText={(text) =>
                setSettings({ ...settings, inactivity_threshold: Number(text) })
              }
              accessibilityLabel="Umbral de inactividad en minutos"
              accessibilityHint="Ingresa el número de minutos de inactividad antes de generar una alerta"
            />
          </View>

          <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-lg font-semibold text-gray-800 dark:text-white"
                accessibilityRole="text"
              >
                No Molestar
              </Text>
              <Switch
                value={settings.do_not_disturb}
                onValueChange={(value) =>
                  setSettings({ ...settings, do_not_disturb: value })
                }
                accessibilityLabel="Activar modo no molestar"
                accessibilityRole="switch"
              />
            </View>

            {settings.do_not_disturb && (
              <View className="space-y-4">
                <View>
                  <Text
                    className="text-gray-600 dark:text-gray-300 mb-2"
                    accessibilityRole="text"
                  >
                    Hora de inicio
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-white"
                    value={settings.do_not_disturb_start_time}
                    onChangeText={(text) =>
                      setSettings({ ...settings, do_not_disturb_start_time: text })
                    }
                    accessibilityLabel="Hora de inicio del modo no molestar"
                    accessibilityHint="Ingresa la hora de inicio en formato HH:MM"
                  />
                </View>

                <View>
                  <Text
                    className="text-gray-600 dark:text-gray-300 mb-2"
                    accessibilityRole="text"
                  >
                    Hora de fin
                  </Text>
                  <TextInput
                    className="bg-white dark:bg-gray-700 p-4 rounded-lg text-gray-900 dark:text-white"
                    value={settings.do_not_disturb_end_time}
                    onChangeText={(text) =>
                      setSettings({ ...settings, do_not_disturb_end_time: text })
                    }
                    accessibilityLabel="Hora de fin del modo no molestar"
                    accessibilityHint="Ingresa la hora de fin en formato HH:MM"
                  />
                </View>
              </View>
            )}
          </View>

          <Pressable
            className={`
              bg-blue-600 p-4 rounded-xl items-center
              ${saving ? "opacity-70" : ""}
            `}
            onPress={handleSave}
            disabled={saving}
            accessibilityLabel="Guardar configuración"
            accessibilityRole="button"
            accessibilityHint="Presiona para guardar los cambios en la configuración"
            accessibilityState={{ disabled: saving }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-lg font-semibold">Guardar</Text>
            )}
          </Pressable>

          <View className="mt-8">
            <LogoutButton />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
