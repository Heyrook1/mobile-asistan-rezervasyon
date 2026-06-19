import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

if (!config.isConfigured && !__DEV__) {
  throw new Error(
    "Supabase yapılandırması eksik. EXPO_PUBLIC_SUPABASE_URL ve EXPO_PUBLIC_SUPABASE_ANON_KEY ortam değişkenlerini ayarlayın."
  );
}

/** Reliable session storage on mobile browsers (AsyncStorage can hang on some WebViews). */
const webAuthStorage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => {
          try {
            return Promise.resolve(
              typeof localStorage !== "undefined" ? localStorage.getItem(key) : null
            );
          } catch {
            return Promise.resolve(null);
          }
        },
        setItem: (key: string, value: string) => {
          try {
            if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
          } catch {
            /* private mode / quota */
          }
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          try {
            if (typeof localStorage !== "undefined") localStorage.removeItem(key);
          } catch {
            /* ignore */
          }
          return Promise.resolve();
        },
      }
    : AsyncStorage;

const supabaseUrl = config.supabaseUrl || (__DEV__ ? "https://placeholder.supabase.co" : "");
const supabaseAnonKey = config.supabaseAnonKey || (__DEV__ ? "public-anon-key" : "");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
