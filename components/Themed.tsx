import React from "react";
import { Text, View } from "react-native";

interface ThemedViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedView({ children, className = "" }: ThemedViewProps) {
  return <View className={`bg-white dark:bg-gray-900 p-4 ${className}`}>{children}</View>;
}

interface ThemedTextProps {
  children: React.ReactNode;
  className?: string;
}

export function ThemedText({ children, className = "" }: ThemedTextProps) {
  return (
    <Text className={`text-gray-800 dark:text-white text-lg ${className}`} accessibilityRole="text">
      {children}
    </Text>
  );
}
