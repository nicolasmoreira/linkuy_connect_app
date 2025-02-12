// app/_layout.tsx
import "../global.css";
import { Slot, useRouter } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import React, { useContext, useEffect } from "react";
import { AuthContext } from "@/context/AuthContext";

export default function RootLayout() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  // Si no hay usuario autenticado, redirige a la pantalla de login.
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user]);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
