import { View, ActivityIndicator } from "react-native";

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <ActivityIndicator
        size="large"
        color="#3B82F6"
        className="dark:text-blue-500"
      />
    </View>
  );
}
