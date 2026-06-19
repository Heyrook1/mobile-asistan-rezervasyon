import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Provider } from "../api/types";
import { colors, radius, shadow, spacing } from "../theme";
import { formatDistance, formatPriceRange } from "../utils/format";
import { Badge, Stars } from "./ui";

export function ProviderCard({
  provider,
  onPress,
}: {
  provider: Provider;
  onPress: () => void;
}) {
  const distance = formatDistance(provider.distanceKm);
  const initials = provider.doctorName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <LinearGradient
          colors={[provider.color || colors.primary, colors.secondary]}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {provider.doctorName}
            </Text>
            {provider.rating >= 4 ? (
              <Ionicons name="checkmark-circle" size={15} color={colors.verified} />
            ) : null}
          </View>
          {provider.specialty ? (
            <Text style={styles.specialty} numberOfLines={1}>
              {provider.specialty}
            </Text>
          ) : null}
          <Text style={styles.clinic} numberOfLines={1}>
            {provider.clinicName}
            {provider.city ? ` · ${provider.city}` : ""}
          </Text>
        </View>
        {provider.isOpenNow ? <Badge text="Açık" tone="success" /> : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Stars value={provider.rating} />
          <Text style={styles.metaText}>
            {provider.rating.toFixed(1)} ({provider.reviewCount})
          </Text>
        </View>
        {distance ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>{distance}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>
          {formatPriceRange(provider.priceMin, provider.priceMax, provider.currency)}
        </Text>
        {provider.nextAvailable ? (
          <View style={styles.slotChip}>
            <Ionicons name="time-outline" size={12} color={colors.primary} />
            <Text style={styles.slotText}>{provider.nextAvailable.startTime.slice(0, 5)}</Text>
          </View>
        ) : (
          <Badge text="Uygunluk yok" tone="neutral" />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.md,
    ...shadow.card,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 17,
  },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    flexShrink: 1,
  },
  specialty: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  clinic: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  slotText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
