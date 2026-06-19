import { Platform } from "react-native";
import * as Location from "expo-location";

export type UserCoords = { lat: number; lng: number };

export async function requestUserLocation(): Promise<UserCoords | null> {
  if (Platform.OS === "web") {
    if (typeof navigator === "undefined" || !navigator.geolocation) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
      );
    });
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { lat: pos.coords.latitude, lng: pos.coords.longitude };
}

export async function hasLocationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return true;
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === "granted";
}
