import { Platform } from "react-native";
import * as api from "../api/client";

let registering = false;

export async function registerForPushNotifications(): Promise<void> {
  if (Platform.OS === "web" || registering) return;
  registering = true;

  try {
    const Device = await import("expo-device");
    if (!Device.isDevice) return;

    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Randevu bildirimleri",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const Constants = (await import("expo-constants")).default;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;
    if (!token) return;

    await api.registerPushToken(token, Platform.OS as "ios" | "android" | "web");
  } catch (e) {
    if (__DEV__) console.warn("Push registration skipped:", e);
  } finally {
    registering = false;
  }
}
