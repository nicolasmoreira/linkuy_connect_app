import React from "react";
import { Text } from "react-native";

interface StyledTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function StyledText({ children, className = "" }: StyledTextProps) {
  return (
    <Text className={`text-gray-800 dark:text-white text-lg ${className}`} accessibilityRole="text">
      {children}
    </Text>
  );
}
