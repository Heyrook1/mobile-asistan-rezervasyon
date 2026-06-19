import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const NATIVE_DRIVER = Platform.OS !== "web";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppointmentRow, Provider } from "../../api/types";
import { colors, radius, shadow, spacing } from "../../theme";
import { formatDate, formatDistance } from "../../utils/format";

export const CATEGORIES: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  query: string;
  tint: string;
  fg: string;
}[] = [
  { label: "Hekim", icon: "medkit-outline", query: "genel", tint: "#E0F4FF", fg: "#0284C7" },
  { label: "Kardiyoloji", icon: "heart-outline", query: "kardiyoloji", tint: "#FCE7F3", fg: "#DB2777" },
  { label: "Dermatoloji", icon: "leaf-outline", query: "dermatolog", tint: "#D1FAE5", fg: "#059669" },
  { label: "Pediatri", icon: "happy-outline", query: "pediatri", tint: "#FEF3C7", fg: "#D97706" },
  { label: "Psikoloji", icon: "bulb-outline", query: "psikolog", tint: "#E0E7FF", fg: "#4F46E5" },
  { label: "Diş", icon: "fitness-outline", query: "diş", tint: "#CFFAFE", fg: "#0891B2" },
];

export function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function featuredClinics(providers: Provider[]): Provider[] {
  const map = new Map<string, Provider>();
  for (const p of providers) {
    const existing = map.get(p.businessId);
    if (!existing || p.rating > existing.rating) map.set(p.businessId, p);
  }
  return [...map.values()];
}

function formatNextSlot(slot: Provider["nextAvailable"]): string | null {
  if (!slot) return null;
  return `${formatDate(slot.date)} · ${slot.startTime.slice(0, 5)}`;
}

function appointmentCountdown(date: string, startTime: string): string {
  const target = new Date(`${date}T${startTime}`);
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "Şimdi";
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days > 0) return `${days} gün ${hours} sa`;
  if (hours > 0) return `${hours} saat`;
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  return `${mins} dk`;
}

export function trustBadges(data: {
  nearby: Provider[];
  availableToday: Provider[];
  topRated: Provider[];
} | null): { icon: keyof typeof Ionicons.glyphMap; label: string }[] {
  const badges: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: "shield-checkmark-outline", label: "Güvenli Rezervasyon" },
  ];
  const all = [...(data?.nearby ?? []), ...(data?.topRated ?? [])];
  if (all.some((p) => p.reviewCount > 0))
    badges.push({ icon: "checkmark-circle-outline", label: "Gerçek Değerlendirmeler" });
  if ([...(data?.nearby ?? []), ...(data?.availableToday ?? [])].some((p) => p.autoConfirm))
    badges.push({ icon: "flash-outline", label: "Anında Onay" });
  if ((data?.nearby.length ?? 0) > 0)
    badges.push({ icon: "business-outline", label: "Kayıtlı Klinikler" });
  return badges;
}

