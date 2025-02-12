// app/components/MapViewComponent.tsx
import React from "react";
import { View, Text, Dimensions } from "react-native";
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

  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <MapView
      style={{ width: Dimensions.get("window").width - 16, height: 300 }}
      region={region}
      accessibilityLabel="Mapa de ubicación del adulto mayor"
    >
      <Marker coordinate={location} title="Ubicación actual" />
    </MapView>
  );
}
