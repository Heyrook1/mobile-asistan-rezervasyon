import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  getLegalContent,
  KVKK_CONSENT_EN,
  KVKK_CONSENT_TR,
  LEGAL_TITLES,
  LegalDocId,
  LegalLocale,
} from "../legal";
import { colors, radius, spacing } from "../theme";

type Props = {
  visible: boolean;
  doc: LegalDocId | "kvkk" | null;
  onClose: () => void;
  initialLocale?: LegalLocale;
};

export function LegalDocumentModal({
  visible,
  doc,
  onClose,
  initialLocale = "tr",
}: Props) {
  const [locale, setLocale] = useState<LegalLocale>(initialLocale);

  if (!doc) return null;

  const title =
    doc === "kvkk"
      ? locale === "tr"
        ? "Sağlık Verisi Açık Rıza"
        : "Health Data Consent"
      : LEGAL_TITLES[doc][locale];

  const body =
    doc === "kvkk"
      ? locale === "tr"
        ? KVKK_CONSENT_TR
        : KVKK_CONSENT_EN
      : getLegalContent(doc, locale);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.localeRow}>
          <Pressable
            style={[styles.localeChip, locale === "tr" && styles.localeChipActive]}
            onPress={() => setLocale("tr")}
          >
            <Text style={[styles.localeText, locale === "tr" && styles.localeTextActive]}>Türkçe</Text>
          </Pressable>
          <Pressable
            style={[styles.localeChip, locale === "en" && styles.localeChipActive]}
            onPress={() => setLocale("en")}
          >
            <Text style={[styles.localeText, locale === "en" && styles.localeTextActive]}>English</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator>
          <Text style={styles.body}>{body}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "800", color: colors.text },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceAlt,
  },
  localeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  localeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  localeChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  localeText: { fontSize: 13, fontWeight: "600", color: colors.muted },
  localeTextActive: { color: colors.primary, fontWeight: "800" },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  body: { fontSize: 14, lineHeight: 22, color: colors.text },
});
