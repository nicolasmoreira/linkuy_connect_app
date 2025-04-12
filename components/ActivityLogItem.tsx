import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ActivityLog } from "../types/activity";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityLogItemProps {
  activity: ActivityLog;
  onPress?: () => void;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "map-marker";
    case "INACTIVITY_ALERT":
      return "alert";
    case "FALL_DETECTED":
      return "alert-octagon";
    default:
      return "information";
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "text-blue-600 dark:text-blue-400";
    case "INACTIVITY_ALERT":
      return "text-yellow-600 dark:text-yellow-400";
    case "FALL_DETECTED":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

const getActivityTitle = (type: string) => {
  switch (type) {
    case "LOCATION_UPDATE":
      return "Actualización de ubicación";
    case "INACTIVITY_ALERT":
      return "Alerta de inactividad";
    case "FALL_DETECTED":
      return "Detección de caída";
    default:
      return "Actividad";
  }
};

export default function ActivityLogItem({
  activity,
  onPress,
}: ActivityLogItemProps) {
  const iconName = getActivityIcon(activity.type);
  const colorClass = getActivityColor(activity.type);
  const title = getActivityTitle(activity.type);
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-4 bg-white dark:bg-gray-800 rounded-2xl mb-3 shadow-sm"
      accessibilityRole="button"
      accessibilityLabel={`${title} - ${timeAgo}`}
      accessibilityHint="Presiona para ver más detalles"
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center bg-opacity-20 ${colorClass.replace(
          "text-",
          "bg-"
        )}`}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          className={colorClass}
        />
      </View>

      <View className="flex-1 ml-4">
        <Text className="text-gray-900 dark:text-white font-medium text-base">
          {title}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {timeAgo}
        </Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        className="text-gray-400 dark:text-gray-500"
      />
    </Pressable>
  );
}
