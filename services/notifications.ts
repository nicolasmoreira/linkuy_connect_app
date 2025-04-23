import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function configureNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Linkuy Connect",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
      sound: "default",
      bypassDnd: true,
    });
  }
}

export async function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  if (Platform.OS === "ios") {
    await Notifications.setNotificationCategoryAsync("default", [
      {
        identifier: "default",
        buttonTitle: "Abrir",
        options: {
          isAuthenticationRequired: false,
          isDestructive: false,
        },
      },
    ]);
  }
}

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  return finalStatus === "granted";
}

export async function getPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.log("Failed to get push token for push notification!");
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })
  ).data;

  console.log("Push Token:", token);
  return token;
}

export function getDeviceInfo() {
  return {
    deviceName: Device.modelName,
    deviceType: Device.getDeviceTypeAsync(),
    osVersion: Platform.Version,
    appVersion: Constants.expoConfig?.version || "1.0.0",
  };
}
