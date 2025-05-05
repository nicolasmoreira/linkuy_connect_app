// app/(tabs-senior)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useColorScheme, Platform } from "react-native";

export default function SeniorLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerBackTitle: "Volver",
        animation: "slide_from_right",
        headerTitleStyle: {
          color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          fontSize: 20,
          fontWeight: "bold",
        },
        headerStyle: {
          backgroundColor: colorScheme === "dark" ? "#1F2937" : "#FFFFFF",
        },
        headerTintColor: colorScheme === "dark" ? "#FFFFFF" : "#000000",
        ...(Platform.OS === "ios" && {
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          },
        }),
      }}
    >
      <Stack.Screen
        name="home"
        options={{
          title: "Inicio",
          headerTitle: "Linkuy Connect",
          headerTitleStyle: {
            color: colorScheme === "dark" ? "#FFFFFF" : "#000000",
            fontSize: 20,
            fontWeight: "bold",
          },
        }}
      />
    </Stack>
  );
}
