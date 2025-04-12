import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log("🔐 Auth Layout - Estado actual:", {
      isLoading,
      user: user ? { id: user.id, role: user.role } : null,
      currentSegment: segments[0],
    });

    if (isLoading) {
      console.log("⏳ Cargando estado de autenticación...");
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";
    const inSeniorGroup = segments[0] === "(tabs-senior)";
    const inCaregiverGroup = segments[0] === "(tabs-caregiver)";

    if (!user && !inAuthGroup) {
      console.log("🚫 No hay usuario autenticado, redirigiendo a login...");
      router.replace("/login");
    } else if (user) {
      const isSenior = user.role.includes("ROLE_SENIOR");
      const isCaregiver = user.role.includes("ROLE_CAREGIVER");

      console.log("👤 Verificando roles:", {
        isSenior,
        isCaregiver,
        currentSegment: segments[0],
      });

      if (isSenior && !inSeniorGroup) {
        console.log("👴 Usuario senior, redirigiendo a panel senior...");
        router.replace("/(tabs-senior)/home");
      } else if (isCaregiver && !inCaregiverGroup) {
        console.log("👨‍⚕️ Usuario cuidador, redirigiendo a panel cuidador...");
        router.replace("/(tabs-caregiver)/home");
      } else if (!isSenior && !isCaregiver) {
        console.log("❌ Usuario sin rol válido, redirigiendo a login...");
        router.replace("/login");
      }
    }
  }, [user, isLoading, segments]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // No renderizar contenido protegido si no hay usuario (excepto en el grupo auth)
  if (!user && segments[0] !== "(auth)") {
    console.log(
      "🛑 Bloqueando renderizado de contenido protegido sin autenticación"
    );
    return null;
  }

  // No renderizar contenido si el usuario no tiene el rol correcto para la ruta
  if (user) {
    const isSenior = user.role.includes("ROLE_SENIOR");
    const isCaregiver = user.role.includes("ROLE_CAREGIVER");
    const inSeniorGroup = segments[0] === "(tabs-senior)";
    const inCaregiverGroup = segments[0] === "(tabs-caregiver)";

    if ((inSeniorGroup && !isSenior) || (inCaregiverGroup && !isCaregiver)) {
      console.log("🚫 Bloqueando renderizado por rol incorrecto:", {
        userRoles: user.role,
        currentSegment: segments[0],
      });
      return null;
    }
  }

  console.log("✅ Renderizando contenido para segmento:", segments[0]);
  return <Slot />;
}
