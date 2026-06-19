import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { Provider, ReviewItem, ServiceItem } from "../api/types";
import { Badge, Card, Loading, Stars } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { colors, radius, shadow, spacing } from "../theme";
import { formatDate, formatDistance, formatPrice } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "ProviderDetail">;

export function ProviderDetailScreen({ route, navigation }: Props) {
  const { staffId, preview } = route.params;
  const { clientUser } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(preview ?? null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .doctor(staffId, clientUser?.locationLat ?? null, clientUser?.locationLng ?? null)
      .then((res) => {
        if (!active) return;
        if (res.doctor) setProvider(res.doctor);
        setReviews(res.reviews);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [staffId, clientUser?.locationLat, clientUser?.locationLng]);

  useEffect(() => {
    if (provider) {
      trackEvent("provider_view", {
        staffId: provider.staffId,
        clinicName: provider.clinicName,
      });
    }
  }, [provider?.staffId]);

  if (!provider && loading) return <Loading label="Yükleniyor..." />;
  if (!provider) return null;

  const distance = formatDistance(provider.distanceKm);
  const initials = provider.doctorName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const verified = provider.reviewCount >= 5 || provider.rating >= 4;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: spacing.md }}>
          <View style={styles.headerRow}>
            <LinearGradient
              colors={[provider.color || colors.primary, colors.secondary]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {provider.doctorName}
                </Text>
                {verified ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.verified} />
                ) : null}
              </View>
              {provider.specialty ? (
                <Text style={styles.specialty}>{provider.specialty}</Text>
              ) : null}
              <View style={styles.ratingRow}>
                <Stars value={provider.rating} />
                <Text style={styles.muted}>
                  {provider.rating.toFixed(1)} · {provider.reviewCount} değerlendirme
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.tags}>
            {provider.isOpenNow ? <Badge text="Şu an açık" tone="success" /> : null}
            {distance ? <Badge text={distance} tone="neutral" /> : null}
            {provider.autoConfirm ? <Badge text="Anında onay" tone="primary" /> : null}
            {provider.reviewCount >= 20 ? (
              <Badge text="Popüler" tone="warning" />
            ) : null}
          </View>

          <Pressable
            style={styles.clinicBox}
            onPress={() => navigation.navigate("Clinic", { businessId: provider.businessId })}
          >
            <View style={styles.clinicIcon}>
              <Ionicons name="business-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clinicName}>{provider.clinicName}</Text>
              {provider.address ? <Text style={styles.muted}>{provider.address}</Text> : null}
              {provider.city ? <Text style={styles.muted}>{provider.city}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>

          {provider.bio ? <Text style={styles.bio}>{provider.bio}</Text> : null}
        </Card>

        <Text style={styles.sectionTitle}>Hizmetler</Text>
        {provider.services.length === 0 ? (
          <Card>
            <Text style={styles.muted}>Bu doktor için tanımlı hizmet bulunmuyor.</Text>
          </Card>
        ) : (
          provider.services.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onBook={() => navigation.navigate("Booking", { provider, serviceId: s.id })}
            />
          ))
        )}

        {reviews.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
            {reviews.map((r) => (
              <Card key={r.id} style={{ gap: 6 }}>
                <View style={styles.reviewHead}>
                  <Stars value={r.rating} />
                  <Text style={styles.muted}>{formatDate(r.createdAt.slice(0, 10))}</Text>
                </View>
                {r.comment ? <Text style={styles.reviewText}>{r.comment}</Text> : null}
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>

      {provider.services.length > 0 ? (
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerLabel}>Başlangıç fiyatı</Text>
            <Text style={styles.footerPrice}>
              {provider.priceMin != null
                ? formatPrice(provider.priceMin, provider.currency)
                : "-"}
            </Text>
          </View>
          <Pressable
            style={styles.ctaWrap}
            onPress={() => navigation.navigate("Booking", { provider })}
          >
            <LinearGradient
              colors={["#1BA8B5", "#4DD4E8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Randevu Al</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ServiceRow({
  service,
  onBook,
}: {
  service: ServiceItem;
  onBook: () => void;
}) {
  return (
    <Card style={styles.serviceCard}>
      <View style={styles.serviceIcon}>
        <Ionicons name="medkit-outline" size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.muted}>
          {service.durationMin} dk · {formatPrice(service.price, service.currency)}
        </Text>
        {service.description ? (
          <Text style={styles.serviceDesc} numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onBook} style={styles.bookBtn}>
        <Text style={styles.bookBtnText}>Seç</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontWeight: "800", fontSize: 24 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, flexShrink: 1 },
  specialty: { fontSize: 14, color: colors.primary, fontWeight: "600", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  muted: { color: colors.muted, fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  clinicBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  clinicIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  clinicName: { fontSize: 15, fontWeight: "700", color: colors.text },
  bio: { color: colors.text, fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  serviceCard: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { fontSize: 15, fontWeight: "700", color: colors.text },
  serviceDesc: { color: colors.muted, fontSize: 13, marginTop: 4 },
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  bookBtnText: { color: colors.white, fontWeight: "800", fontSize: 13 },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  footerLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  footerPrice: { fontSize: 20, fontWeight: "800", color: colors.text },
  ctaWrap: { flex: 1, maxWidth: 200, borderRadius: radius.md, overflow: "hidden" },
  cta: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
