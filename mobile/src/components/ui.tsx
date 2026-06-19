import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, spacing } from "../theme";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
      ? colors.dangerSoft
      : colors.surfaceAlt;
  const fg =
    variant === "primary"
      ? colors.white
      : variant === "danger"
      ? colors.danger
      : colors.text;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.6 : 1 },
        variant === "primary" && styles.buttonPrimary,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function Field({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function Badge({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "primary";
}) {
  const map = {
    neutral: { bg: colors.surfaceAlt, fg: colors.muted },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{text}</Text>
    </View>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <View style={{ flexDirection: "row" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text
          key={i}
          style={{ color: i <= rounded ? colors.star : colors.border, fontSize: size }}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

export function Skeleton({
  width,
  height,
  radius: r = radius.sm,
  style,
}: {
  width?: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          width: (width as number) ?? "100%",
          height,
          borderRadius: r,
          backgroundColor: colors.surfaceAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProviderCardSkeleton() {
  return (
    <View style={[styles.card, { gap: spacing.md }]}>
      <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
        <Skeleton width={48} height={48} radius={radius.md} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={"70%"} height={14} />
          <Skeleton width={"45%"} height={12} />
        </View>
      </View>
      <Skeleton height={12} width={"60%"} />
      <Skeleton height={36} radius={radius.md} />
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.center}>
      <View style={styles.loadingRing}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
      {label ? <Text style={styles.muted}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = "document-text-outline",
}: {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.center}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.screenHeader}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonPrimary: {
    ...shadow.soft,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    textAlign: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  loadingRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  screenHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 4,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
  },
  screenSub: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "500",
  },
});
