import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow, spacing } from "../theme";

type IconName = keyof typeof Ionicons.glyphMap;

const META: Record<
  string,
  { label: string; icon: IconName; iconActive: IconName; center?: boolean }
> = {
  Home: { label: "Ana Sayfa", icon: "home-outline", iconActive: "home" },
  Appointments: { label: "Randevular", icon: "calendar-outline", iconActive: "calendar" },
  Search: { label: "", icon: "scan-outline", iconActive: "scan", center: true },
  Notifications: {
    label: "Bildirimler",
    icon: "notifications-outline",
    iconActive: "notifications",
  },
  Profile: { label: "Profil", icon: "person-outline", iconActive: "person" },
};

export function PremiumTabBar({
  state,
  navigation,
  unread = 0,
}: BottomTabBarProps & { unread?: number }) {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (unread <= 0) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 850,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [unread, pulse]);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const meta = META[route.name] ?? {
            label: route.name,
            icon: "ellipse-outline" as IconName,
            iconActive: "ellipse" as IconName,
          };

          const onPress = () => {
            const ev = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
          };

          if (meta.center) {
            return (
              <View key={route.key} style={styles.centerSlot}>
                <Pressable onPress={onPress} style={styles.fabPress} hitSlop={8}>
                  <LinearGradient
                    colors={["#1BA8B5", "#4DD4E8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fab}
                  >
                    <Ionicons name="search" size={28} color={colors.white} />
                  </LinearGradient>
                </Pressable>
              </View>
            );
          }

          const showBadge = route.name === "Notifications" && unread > 0;

          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                <Ionicons
                  name={focused ? meta.iconActive : meta.icon}
                  size={22}
                  color={focused ? colors.primary : colors.muted}
                />
                {showBadge ? (
                  <Animated.View style={[styles.badge, { transform: [{ scale: pulse }] }]}>
                    <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                  </Animated.View>
                ) : null}
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...Platform.select({
      ios: {
        shadowColor: "#1A2B3C",
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    minHeight: 62,
  },
  item: { flex: 1, alignItems: "center", paddingBottom: 4, gap: 2 },
  iconPill: {
    width: 44,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  label: { fontSize: 10, fontWeight: "600", color: colors.muted },
  labelActive: { color: colors.primary, fontWeight: "800" },
  centerSlot: { flex: 1, alignItems: "center" },
  fabPress: { marginTop: -30 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow.soft,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: "800" },
});
