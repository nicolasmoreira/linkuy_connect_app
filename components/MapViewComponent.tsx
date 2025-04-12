// app/components/MapViewComponent.tsx
import React, { useState, useEffect } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useColorScheme } from "react-native";

interface MapViewComponentProps {
  location: { latitude: number; longitude: number } | null;
  height?: number;
}

const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
];

export default function MapViewComponent({
  location,
  height = 300,
}: MapViewComponentProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setIsMapReady(false);
      setMapError(null);
    };
  }, []);

  if (!location) {
    return (
      <View
        className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
        style={{ height }}
        accessibilityRole="image"
        accessibilityLabel="Mapa no disponible"
      >
        <Text className="text-gray-600 dark:text-gray-300 text-lg">
          Ubicación no disponible
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Esperando datos de ubicación...
        </Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View
        className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
        style={{ height }}
        accessibilityRole="image"
        accessibilityLabel="Error en el mapa"
      >
        <Text className="text-red-600 dark:text-red-400 text-lg">
          Error al cargar el mapa
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {mapError}
        </Text>
      </View>
    );
  }

  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  try {
    return (
      <View
        className="rounded-2xl overflow-hidden shadow-lg"
        accessibilityRole="image"
        accessibilityLabel="Mapa mostrando la ubicación actual"
      >
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width: width - 48, height }}
          region={region}
          customMapStyle={isDark ? darkMapStyle : []}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          onMapReady={() => setIsMapReady(true)}
        >
          {isMapReady && location && (
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="Ubicación actual"
              description="Última ubicación registrada"
              pinColor="#2563EB"
              tracksViewChanges={false}
            />
          )}
        </MapView>
      </View>
    );
  } catch (error) {
    setMapError("Error al inicializar el mapa");
    return null;
  }
}
