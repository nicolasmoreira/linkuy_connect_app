import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useRouter } from "expo-router";

export function AppStateHandler() {
  const appState = useRef(AppState.currentState);
  const router = useRouter();

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App has come to foreground
      console.log("App has come to foreground");

      // Force a re-render of the current route
      const currentRoute = router.canGoBack() ? ".." : "/";
      router.replace(currentRoute);
    }

    appState.current = nextAppState;
  };

  return null;
}
