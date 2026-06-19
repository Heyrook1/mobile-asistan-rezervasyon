import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { requestUserLocation } from "../lib/location";
import { colors, radius, spacing } from "../theme";

export function LocationPromptCard() {
  const { clientUser, setClientUser } = useAuth();
  const [loading, setLoading] = useState(false);

  if (clientUser?.locationLat != null && clientUser?.locationLng != null) return null;

  const enable = async () => {
    setLoading(true);
    try {
      const coords = await requestUserLocation();
      if (!coords) return;
      const updated = await api.updateProfile({
        locationLat: coords.lat,
        locationLng: coords.lng,
      });
      if (updated) setClientUser(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <Ionicons name="navigate-outline" size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Konumunuzu paylaşın</Text>
        <Text style={styles.sub}>
          Size en yakın klinikleri ve mesafeyi gösterebiliriz. İsterseniz profilden şehir de
          girebilirsiniz.
        </Text>
      </View>
      <Pressable
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={enable}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Text style={styles.btnText}>Konumu Aç</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 14, fontWeight: "800", color: colors.text },
  sub: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 4 },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    minWidth: 88,
    alignItems: "center",
  },
  btnText: { color: colors.white, fontSize: 12, fontWeight: "800" },
});
