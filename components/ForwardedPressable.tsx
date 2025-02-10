import React, { forwardRef } from "react";
import { Pressable, Text } from "react-native";

interface ForwardedPressableProps {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
  accessibilityLabel: string;
}

const ForwardedPressable = forwardRef<any, ForwardedPressableProps>(
  ({ onPress, children, className = "bg-blue-600 p-4 rounded-lg", accessibilityLabel }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={`${className} active:opacity-75`}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
      >
        <Text className="text-white text-lg font-semibold">{children}</Text>
      </Pressable>
    );
  }
);

export default ForwardedPressable;
