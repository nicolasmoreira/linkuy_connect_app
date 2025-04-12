// app/_layout.tsx
import "../global.css";
import { Slot, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

function AuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log("🔐 Auth Guard - Estado:", {
      isLoading,
      hasUser: !!user,
      segments,
    });

    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      console.log("🚫 No hay usuario, redirigiendo a login...");
      router.replace("/login");
    } else if (user) {
      const isSenior = user.role.includes("ROLE_SENIOR");
      const isCaregiver = user.role.includes("ROLE_CAREGIVER");
      const inSeniorGroup = segments[0] === "(tabs-senior)";
      const inCaregiverGroup = segments[0] === "(tabs-caregiver)";

      if (isSenior && !inSeniorGroup) {
        router.replace("/(tabs-senior)/home");
      } else if (isCaregiver && !inCaregiverGroup) {
        router.replace("/(tabs-caregiver)/home");
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AuthGuard />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
