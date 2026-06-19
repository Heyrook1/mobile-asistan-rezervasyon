import React from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../navigation/types";
import { useFavorites } from "../state/FavoritesContext";
import { EmptyState, Loading } from "../components/ui";
import { colors, radius, shadow, spacing } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  const { items, loading, toggleFavorite } = useFavorites();

  if (loading && items.length === 0) return <Loading label="Favoriler yükleniyor..." />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.businessId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="heart-outline"
            title="Henüz favori yok"
            subtitle="Beğendiğiniz klinikleri kalp ikonuna dokunarak kaydedin."
          />
        }
        renderItem={({ item }) => {
          const biz = item.Business;
          const initial = (biz?.name ?? "?").charAt(0).toUpperCase();
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("Clinic", {
                  businessId: item.businessId,
                  name: biz?.name,
                })
              }
            >
              {biz?.logoUrl ? (
                <Image source={{ uri: biz.logoUrl }} style={styles.logo} />
              ) : (
                <LinearGradient
                  colors={[biz?.primaryColor || colors.primary, colors.secondary]}
                  style={styles.logo}
                >
                  <Text style={styles.logoText}>{initial}</Text>
                </LinearGradient>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>
                  {biz?.name ?? "Klinik"}
                </Text>
                {biz?.city ? <Text style={styles.meta}>{biz.city}</Text> : null}
              </View>
              <Pressable
                onPress={() => void toggleFavorite(item.businessId)}
                hitSlop={8}
                style={styles.heart}
              >
                <Ionicons name="heart" size={22} color={colors.danger} />
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.white, fontWeight: "800", fontSize: 20 },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  heart: { padding: 4 },
});
