import React, { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { Ionicons } from "@expo/vector-icons";
import * as api from "../api/client";
import { trackEvent } from "../lib/analytics";
import { APPOINTMENT_STATUS_LABEL, AppointmentRow } from "../api/types";
import { Badge, Card, EmptyState, Loading, PrimaryButton, ScreenHeader } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { formatDate, formatPrice } from "../utils/format";

type StepState = "done" | "current" | "pending" | "cancelled";

function statusSteps(status: string): { label: string; state: StepState }[] {
  if (status === "CANCELLED") {
    return [
      { label: "Talep oluşturuldu", state: "done" },
      { label: "İptal edildi", state: "cancelled" },
    ];
  }
  if (status === "NO_SHOW") {
    return [
      { label: "Talep oluşturuldu", state: "done" },
      { label: "Onaylandı", state: "done" },
      { label: "Gelinmedi", state: "cancelled" },
    ];
  }
  const confirmed = status === "CONFIRMED" || status === "COMPLETED";
  const completed = status === "COMPLETED";
  return [
    { label: "Talep oluşturuldu", state: "done" },
    {
      label: confirmed ? "Onaylandı" : "Onay bekleniyor",
      state: confirmed ? "done" : "current",
    },
    {
      label: "Tamamlandı",
      state: completed ? "done" : "pending",
    },
  ];
}

function AppointmentTimeline({ status }: { status: string }) {
  const steps = statusSteps(status);
  return (
    <View style={styles.timeline}>
      {steps.map((s, i) => {
        const color =
          s.state === "done"
            ? colors.success
            : s.state === "current"
            ? colors.warning
            : s.state === "cancelled"
            ? colors.danger
            : colors.border;
        return (
          <View key={s.label} style={styles.tlRow}>
            <View style={styles.tlGutter}>
              <View style={[styles.tlDot, { backgroundColor: color }]}>
                <Text style={styles.tlDotIcon}>
                  {s.state === "done" ? "✓" : s.state === "cancelled" ? "✕" : ""}
                </Text>
              </View>
              {i < steps.length - 1 ? (
                <View
                  style={[
                    styles.tlConnector,
                    { backgroundColor: s.state === "done" ? colors.success : colors.border },
                  ]}
                />
              ) : null}
            </View>
            <Text
              style={[
                styles.tlLabel,
                s.state === "pending" && { color: colors.muted },
                s.state === "current" && { color: colors.warning, fontWeight: "700" },
                s.state === "cancelled" && { color: colors.danger, fontWeight: "700" },
              ]}
            >
              {s.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function statusTone(status: string): "neutral" | "success" | "warning" | "danger" | "primary" {
  switch (status) {
    case "CONFIRMED":
      return "success";
    case "SCHEDULED":
      return "warning";
    case "CANCELLED":
    case "NO_SHOW":
      return "danger";
    case "COMPLETED":
      return "primary";
    default:
      return "neutral";
  }
}

export function AppointmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewFor, setReviewFor] = useState<AppointmentRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.myAppointments();
      setItems(res);
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

  const cancel = (appt: AppointmentRow) => {
    Alert.alert("Randevuyu iptal et", "Bu randevuyu iptal etmek istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "İptal et",
        style: "destructive",
        onPress: async () => {
          try {
            await api.cancelAppointment(appt.id);
            trackEvent("booking_cancelled", { appointmentId: appt.id });
            load();
          } catch (e) {
            Alert.alert("Hata", e instanceof Error ? e.message : "İptal edilemedi.");
          }
        },
      },
    ]);
  };

  if (loading) return <Loading label="Randevular yükleniyor..." />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScreenHeader title="Randevularım" subtitle="Geçmiş ve yaklaşan randevularınız" />
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cancellable = item.status === "SCHEDULED" || item.status === "CONFIRMED";
          const reschedulable = cancellable;
          const reviewable = item.status === "COMPLETED" && !item.hasReview;
          return (
            <Card style={{ gap: spacing.sm }}>
              <View style={styles.cardHead}>
                <Text style={styles.doctor}>
                  {item.TeamMember?.fullName ?? "Doktor"}
                </Text>
                <Badge
                  text={APPOINTMENT_STATUS_LABEL[item.status] ?? item.status}
                  tone={statusTone(item.status)}
                />
              </View>
              {item.Service?.name ? (
                <Text style={styles.service}>{item.Service.name}</Text>
              ) : null}
              {item.Business?.name ? (
                <Text style={styles.muted}>{item.Business.name}</Text>
              ) : null}
              <View style={styles.dateRow}>
                <View style={styles.dateChip}>
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.date}>
                    {formatDate(item.date)} · {item.startTime}
                  </Text>
                </View>
                {item.price != null ? (
                  <Text style={styles.price}>{formatPrice(item.price)}</Text>
                ) : null}
              </View>
              {item.notes ? <Text style={styles.muted}>Not: {item.notes}</Text> : null}

              <AppointmentTimeline status={item.status} />

              {(cancellable || reschedulable || reviewable) && (
                <View style={styles.actions}>
                  {reviewable ? (
                    <View style={{ flex: 1 }}>
                      <PrimaryButton
                        title="Değerlendir"
                        variant="ghost"
                        onPress={() => setReviewFor(item)}
                      />
                    </View>
                  ) : null}
                  {reschedulable ? (
                    <View style={{ flex: 1 }}>
                      <PrimaryButton
                        title="Ertele"
                        variant="ghost"
                        onPress={() => navigation.navigate("Reschedule", { appointment: item })}
                      />
                    </View>
                  ) : null}
                  {cancellable ? (
                    <View style={{ flex: 1 }}>
                      <PrimaryButton
                        title="İptal et"
                        variant="danger"
                        onPress={() => cancel(item)}
                      />
                    </View>
                  ) : null}
                </View>
              )}
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Henüz randevunuz yok"
            subtitle="Ana sayfadan bir doktor seçerek randevu alabilirsiniz."
          />
        }
      />

      <ReviewModal
        appointment={reviewFor}
        onClose={() => setReviewFor(null)}
        onDone={() => {
          setReviewFor(null);
          load();
        }}
      />
    </SafeAreaView>
  );
}

function ReviewModal({
  appointment,
  onClose,
  onDone,
}: {
  appointment: AppointmentRow | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!appointment) return;
    setSaving(true);
    try {
      await api.submitReview({
        appointmentId: appointment.id,
        rating,
        comment: comment.trim() || null,
        serviceQuality: null,
        waitingTime: null,
        communication: null,
      });
      setRating(5);
      setComment("");
      onDone();
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Değerlendirme kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={!!appointment}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Değerlendirme</Text>
          <Text style={styles.muted}>
            {appointment?.TeamMember?.fullName} · {appointment?.Service?.name}
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Text style={[styles.bigStar, { color: i <= rating ? colors.star : colors.border }]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Yorumunuz (isteğe bağlı)"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <PrimaryButton title="Gönder" onPress={submit} loading={saving} />
          <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
            <Text style={styles.muted}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl, flexGrow: 1 },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  doctor: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  service: { fontSize: 14, color: colors.primary, fontWeight: "600" },
  muted: { color: colors.muted, fontSize: 13 },
  dateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateChip: { flexDirection: "row", alignItems: "center", gap: 6 },
  date: { fontSize: 14, color: colors.text, fontWeight: "600" },
  price: { fontSize: 14, color: colors.text, fontWeight: "800" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  timeline: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tlRow: { flexDirection: "row", gap: spacing.sm },
  tlGutter: { alignItems: "center", width: 18 },
  tlDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tlDotIcon: { color: colors.white, fontSize: 10, fontWeight: "800" },
  tlConnector: { width: 2, flex: 1, minHeight: 14, marginVertical: 1 },
  tlLabel: { fontSize: 13, color: colors.text, paddingBottom: spacing.sm, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
  starRow: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  bigStar: { fontSize: 40 },
  modalInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    textAlignVertical: "top",
  },
  modalCancel: { alignItems: "center", paddingVertical: spacing.sm },
});
