// app/(tabs-senior)/_layout.tsx
import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome name={name} size={28} color={color} style={{ marginBottom: -3 }} />;
}

export default function SeniorTabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
        tabBarStyle: { display: "none" },
      }}
    >
      {/* Pantalla principal para seniors */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Linkuy Connect',
          tabBarIcon: ({ color }) => <TabBarIcon name="info-circle" color={color} />,
        }}
      />
    </Tabs>
  );
}
