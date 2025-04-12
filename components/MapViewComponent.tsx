// app/components/MapViewComponent.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  Platform,
  Pressable,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, MapType } from "react-native-maps";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MapViewComponentProps {
  location: { latitude: number; longitude: number } | null;
  height?: number;
  onLocationPress?: () => void;
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
  onLocationPress,
}: MapViewComponentProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<MapType>("standard");
  const [isZoomed, setIsZoomed] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMapReady = useCallback(() => {
    console.log("[MapView] Map is ready");
    setIsMapReady(true);
  }, []);

  const toggleMapType = useCallback(() => {
    setMapType((current) =>
      current === "standard" ? "satellite" : "standard"
    );
  }, []);

  const handleZoom = useCallback(() => {
    if (!mapRef.current || !location) return;

    const newRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: isZoomed ? 0.005 : 0.002,
      longitudeDelta: isZoomed ? 0.005 : 0.002,
    };

    mapRef.current.animateToRegion(newRegion, 300);
    setIsZoomed(!isZoomed);
  }, [location, isZoomed]);

  const handleCenter = useCallback(() => {
    if (!mapRef.current || !location) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      300
    );
  }, [location]);

  useEffect(() => {
    if (!location) {
      console.log("[MapView] No location provided");
    } else {
      console.log("[MapView] Location updated:", location);
      handleCenter();
    }
    return () => {
      setIsMapReady(false);
      setMapError(null);
    };
  }, [location]);

  if (!location) {
    return (
      <View
        className="items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden"
        style={{ height, width: width - 48 }}
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
        style={{ height, width: width - 48 }}
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

  return (
    <View
      className="rounded-2xl overflow-hidden shadow-lg"
      style={{ width: width - 48 }}
      accessibilityRole="image"
      accessibilityLabel="Mapa mostrando la ubicación actual"
    >
      <MapView
        ref={mapRef}
        style={{ width: "100%", height }}
        initialRegion={region}
        region={region}
        mapType={mapType}
        customMapStyle={isDark ? darkMapStyle : []}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        onMapReady={handleMapReady}
        loadingEnabled={true}
        loadingIndicatorColor="#2563EB"
        loadingBackgroundColor="#ffffff"
      >
        {isMapReady && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Ubicación actual"
            description="Última ubicación registrada"
            pinColor="#2563EB"
            onPress={onLocationPress}
          />
        )}
      </MapView>

      {/* Controles del mapa */}
      <View className="absolute top-4 right-4 space-y-2">
        <Pressable
          onPress={toggleMapType}
          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
          accessibilityLabel="Cambiar tipo de mapa"
          accessibilityRole="button"
        >
          <Ionicons
            name={mapType === "standard" ? "map-outline" : "map"}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>

        <Pressable
          onPress={handleZoom}
          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
          accessibilityLabel="Ajustar zoom"
          accessibilityRole="button"
        >
          <Ionicons
            name={isZoomed ? "remove-outline" : "add-outline"}
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>

        <Pressable
          onPress={handleCenter}
          className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-md"
          accessibilityLabel="Centrar mapa"
          accessibilityRole="button"
        >
          <Ionicons
            name="locate-outline"
            size={24}
            color={isDark ? "#fff" : "#000"}
          />
        </Pressable>
      </View>
    </View>
  );
}
