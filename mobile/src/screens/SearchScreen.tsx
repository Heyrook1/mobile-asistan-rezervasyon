import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SearchScreenProps } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { Provider, SearchFilters } from "../api/types";
import { ProviderCard } from "../components/ProviderCard";
import { EmptyState, PrimaryButton, ProviderCardSkeleton, ScreenHeader } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { colors, radius, spacing } from "../theme";

const SORTS = [
  { key: "nearest", label: "En yakın" },
  { key: "rating", label: "En yüksek puan" },
  { key: "earliest", label: "En erken müsait" },
  { key: "reviews", label: "En çok yorum" },
];

const RATINGS = [
  { v: undefined as number | undefined, label: "Tümü" },
  { v: 3, label: "3+" },
  { v: 4, label: "4+" },
  { v: 4.5, label: "4.5+" },
];

const PRICES = [
  { v: undefined as number | undefined, label: "Tümü" },
  { v: 500, label: "≤ 500" },
  { v: 1000, label: "≤ 1000" },
  { v: 2000, label: "≤ 2000" },
];

const DISTANCES = [
  { v: undefined as number | undefined, label: "Tümü" },
  { v: 2, label: "2 km" },
  { v: 5, label: "5 km" },
  { v: 10, label: "10 km" },
  { v: 25, label: "25 km" },
];

export function SearchScreen({ navigation, route }: SearchScreenProps) {
  const { clientUser } = useAuth();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("nearest");
  const [results, setResults] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [minRating, setMinRating] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>();
  const [availableToday, setAvailableToday] = useState(false);

  const activeFilters =
    (minRating != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (maxDistanceKm != null ? 1 : 0) +
    (availableToday ? 1 : 0);

  const runSearch = useCallback(
    async (overrides?: { query?: string; sort?: string; filters?: SearchFilters }) => {
      setLoading(true);
      setSearched(true);
      const filters: SearchFilters = overrides?.filters ?? {
        minRating,
        maxPrice,
        maxDistanceKm,
        availableToday: availableToday || undefined,
      };
      try {
        const providers = await api.search({
          lat: clientUser?.locationLat ?? null,
          lng: clientUser?.locationLng ?? null,
          query: (overrides?.query ?? query).trim() || null,
          filters,
          sort: overrides?.sort ?? sort,
        });
        setResults(providers);
        trackEvent("search", {
          query: (overrides?.query ?? query).trim() || null,
          resultCount: providers.length,
          sort: overrides?.sort ?? sort,
        });
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [query, sort, minRating, maxPrice, maxDistanceKm, availableToday, clientUser]
  );

  // Run a search when arriving from a Home category tap.
  useEffect(() => {
    const incoming = route.params?.query ?? route.params?.specialty;
    if (incoming) {
      setQuery(incoming);
      runSearch({ query: incoming });
      navigation.setParams({ query: undefined, specialty: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.query, route.params?.specialty]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <ScreenHeader title="Ara" subtitle="Doktor, klinik veya hizmet bulun" />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color={colors.muted} />
            <TextInput
              style={styles.input}
              placeholder="Doktor, klinik veya hizmet"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => runSearch()}
              autoCapitalize="none"
            />
            {query.length > 0 ? (
              <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options-outline" size={22} color={colors.white} />
            {activeFilters > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <FlatList
          horizontal
          data={SORTS}
          keyExtractor={(s) => s.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setSort(item.key);
                runSearch({ sort: item.key });
              }}
              style={[styles.pill, sort === item.key && styles.pillActive]}
            >
              <Text style={[styles.pillText, sort === item.key && styles.pillTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <ProviderCardSkeleton />
          <ProviderCardSkeleton />
          <ProviderCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.staffId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() =>
                navigation.navigate("ProviderDetail", {
                  staffId: item.staffId,
                  preview: item,
                })
              }
            />
          )}
          ListEmptyComponent={
            searched ? (
              <EmptyState
                icon="search-outline"
                title="Sonuç bulunamadı"
                subtitle="Filtreleri değiştirip tekrar deneyin."
              />
            ) : (
              <EmptyState
                icon="compass-outline"
                title="Aramaya başlayın"
                subtitle="Doktor, klinik veya hizmet adı yazın ya da filtre seçin."
              />
            )
          }
        />
      )}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        minRating={minRating}
        maxPrice={maxPrice}
        maxDistanceKm={maxDistanceKm}
        availableToday={availableToday}
        setMinRating={setMinRating}
        setMaxPrice={setMaxPrice}
        setMaxDistanceKm={setMaxDistanceKm}
        setAvailableToday={setAvailableToday}
        onApply={() => {
          setFilterOpen(false);
          runSearch();
        }}
        onReset={() => {
          setMinRating(undefined);
          setMaxPrice(undefined);
          setMaxDistanceKm(undefined);
          setAvailableToday(false);
        }}
      />
    </SafeAreaView>
  );
}

function FilterSheet(props: {
  visible: boolean;
  onClose: () => void;
  minRating?: number;
  maxPrice?: number;
  maxDistanceKm?: number;
  availableToday: boolean;
  setMinRating: (v?: number) => void;
  setMaxPrice: (v?: number) => void;
  setMaxDistanceKm: (v?: number) => void;
  setAvailableToday: (v: boolean) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Filtrele</Text>

          <ChipGroup
            label="Minimum puan"
            options={RATINGS}
            value={props.minRating}
            onChange={props.setMinRating}
          />
          <ChipGroup
            label="Maksimum fiyat"
            options={PRICES}
            value={props.maxPrice}
            onChange={props.setMaxPrice}
          />
          <ChipGroup
            label="Maksimum mesafe"
            options={DISTANCES}
            value={props.maxDistanceKm}
            onChange={props.setMaxDistanceKm}
          />

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => props.setAvailableToday(!props.availableToday)}
            activeOpacity={0.8}
          >
            <Text style={styles.toggleLabel}>Sadece bugün müsait</Text>
            <View style={[styles.switch, props.availableToday && styles.switchOn]}>
              <View style={[styles.knob, props.availableToday && styles.knobOn]} />
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Sıfırla" variant="ghost" onPress={props.onReset} />
            </View>
            <View style={{ flex: 2 }}>
              <PrimaryButton title="Uygula" onPress={props.onApply} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ChipGroup<T>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {options.map((o) => {
          const active = o.v === value;
          return (
            <TouchableOpacity
              key={o.label}
              onPress={() => onChange(o.v)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg },
  searchRow: { flexDirection: "row", gap: spacing.sm },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  pillTextActive: { color: colors.white },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: spacing.lg },
  groupLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    padding: 3,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: colors.primary },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  knobOn: { alignSelf: "flex-end" },
});
