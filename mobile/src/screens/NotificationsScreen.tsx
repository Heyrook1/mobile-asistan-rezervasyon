import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as api from "../api/client";
import { ClientNotificationItem } from "../api/types";
import { EmptyState, Loading } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { formatDate } from "../utils/format";

export function NotificationsScreen() {
  const [items, setItems] = useState<ClientNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.notifications();
      setItems(res.notifications);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onPressItem = async (item: ClientNotificationItem) => {
    if (item.isRead) return;
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    try {
      await api.markRead(item.id);
    } catch {
      // ignore
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await api.markAllRead();
    } catch {
      // ignore
    }
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.head}>
        <Text style={styles.title}>Bildirimler</Text>
        {items.some((n) => !n.isRead) ? (
          <TouchableOpacity onPress={markAll}>
            <Text style={styles.markAll}>Tümünü okundu işaretle</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPressItem(item)}
            style={[styles.item, !item.isRead && styles.itemUnread]}
          >
            <View style={styles.itemTop}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.isRead ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.itemMsg}>{item.message}</Text>
            <Text style={styles.itemDate}>{formatDate(item.createdAt.slice(0, 10))}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState title="Bildirim yok" subtitle="Yeni bildirimler burada görünür." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  markAll: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  itemUnread: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemTitle: { fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  itemMsg: { color: colors.text, fontSize: 14, lineHeight: 20 },
  itemDate: { color: colors.muted, fontSize: 12 },
});
