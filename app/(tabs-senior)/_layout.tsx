// app/(tabs-senior)/_layout.tsx
import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function SeniorLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="home" />
    </Stack>
  );
}
