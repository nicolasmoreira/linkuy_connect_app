import { Link, Stack } from "expo-router";
import React from "react";

import { ThemedText, ThemedView } from "@/components/Themed";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ThemedText className="text-xl font-bold mb-4">
          This screen doesn't exist.
        </ThemedText>

        <Link href="/(auth)/login">
          <ThemedText className="text-blue-600 text-base">
            Go to home screen!
          </ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
