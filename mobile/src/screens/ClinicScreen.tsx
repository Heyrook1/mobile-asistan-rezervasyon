import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { ClinicResponse } from "../api/types";
import { ProviderCard } from "../components/ProviderCard";
import { Badge, Card, EmptyState, Loading, Stars } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { formatDate, formatDistance } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Clinic">;

export function ClinicScreen({ route, navigation }: Props) {
  const { businessId } = route.params;
  const { clientUser } = useAuth();
  const [data, setData] = useState<ClinicResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .clinic(businessId, clientUser?.locationLat ?? null, clientUser?.locationLng ?? null)
      .then((res) => active && setData(res))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [businessId, clientUser?.locationLat, clientUser?.locationLng]);

  if (loading) return <Loading label="Klinik yükleniyor..." />;
  if (!data?.business) {
    return <EmptyState title="Klinik bulunamadı" subtitle="Bu klinik şu an görüntülenemiyor." />;
  }

  const b = data.business;
  const distance = formatDistance(b.distanceKm);
  const initials = b.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <View style={styles.headerRow}>
            <View style={[styles.logo, { backgroundColor: b.primaryColor || colors.primary }]}>
              <Text style={styles.logoText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{b.name}</Text>
              <View style={styles.ratingRow}>
                <Stars value={data.rating} />
                <Text style={styles.muted}>
                  {data.rating.toFixed(1)} · {data.reviewCount} değerlendirme
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.tags}>
            {distance ? <Badge text={distance} tone="neutral" /> : null}
            {b.city ? <Badge text={b.city} tone="primary" /> : null}
          </View>
          {b.address ? <Text style={styles.address}>{b.address}</Text> : null}
          {b.description ? <Text style={styles.desc}>{b.description}</Text> : null}
        </Card>

        <Text style={styles.sectionTitle}>Doktorlar ({data.doctors.length})</Text>
        {data.doctors.length === 0 ? (
          <Card>
            <Text style={styles.muted}>Bu klinikte şu an randevu verilebilen doktor yok.</Text>
          </Card>
        ) : (
          data.doctors.map((p) => (
            <ProviderCard
              key={p.staffId}
              provider={p}
              onPress={() =>
                navigation.navigate("ProviderDetail", { staffId: p.staffId, preview: p })
              }
            />
          ))
        )}

        {data.reviews.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Değerlendirmeler</Text>
            {data.reviews.map((r) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "800", fontSize: 22 },
  name: { fontSize: 20, fontWeight: "800", color: colors.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  muted: { color: colors.muted, fontSize: 13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  address: { marginTop: spacing.md, color: colors.text, fontSize: 14 },
  desc: { marginTop: spacing.sm, color: colors.muted, fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  reviewHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewText: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
