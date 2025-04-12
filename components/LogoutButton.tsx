import React from "react";
import { Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <Pressable
      onPress={handleLogout}
      className="bg-red-600 px-4 py-2 rounded"
      accessibilityLabel="Logout"
      role="button"
    >
      <Text className="text-white text-base font-semibold">Logout</Text>
    </Pressable>
  );
}
