import { Platform } from "react-native";
import { config } from "./config";

export function supabaseAuthStorageKey(): string | null {
  const match = config.supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return match ? `sb-${match[1]}-auth-token` : null;
}

/** Fast check — avoids hung getSession() on iOS mobile browsers when logged out. */
export function hasPersistedSupabaseSession(): boolean {
  if (Platform.OS !== "web" || typeof localStorage === "undefined") return false;
  const key = supabaseAuthStorageKey();
  if (!key) return false;
  try {
    const raw = localStorage.getItem(key);
    return Boolean(raw && raw !== "null" && raw.length > 2);
  } catch {
    return false;
  }
}
