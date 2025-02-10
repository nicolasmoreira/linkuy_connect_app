import "../global.css";
import { Slot } from "expo-router";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function() {
  return (
    <SafeAreaProvider>
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">      
      <Slot />
    </SafeAreaView>
    </SafeAreaProvider>
  );
}
