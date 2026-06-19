import React, { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "../theme";

const STORAGE_KEY = "asistan_cookie_consent_v1";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    try {
      const accepted =
        typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
      if (!accepted) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (Platform.OS !== "web" || !visible) return null;

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.card}>
        <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Çerezler ve gizlilik</Text>
          <Text style={styles.text}>
            Oturumunuzu sürdürmek ve hizmeti iyileştirmek için gerekli çerezleri kullanıyoruz.
            Reklam veya üçüncü taraf izleme çerezi kullanmıyoruz.
          </Text>
        </View>
        <Pressable onPress={accept} style={styles.btn}>
          <Text style={styles.btnText}>Kabul Et</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    padding: spacing.md,
    pointerEvents: "box-none",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.card,
  },
  title: { fontSize: 14, fontWeight: "800", color: colors.text, marginBottom: 4 },
  text: { fontSize: 12, lineHeight: 18, color: colors.muted },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  btnText: { color: colors.white, fontSize: 13, fontWeight: "800" },
});
