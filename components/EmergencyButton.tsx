import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import API from "@/services/API";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function EmergencyButton() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const colorScheme = useColorScheme();

  const handleEmergencyPress = async () => {
    setLoading(true);
    try {
      const success = await API.sendAlert({
        type: "emergency",
        location: { latitude: 37.7749, longitude: -122.4194 }, // Simulación
        message: "Emergencia activada",
      });

      if (success) {
        setSent(true);
        Alert.alert("Emergencia", "La alerta de emergencia ha sido enviada.");
      } else {
        Alert.alert("Error", "No se pudo enviar la alerta. Inténtelo de nuevo.");
      }
    } catch (error) {
      console.error("Error enviando alerta:", error);
      Alert.alert("Error", "Ocurrió un problema al enviar la alerta.");
    } finally {
      setLoading(false);
      setTimeout(() => setSent(false), 5000); // Restablece el estado después de 5 segundos
    }
  };

  return (
    <View className="items-center mt-6">
      <Pressable
        className={`${
          sent ? "bg-green-600" : "bg-red-600"
        } p-6 rounded-full shadow-lg active:opacity-75`}
        onPress={handleEmergencyPress}
        disabled={loading}
        accessibilityLabel="Botón de emergencia para enviar una alerta"
        role="button"
      >
        {loading ? (
          <ActivityIndicator color={Colors[colorScheme ?? 'light'].text} />
        ) : (
          <Text className="text-white text-lg font-bold">
            {sent ? "¡Enviado!" : "¡Emergencia!"}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
