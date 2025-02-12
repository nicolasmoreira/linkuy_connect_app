// app/(tabs-senior)/home.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import api from "@/services/api";

export default function SeniorHomeScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "No podemos acceder a tu ubicación. Por favor, habilita los permisos en tu dispositivo."
        );
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
        console.info(loc.coords);
      } catch (error) {
        console.error("Error al obtener la ubicación:", error);
        Alert.alert("Error", "No se pudo obtener tu ubicación actual.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEmergencyAlert = async () => {
    try {
      const success = await api.sendAlert({
        type: "emergency",
        location,
        message: "Alerta de emergencia activada por el usuario senior.",
      });
      if (success) {
        Alert.alert(
          "Alerta enviada",
          "Tu alerta de emergencia ha sido enviada. Un cuidador será notificado inmediatamente."
        );
      } else {
        Alert.alert("Error", "Hubo un problema al enviar tu alerta de emergencia.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Error al enviar la alerta.");
    }
  };

  const handleCall911 = () => {
    Linking.openURL("tel:911");
  };

  return (
    <View
      className="flex-1 bg-white dark:bg-gray-900 p-6 justify-center items-center"
      accessible={true}
      accessibilityLabel="Pantalla principal para adultos mayores con opciones de emergencia"
    >
      <Text
        className="text-4xl font-bold text-gray-800 dark:text-white text-center mt-4"
        accessibilityRole="header"
      >
        Bienvenido
      </Text>
      <Text className="mt-4 text-xl text-gray-700 dark:text-gray-300 text-center">
        Esta aplicación te ayuda a mantener tu seguridad.
      </Text>

      <View className="mt-8 flex-row justify-around w-full">
        <Pressable
          className="bg-red-600 w-32 h-32 rounded-full justify-center items-center mx-2"
          onPress={handleEmergencyAlert}
          accessibilityLabel="Enviar alerta de emergencia"
          accessibilityHint="Presiona para enviar una alerta de emergencia a tu cuidador"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold text-center">ENVIAR ALERTA</Text>
        </Pressable>

        <Pressable
          className="bg-blue-600 w-32 h-32 rounded-full justify-center items-center mx-2"
          onPress={handleCall911}
          accessibilityLabel="Llamar al 911"
          accessibilityHint="Presiona para llamar directamente a los servicios de emergencia"
          accessibilityRole="button"
        >
          <Text className="text-white text-xl font-bold text-center">LLAMAR 911</Text>
        </Pressable>
      </View>

      <View className="mt-10 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg w-full">
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-300">
          Instrucciones:
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Si te sientes inseguro o necesitas ayuda inmediata, presiona "Alerta". Se enviará una notificación a tu cuidador.
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Para contactar directamente a los servicios de emergencia, presiona "911".
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Tu ubicación se actualiza automáticamente, siempre y cuando se otorguen los permisos necesarios.
        </Text>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          - Si necesitas mayor asistencia, contacta a tu cuidador.
        </Text>
      </View>
    </View>
  );
}
