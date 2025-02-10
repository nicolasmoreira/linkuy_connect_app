import React from "react";
import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface MapViewComponentProps {
  location: { latitude: number; longitude: number } | null;
}

export default function MapViewComponent({ location }: MapViewComponentProps) {
  if (!location) {
    return (
      <View className="h-80 w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg">
        <Text className="text-gray-600 dark:text-gray-300">
          Ubicación no disponible
        </Text>
      </View>
    );
  }

  return (
    <MapView
      className="h-80 w-full rounded-lg"
      initialRegion={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      accessibilityLabel="Mapa de ubicación del adulto mayor"
    >
      <Marker coordinate={location} title="Ubicación actual" />
    </MapView>
  );
}
