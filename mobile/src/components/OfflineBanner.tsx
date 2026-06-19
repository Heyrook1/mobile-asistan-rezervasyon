import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetwork } from "../state/NetworkContext";
import { colors, spacing } from "../theme";

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  if (isOnline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Ionicons name="cloud-offline-outline" size={18} color={colors.white} />
      <Text style={styles.text}>İnternet bağlantısı yok. Bazı işlemler kullanılamayabilir.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#B45309",
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  text: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
});