function HeroShieldVisual() {
  return (
    <View style={styles.shieldWrap}>
      <View style={styles.shieldGlow} />
      <View style={styles.shieldGlass}>
        <Ionicons name="shield-checkmark" size={36} color="rgba(255,255,255,0.95)" />
        <View style={styles.shieldCross}>
          <View style={styles.crossV} />
          <View style={styles.crossH} />
        </View>
      </View>
      <View style={styles.ekgLine}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View
            key={i}
            style={[
              styles.ekgSeg,
              i === 2 && styles.ekgPeak,
              i === 3 && styles.ekgDip,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export function GreetingHeader({
  name,
  unread,
  onBell,
}: {
  name: string;
  unread: number;
  onBell: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons name="medical" size={14} color={colors.white} />
          </View>
          <Text style={styles.brandName}>Asistan</Text>
        </View>
        <Text style={styles.greetingLine} numberOfLines={1}>
          {timeGreeting()}, {name}!
        </Text>
      </View>
      <Pressable style={styles.bell} onPress={onBell} hitSlop={8}>
        <Ionicons name="notifications-outline" size={22} color={colors.text} />
        {unread > 0 ? <View style={styles.bellDot} /> : null}
      </Pressable>
    </View>
  );
}

export function SearchBar({
  onPress,
  onVoice,
  onFilter,
}: {
  onPress: () => void;
  onVoice?: () => void;
  onFilter: () => void;
}) {
  return (
    <View style={styles.searchRow}>
      <Pressable
        style={({ pressed }) => [styles.searchBar, pressed && styles.pressedSoft]}
        onPress={onPress}
      >
        <Ionicons name="search-outline" size={20} color={colors.muted} />
        <Text style={styles.searchPlaceholder} numberOfLines={1}>
          Doktor, klinik veya hizmet ara...
        </Text>
        {onVoice ? (
          <Pressable style={styles.searchMic} onPress={onVoice} hitSlop={8}>
            <Ionicons name="mic-outline" size={17} color={colors.primary} />
          </Pressable>
        ) : null}
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.filterBtn, pressed && styles.pressedSoft]}
        onPress={onFilter}
      >
        <Ionicons name="options-outline" size={22} color={colors.white} />
      </Pressable>
    </View>
  );
}

export function HeroBanner({ onPress }: { name: string; onPress: () => void }) {
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 4000, useNativeDriver: NATIVE_DRIVER }),
        Animated.timing(breathe, { toValue: 0, duration: 4000, useNativeDriver: NATIVE_DRIVER }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] });

  return (
    <View style={styles.heroWrap}>
      <LinearGradient
        colors={["#0D5C6B", "#1BA8B5", "#4DD4E8"]}
        start={{ x: 0, y: 0.2 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Animated.View style={[styles.heroOrb, { opacity: glowOpacity }]} />
        <View style={styles.heroContent}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Sağlığınız,{"\n"}paha biçilmezdir</Text>
            <Text style={styles.heroSub}>
              En iyi uzmanları keşfedin, anında randevu alın.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.heroBtn, pressed && styles.pressedSoft]}
              onPress={onPress}
            >
              <Text style={styles.heroBtnText}>Hizmetler</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <HeroShieldVisual />
        </View>
      </LinearGradient>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

export function SectionHeader({
  title,
  onAll,
}: {
  title: string;
  onAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onAll ? (
        <Pressable onPress={onAll} hitSlop={8} style={styles.sectionAllBtn}>
          <Text style={styles.sectionAll}>Tümünü gör</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoryRow({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catScroll}
    >
      {CATEGORIES.map((c) => (
        <Pressable
          key={c.label}
          style={({ pressed }) => [styles.catItem, pressed && styles.pressed]}
          onPress={() => onSelect(c.query)}
        >
          <View style={[styles.catCircle, { backgroundColor: c.tint }]}>
            <Ionicons name={c.icon} size={26} color={c.fg} />
          </View>
          <Text style={styles.catLabel} numberOfLines={1}>
            {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function ClinicListCard({
  provider,
  onOpen,
  onBook,
  isFavorite,
  onToggleFavorite,
}: {
  provider: Provider;
  onOpen: () => void;
  onBook: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const distance = formatDistance(provider.distanceKm);
  const next = formatNextSlot(provider.nextAvailable);
  const initial = provider.clinicName.charAt(0).toUpperCase();
  const verified = provider.reviewCount >= 5 || provider.rating >= 4;

  return (
    <Pressable
      style={({ pressed }) => [styles.clinicCard, pressed && styles.pressedSoft]}
      onPress={onOpen}
    >
      {provider.logoUrl ? (
        <Image source={{ uri: provider.logoUrl }} style={styles.clinicImg} />
      ) : (
        <LinearGradient
          colors={[provider.primaryColor || "#1BA8B5", "#4DD4E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.clinicImg}
        >
          <Text style={styles.clinicImgText}>{initial}</Text>
        </LinearGradient>
      )}

      <View style={styles.clinicBody}>
        <View style={styles.clinicTopRow}>
          <View style={styles.clinicNameRow}>
            <Text style={styles.clinicName} numberOfLines={1}>
              {provider.clinicName}
            </Text>
            {verified ? (
              <Ionicons name="checkmark-circle" size={16} color={colors.verified} />
            ) : null}
          </View>
          <Pressable
            style={styles.heart}
            onPress={onToggleFavorite}
            hitSlop={8}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? colors.danger : colors.muted}
            />
          </Pressable>
        </View>

        <View style={styles.clinicMetaRow}>
          <Ionicons name="star" size={13} color={colors.star} />
          <Text style={styles.clinicMeta}>
            {provider.rating.toFixed(1)} ({provider.reviewCount})
          </Text>
          {distance ? (
            <>
              <Text style={styles.metaDivider}>·</Text>
              <Ionicons name="location-outline" size={13} color={colors.muted} />
              <Text style={styles.clinicMeta}>{distance}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.clinicHoursRow}>
          {next ? (
            <View style={styles.hoursChip}>
              <Ionicons name="time-outline" size={13} color={colors.muted} />
              <Text style={styles.hoursText}>{next}</Text>
            </View>
          ) : (
            <Text style={styles.clinicSpec} numberOfLines={1}>
              {provider.specialty ?? provider.doctorName}
            </Text>
          )}
          {provider.isOpenNow ? (
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>Açık</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.clinicFooter}>
          <View style={styles.clinicActions}>
            <Pressable style={styles.actionIcon} hitSlop={6}>
              <Ionicons name="call-outline" size={18} color={colors.muted} />
            </Pressable>
            <Pressable style={styles.actionIcon} hitSlop={6}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.bookBtn, pressed && styles.pressedSoft]}
            onPress={onBook}
          >
            <LinearGradient
              colors={["#1BA8B5", "#4DD4E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookBtnGrad}
            >
              <Text style={styles.bookBtnText}>Rezervasyon</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export function AvailableTodayRow({
  providers,
  onOpen,
}: {
  providers: Provider[];
  onOpen: (p: Provider) => void;
}) {
  if (providers.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.docScroll}
    >
      {providers.map((p) => {
        const initials = p.doctorName
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        const next = formatNextSlot(p.nextAvailable);
        return (
          <Pressable
            key={p.staffId}
            style={({ pressed }) => [styles.docCard, pressed && styles.pressed]}
            onPress={() => onOpen(p)}
          >
            <LinearGradient
              colors={[p.color || colors.primary, colors.secondary]}
              style={styles.docAvatar}
            >
              <Text style={styles.docInitials}>{initials}</Text>
              <View style={styles.docLive} />
            </LinearGradient>
            <Text style={styles.docName} numberOfLines={1}>
              {p.doctorName}
            </Text>
            {p.specialty ? (
              <Text style={styles.docSpec} numberOfLines={1}>
                {p.specialty}
              </Text>
            ) : null}
            {next ? <Text style={styles.docSlot}>{next}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function PromoBanner({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.promo, pressed && styles.pressedSoft]}
      onPress={onPress}
    >
      <LinearGradient
        colors={["rgba(27,168,181,0.12)", "rgba(77,212,232,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.promoInner}>
        <View style={styles.promoBadge}>
          <Ionicons name="flash" size={18} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.promoTitle}>60 saniyede randevu</Text>
          <Text style={styles.promoSub}>Uzman seç, saati belirle, anında onayla.</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={colors.primary} />
      </View>
    </Pressable>
  );
}

export function UpcomingWidget({
  appointment,
  onView,
  onReschedule,
  onCancel,
}: {
  appointment: AppointmentRow;
  onView: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const doctor = appointment.TeamMember?.fullName ?? appointment.Business?.name ?? "Randevunuz";
  const clinic = appointment.Business?.name;
  const countdown = appointmentCountdown(appointment.date, appointment.startTime);

  return (
    <LinearGradient
      colors={["#0D5C6B", "#1BA8B5"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.upcoming}
    >
      <View style={styles.upcomingHeader}>
        <Text style={styles.upcomingLabel}>Yaklaşan Randevu</Text>
        <View style={styles.countdownPill}>
          <Ionicons name="time-outline" size={12} color={colors.white} />
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      </View>
      <Text style={styles.upcomingDoctor}>{doctor}</Text>
      {clinic ? <Text style={styles.upcomingClinic}>{clinic}</Text> : null}
      <Text style={styles.upcomingWhen}>
        {formatDate(appointment.date)} · {appointment.startTime.slice(0, 5)}
      </Text>
      <View style={styles.upcomingActions}>
        <UpAction label="Görüntüle" onPress={onView} primary />
        <UpAction label="Ertele" onPress={onReschedule} />
        <UpAction label="İptal" onPress={onCancel} danger />
      </View>
    </LinearGradient>
  );
}

function UpAction({
  label,
  onPress,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      style={[styles.upBtn, primary && styles.upBtnPrimary, danger && styles.upBtnDanger]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.upBtnText,
          primary && styles.upBtnTextPrimary,
          danger && styles.upBtnTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function TrustRow({
  badges,
}: {
  badges: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.trustScroll}
    >
      {badges.map((b) => (
        <View key={b.label} style={styles.trustBadge}>
          <Ionicons name={b.icon} size={15} color={colors.primary} />
          <Text style={styles.trustLabel}>{b.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.97 }] },
  pressedSoft: { opacity: 0.92, transform: [{ scale: 0.985 }] },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 17, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  greetingLine: { fontSize: 22, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  bell: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  bellDot: {
    position: "absolute",
    top: 10,
    right: 11,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    ...shadow.card,
  },
  searchPlaceholder: { flex: 1, color: colors.muted, fontSize: 14 },
  searchMic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },

  heroWrap: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: "hidden",
    minHeight: 178,
    justifyContent: "center",
  },
  heroOrb: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.2)",
    top: -50,
    right: -30,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  heroText: { flex: 1, paddingRight: spacing.sm },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: "800", lineHeight: 28 },
  heroSub: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 200,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  heroBtnText: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  shieldWrap: { width: 100, height: 110, alignItems: "center", justifyContent: "center" },
  shieldGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  shieldGlass: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCross: { position: "absolute", alignItems: "center", justifyContent: "center" },
  crossV: {
    position: "absolute",
    width: 3,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 2,
  },
  crossH: {
    position: "absolute",
    width: 14,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 2,
  },
  ekgLine: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    opacity: 0.7,
  },
  ekgSeg: { width: 4, height: 6, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 1 },
  ekgPeak: { height: 16 },
  ekgDip: { height: 3 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.primary },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  sectionAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  sectionAll: { fontSize: 13, fontWeight: "700", color: colors.primary },

  catScroll: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  catItem: { alignItems: "center", gap: 8, width: 68 },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  catLabel: { fontSize: 11, fontWeight: "700", color: colors.text },

  clinicCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  clinicImg: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  clinicImgText: { color: colors.white, fontSize: 36, fontWeight: "800" },
  clinicBody: { flex: 1, gap: 5 },
  clinicTopRow: { flexDirection: "row", alignItems: "flex-start" },
  clinicNameRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 4 },
  clinicName: { fontSize: 15, fontWeight: "800", color: colors.text, flexShrink: 1 },
  heart: { padding: 2 },
  clinicMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  clinicMeta: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  metaDivider: { color: colors.border, marginHorizontal: 1 },
  clinicHoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hoursChip: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  hoursText: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  clinicSpec: { fontSize: 12, color: colors.muted, flex: 1 },
  openBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  openBadgeText: { fontSize: 11, fontWeight: "800", color: colors.success },
  clinicFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  clinicActions: { flexDirection: "row", gap: 4 },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtn: { borderRadius: radius.pill, overflow: "hidden" },
  bookBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bookBtnText: { color: colors.white, fontWeight: "800", fontSize: 12 },

  docScroll: { paddingHorizontal: spacing.lg, gap: spacing.md },
  docCard: {
    width: 148,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadow.card,
  },
  docAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  docInitials: { color: colors.white, fontWeight: "800", fontSize: 18 },
  docLive: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  docName: { fontSize: 13, fontWeight: "800", color: colors.text, textAlign: "center" },
  docSpec: { fontSize: 11, color: colors.muted, textAlign: "center" },
  docSlot: { fontSize: 11, color: colors.primary, fontWeight: "700" },

  promo: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.card,
  },
  promoInner: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  promoBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  promoTitle: { fontSize: 15, fontWeight: "800", color: colors.text },
  promoSub: { fontSize: 12, color: colors.muted, marginTop: 2 },

  upcoming: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadow.soft,
  },
  upcomingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countdownText: { fontSize: 11, fontWeight: "800", color: colors.white },
  upcomingDoctor: { fontSize: 18, fontWeight: "800", color: colors.white },
  upcomingClinic: { fontSize: 13, color: "rgba(255,255,255,0.8)" },
  upcomingWhen: { fontSize: 14, fontWeight: "600", color: colors.white, marginTop: 2 },
  upcomingActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  upBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  upBtnPrimary: { backgroundColor: "rgba(255,255,255,0.28)" },
  upBtnDanger: { backgroundColor: "rgba(220,38,38,0.2)" },
  upBtnText: { fontSize: 12, fontWeight: "800", color: colors.white },
  upBtnTextPrimary: { color: colors.white },
  upBtnTextDanger: { color: "#FECACA" },

  trustScroll: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  trustLabel: { fontSize: 12, fontWeight: "700", color: colors.text },
});
