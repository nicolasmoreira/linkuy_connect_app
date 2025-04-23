import React, { createContext, useContext, useState, useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  configureNotificationChannel,
  configureNotificationHandler,
  getPushToken,
  getDeviceInfo,
} from "@/services/notifications";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<string | null>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  useEffect(() => {
    // Configure notifications
    configureNotificationChannel();
    configureNotificationHandler();

    // Register for push notifications
    registerForPushNotifications();

    // Listen for notifications while the app is in the foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification responses (when user taps on notification)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  async function registerForPushNotifications(): Promise<string | null> {
    const token = await getPushToken();
    if (token) {
      setExpoPushToken(token);
      console.log("Device Info:", await getDeviceInfo());
    }
    return token;
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        registerForPushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
