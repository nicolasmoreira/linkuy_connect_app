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
  Modal,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "@/services/API";
import LogoutButton from "@/components/LogoutButton";
import { Settings } from "@/types";
import DateTimePicker from "@react-native-community/datetimepicker";

interface SettingsState {
  inactivity_threshold: number;
  do_not_disturb: boolean;
  do_not_disturb_start_time: string;
  do_not_disturb_end_time: string;
}

function SettingCard({
  children,
  icon,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="bg-gray-50 dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <View className="p-4">
        <View className="flex-row items-center mb-3">
          <View className="bg-blue-100 dark:bg-blue-900 w-10 h-10 rounded-full items-center justify-center mr-3">
            <Ionicons
              name={icon}
              size={20}
              color={isDark ? "#60A5FA" : "#2563EB"}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

function TimePickerInput({
  value,
  onChangeText,
  placeholder,
  label,
  hint,
  onTimeSelected,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  label: string;
  hint: string;
  onTimeSelected: (hours: number, minutes: number) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    setShowPicker(true);
  };

  const handleTimeChange = (_: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === "ios");

    if (selectedDate) {
      const hours = selectedDate.getHours();
      const minutes = selectedDate.getMinutes();
      onTimeSelected(hours, minutes);
    }
  };

  const getInitialDate = () => {
    const now = new Date();
    const [hours, minutes] = (value || "")
      .split(":")
      .map((n) => parseInt(n, 10));

    if (!isNaN(hours) && !isNaN(minutes)) {
      now.setHours(hours);
      now.setMinutes(minutes);
    }

    return now;
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </Text>
      <Pressable onPress={handlePress} className="relative">
        <View
          className="bg-white dark:bg-gray-700 px-4 py-3 rounded-xl flex-row items-center justify-between"
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={hint}
        >
          <Text className="text-gray-900 dark:text-white">
            {value || placeholder}
          </Text>
          <Ionicons
            name="time-outline"
            size={20}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
        </View>
      </Pressable>

      {showPicker &&
        (Platform.OS === "ios" ? (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showPicker}
            onRequestClose={() => setShowPicker(false)}
          >
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white dark:bg-gray-800 rounded-t-3xl">
                <View className="flex-row justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                  <Pressable
                    onPress={() => setShowPicker(false)}
                    className="px-4 py-2"
                  >
                    <Text className="text-blue-600 dark:text-blue-400">
                      Cancelar
                    </Text>
                  </Pressable>
                  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                    Seleccionar Hora
                  </Text>
                  <Pressable
                    onPress={() => setShowPicker(false)}
                    className="px-4 py-2"
                  >
                    <Text className="text-blue-600 dark:text-blue-400">
                      Listo
                    </Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getInitialDate()}
                  mode="time"
                  is24Hour={true}
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor={isDark ? "#fff" : "#000"}
                />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker
            value={getInitialDate()}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        ))}
    </View>
  );
}

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>({
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
        const response = await API.getSettings();
        if (response?.data) {
          const apiSettings = response.data;
          setSettings((prev) => ({
            ...prev,
            inactivity_threshold:
              apiSettings.inactivity_threshold ?? prev.inactivity_threshold,
            do_not_disturb: apiSettings.do_not_disturb ?? prev.do_not_disturb,
            do_not_disturb_start_time:
              apiSettings.do_not_disturb_start_time ??
              prev.do_not_disturb_start_time,
            do_not_disturb_end_time:
              apiSettings.do_not_disturb_end_time ??
              prev.do_not_disturb_end_time,
          }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        Alert.alert(
          "Error",
          "No se pudo obtener la configuración. Por favor, intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const formatTimeInput = (value: string): string => {
    // Remove any non-numeric characters
    const numbers = value.replace(/[^\d]/g, "");

    // Format as HH:MM
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      const hours = numbers.substring(0, 2);
      const minutes = numbers.substring(2);
      return `${hours}:${minutes}`;
    }
    return value;
  };

  const formatTimeForAPI = (time: string): string => {
    if (!time || !time.includes(":")) {
      return "00:00:00";
    }

    const [hours, minutes] = time.split(":");
    const paddedHours = hours.padStart(2, "0");
    const paddedMinutes = minutes.padStart(2, "0");

    return `${paddedHours}:${paddedMinutes}:00`;
  };

  const validateTimeFormat = (time: string): boolean => {
    if (!time || !time.includes(":")) return false;
    const [hours, minutes] = time.split(":");
    const hoursNum = parseInt(hours, 10);
    const minutesNum = parseInt(minutes, 10);
    return (
      !isNaN(hoursNum) &&
      !isNaN(minutesNum) &&
      hoursNum >= 0 &&
      hoursNum <= 23 &&
      minutesNum >= 0 &&
      minutesNum <= 59
    );
  };

  const handleTimeChange = (
    value: string,
    field: "do_not_disturb_start_time" | "do_not_disturb_end_time"
  ) => {
    const formattedTime = formatTimeInput(value);

    if (formattedTime.length <= 5) {
      setSettings((prev) => ({ ...prev, [field]: formattedTime }));
    }
  };

  const handleTimeSelected =
    (field: "do_not_disturb_start_time" | "do_not_disturb_end_time") =>
    (hours: number, minutes: number) => {
      const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}`;
      setSettings((prev) => ({ ...prev, [field]: formattedTime }));
    };

  const handleSave = async () => {
    if (settings.inactivity_threshold < 1) {
      Alert.alert(
        "Error",
        "El umbral de inactividad debe ser mayor a 0 minutos."
      );
      return;
    }

    if (settings.do_not_disturb) {
      const startTime = settings.do_not_disturb_start_time;
      const endTime = settings.do_not_disturb_end_time;

      if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
        Alert.alert(
          "Error",
          "Por favor seleccione horas válidas para el modo no molestar"
        );
        return;
      }
    }

    setSaving(true);
    try {
      const apiSettings = {
        ...settings,
        do_not_disturb_start_time: formatTimeForAPI(
          settings.do_not_disturb_start_time
        ),
        do_not_disturb_end_time: formatTimeForAPI(
          settings.do_not_disturb_end_time
        ),
      };

      console.log("Sending settings to API:", apiSettings);
      const success = await API.updateSettings(apiSettings);

      if (success) {
        Alert.alert("Éxito", "La configuración se guardó correctamente.");
      } else {
        throw new Error("No se pudo guardar la configuración");
      }
    } catch (error: any) {
      console.error("Error saving settings:", error);
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
      contentContainerClassName="pb-8"
    >
      <View className="px-4 py-4">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
            onPress={() => router.push("/(tabs-caregiver)/home")}
            accessibilityLabel="Volver al panel principal"
            accessibilityRole="button"
            accessibilityHint="Presiona para volver al panel principal"
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={isDark ? "#fff" : "#000"}
            />
          </Pressable>
          <Text
            className="text-2xl font-bold text-gray-800 dark:text-white"
            accessibilityRole="header"
          >
            Configuración
          </Text>
          <View className="w-10" />
        </View>

        <View className="space-y-4">
          <SettingCard
            icon="timer-outline"
            title="Umbral de Inactividad"
            subtitle="Tiempo en minutos antes de generar una alerta"
          >
            <TextInput
              className="bg-white dark:bg-gray-700 px-4 py-3 rounded-xl text-gray-900 dark:text-white mt-2"
              keyboardType="numeric"
              value={String(settings.inactivity_threshold)}
              onChangeText={(text) =>
                setSettings({
                  ...settings,
                  inactivity_threshold: Number(text) || 0,
                })
              }
              placeholder="Ejemplo: 30"
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              accessibilityLabel="Umbral de inactividad en minutos"
              accessibilityHint="Ingresa el número de minutos de inactividad antes de generar una alerta"
            />
          </SettingCard>

          <SettingCard
            icon="moon-outline"
            title="No Molestar"
            subtitle="Configura horarios para no recibir alertas"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base text-gray-700 dark:text-gray-300">
                Activar modo no molestar
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
              <View className="mt-2">
                <TimePickerInput
                  value={settings.do_not_disturb_start_time}
                  onChangeText={(text) =>
                    handleTimeChange(text, "do_not_disturb_start_time")
                  }
                  placeholder="22:00"
                  label="Hora de inicio"
                  hint="Selecciona la hora de inicio del modo no molestar"
                  onTimeSelected={handleTimeSelected(
                    "do_not_disturb_start_time"
                  )}
                />
                <TimePickerInput
                  value={settings.do_not_disturb_end_time}
                  onChangeText={(text) =>
                    handleTimeChange(text, "do_not_disturb_end_time")
                  }
                  placeholder="07:00"
                  label="Hora de fin"
                  hint="Selecciona la hora de fin del modo no molestar"
                  onTimeSelected={handleTimeSelected("do_not_disturb_end_time")}
                />
              </View>
            )}
          </SettingCard>

          <Pressable
            className={`
              bg-blue-600 p-4 rounded-2xl items-center shadow-sm
              ${saving ? "opacity-70" : "active:opacity-80"}
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
              <View className="flex-row items-center">
                <Ionicons
                  name="save-outline"
                  size={20}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white text-lg font-semibold ml-2">
                  Guardar Cambios
                </Text>
              </View>
            )}
          </Pressable>

          <View className="mt-4">
            <LogoutButton />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
