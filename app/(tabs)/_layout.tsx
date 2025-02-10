import { Tabs } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
            tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].secondary,
            tabBarStyle: {
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderTopColor: Colors[colorScheme ?? 'light'].secondary,
            },
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: "Inicio",
              tabBarAccessibilityLabel: "Ir a la pantalla de inicio",
            }}
          />
          <Tabs.Screen
            name="caregiver"
            options={{
              title: "Cuidadores",
              tabBarAccessibilityLabel: "Ver lista de cuidadores",
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: "Historial",
              tabBarAccessibilityLabel: "Ver historial de ubicaciones",
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Configuración",
              tabBarAccessibilityLabel: "Abrir configuración de la aplicación",
            }}
          />
        </Tabs>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
