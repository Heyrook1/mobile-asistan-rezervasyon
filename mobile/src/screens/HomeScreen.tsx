import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HomeScreenProps } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import { useFavorites } from "../state/FavoritesContext";
import * as api from "../api/client";
import { AppointmentRow, DiscoveryResponse, Provider } from "../api/types";
import { LocationPromptCard } from "../components/LocationPromptCard";
import {
  AvailableTodayRow,
  CategoryRow,
  ClinicListCard,
  GreetingHeader,
  HeroBanner,
  PromoBanner,
  SearchBar,
  SectionHeader,
  TrustRow,
  UpcomingWidget,
  featuredClinics,
  trustBadges,
} from "../components/home/HomeSections";
import { EmptyState, ProviderCardSkeleton, Skeleton } from "../components/ui";
import { colors, spacing } from "../theme";
import { todayIso } from "../utils/format";

function nextUpcoming(appointments: AppointmentRow[]): AppointmentRow | null {
  const today = todayIso();
  return (
    appointments
      .filter(
        (a) =>
          a.status !== "CANCELLED" &&
          a.status !== "COMPLETED" &&
          a.status !== "NO_SHOW" &&
          a.date >= today
      )
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      )[0] ?? null
  );
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { clientUser } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [upcoming, setUpcoming] = useState<AppointmentRow | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = (clientUser?.fullName ?? "").split(" ")[0] || "Hoş geldiniz";

  const load = useCallback(async () => {
    setError(null);
    try {
      const [disc, appts, notif] = await Promise.allSettled([
        api.discovery(clientUser?.locationLat ?? null, clientUser?.locationLng ?? null),
        api.myAppointments(),
        api.notifications(),
      ]);
      if (disc.status === "fulfilled") setData(disc.value);
      else setError("Veriler yüklenemedi.");
      if (appts.status === "fulfilled") setUpcoming(nextUpcoming(appts.value));
      if (notif.status === "fulfilled") setUnread(notif.value.unread);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientUser?.locationLat, clientUser?.locationLng]);

  useEffect(() => {
    load();
  }, [load]);

  const openProvider = (p: Provider) =>
    navigation.navigate("ProviderDetail", { staffId: p.staffId, preview: p });
  const openClinic = (p: Provider) =>
    navigation.navigate("Clinic", { businessId: p.businessId, name: p.clinicName });
  const openSearch = () => navigation.navigate("Search");
  const openCategory = (query: string) => navigation.navigate("Search", { query });

  const clinics = featuredClinics([...(data?.nearby ?? []), ...(data?.topRated ?? [])]).slice(0, 6);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <GreetingHeader
          name={firstName}
          unread={unread}
          onBell={() => navigation.navigate("Notifications")}
        />

        <SearchBar onPress={openSearch} onFilter={openSearch} />

        <LocationPromptCard />

        <HeroBanner name={firstName} onPress={openSearch} />

        {upcoming ? (
          <UpcomingWidget
            appointment={upcoming}
            onView={() => navigation.navigate("Appointments")}
            onReschedule={() => navigation.navigate("Reschedule", { appointment: upcoming })}
            onCancel={() => navigation.navigate("Appointments")}
          />
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Kategoriler" onAll={openSearch} />
          <CategoryRow onSelect={openCategory} />
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <Skeleton width="55%" height={20} />
            <ProviderCardSkeleton />
            <ProviderCardSkeleton />
          </View>
        ) : error ? (
          <EmptyState icon="cloud-offline-outline" title="Bir sorun oluştu" subtitle={error} />
        ) : (
          <>
            {(data?.availableToday.length ?? 0) > 0 ? (
              <View style={styles.block}>
                <SectionHeader title="Bugün Müsait" onAll={openSearch} />
                <AvailableTodayRow
                  providers={data?.availableToday ?? []}
                  onOpen={openProvider}
                />
              </View>
            ) : null}

            <View style={styles.block}>
              <SectionHeader title="Önerilen Klinikler" onAll={openSearch} />
              <View style={styles.clinicList}>
                {clinics.map((p) => (
                  <ClinicListCard
                    key={p.businessId}
                    provider={p}
                    onOpen={() => openClinic(p)}
                    onBook={() => openProvider(p)}
                    isFavorite={isFavorite(p.businessId)}
                    onToggleFavorite={() => void toggleFavorite(p.businessId)}
                  />
                ))}
              </View>
            </View>

            <PromoBanner onPress={openSearch} />

            <TrustRow badges={trustBadges(data)} />

            {clinics.length === 0 && (data?.availableToday.length ?? 0) === 0 ? (
              <EmptyState
                icon="medkit-outline"
                title="Henüz uzman yok"
                subtitle="Yakınınızda kayıtlı bir sağlık uzmanı bulunamadı."
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { gap: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  block: { gap: spacing.md },
  clinicList: { gap: spacing.md },
  loadingBox: { gap: spacing.md, paddingHorizontal: spacing.lg },
});
