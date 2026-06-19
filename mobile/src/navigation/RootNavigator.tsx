import React, { useCallback, useEffect, useState } from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList, TabsParamList } from "./types";
import { useAuth } from "../state/AuthContext";
import { AuthScreen } from "../screens/AuthScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { AppointmentsScreen } from "../screens/AppointmentsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProviderDetailScreen } from "../screens/ProviderDetailScreen";
import { ClinicScreen } from "../screens/ClinicScreen";
import { BookingScreen } from "../screens/BookingScreen";
import { RescheduleScreen } from "../screens/RescheduleScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { PremiumTabBar } from "../components/PremiumTabBar";
import { Loading } from "../components/ui";
import * as api from "../api/client";
import { colors } from "../theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

function MainTabs() {
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await api.notifications();
      setUnread(res.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refreshUnread();
    const id = setInterval(refreshUnread, 60000);
    return () => clearInterval(id);
  }, [refreshUnread]);

  return (
    <Tabs.Navigator
      tabBar={(props) => <PremiumTabBar {...props} unread={unread} />}
      screenOptions={{ headerShown: false }}
      screenListeners={{
        focus: () => {
          refreshUnread();
        },
      }}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Appointments" component={AppointmentsScreen} />
      <Tabs.Screen name="Search" component={SearchScreen} />
      <Tabs.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Bildirimler" }}
      />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { phase } = useAuth();

  if (phase === "loading") {
    return <Loading label="Asistan başlatılıyor..." />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {phase === "unauthenticated" ? (
        <AuthScreen />
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="Tabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProviderDetail"
            component={ProviderDetailScreen}
            options={{ title: "Doktor" }}
          />
          <Stack.Screen
            name="Clinic"
            component={ClinicScreen}
            options={{ title: "Klinik" }}
          />
          <Stack.Screen
            name="Booking"
            component={BookingScreen}
            options={{ title: "Randevu Al" }}
          />
          <Stack.Screen
            name="Reschedule"
            component={RescheduleScreen}
            options={{ title: "Randevuyu Ertele" }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: "Favorilerim" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: "Bildirimler" }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
