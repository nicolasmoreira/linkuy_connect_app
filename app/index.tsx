import { Text, View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function IndexScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900 p-6">
      <View className="items-center justify-center">
        <Text className="text-3xl font-bold text-gray-800 dark:text-white">
          Bienvenido a LinkuyConnect
        </Text>

        <Text className="text-lg text-gray-600 dark:text-gray-300 mt-4">
          Una aplicación diseñada para conectar a adultos mayores con sus
          cuidadores.
        </Text>

        <Pressable
          className="bg-blue-600 p-4 rounded-xl mt-6"
          onPress={() => router.push("/(tabs)/home")}
          accessibilityLabel="Ir a la pantalla de inicio"
          role="button"
        >
          <Text className="text-white text-lg font-semibold">Comenzar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
