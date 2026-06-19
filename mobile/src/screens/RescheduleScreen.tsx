import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import * as api from "../api/client";
import { SlotItem } from "../api/types";
import { Card, PrimaryButton } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { colors, radius, spacing } from "../theme";
import { addDaysIso, formatDate, todayIso } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Reschedule">;

const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export function RescheduleScreen({ route, navigation }: Props) {
  const { appointment } = route.params;
  const [step, setStep] = useState(0);
  const [date, setDate] = useState(appointment.date);
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);

  const serviceId = appointment.serviceId;
  const staffId = appointment.staffId;

  const days = useMemo(() => {
    const base = todayIso();
    return Array.from({ length: 14 }, (_, i) => addDaysIso(base, i));
  }, []);

  useEffect(() => {
    if (!serviceId || !staffId || step < 1) return;
    let active = true;
    setLoadingSlots(true);
    setSlot(null);
    api
      .slots(staffId, serviceId, date, appointment.id)
      .then((res) => active && setSlots(res))
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [serviceId, staffId, date, step, appointment.id]);

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const confirm = async () => {
    if (!slot) return;
    setSaving(true);
    try {
      const res = await api.rescheduleAppointment({
        appointmentId: appointment.id,
        date,
        startTime: slot,
      });
      trackEvent("booking_rescheduled", {
        appointmentId: appointment.id,
        date: res.date,
      });
      Alert.alert(
        "Randevu ertelendi",
        `${formatDate(res.date)} · ${res.startTime.slice(0, 5)} olarak güncellendi.`,
        [
          {
            text: "Randevularım",
            onPress: () => navigation.navigate("Tabs", { screen: "Appointments" }),
          },
        ]
      );
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Randevu ertelenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const doctor = appointment.TeamMember?.fullName ?? "Doktor";
  const service = appointment.Service?.name ?? "Hizmet";
  const clinic = appointment.Business?.name;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Randevuyu Ertele</Text>
          <Text style={styles.muted} numberOfLines={1}>
            {doctor} · {service}
          </Text>
        </View>
      </View>

      <Card style={styles.summary}>
        <Text style={styles.summaryLabel}>Mevcut randevu</Text>
        <Text style={styles.summaryValue}>
          {formatDate(appointment.date)} · {appointment.startTime.slice(0, 5)}
        </Text>
        {clinic ? <Text style={styles.muted}>{clinic}</Text> : null}
      </Card>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yeni tarih seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.daysRow}>
                {days.map((d) => {
                  const day = new Date(`${d}T12:00:00`);
                  const active = d === date;
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDate(d)}
                      style={[styles.dayChip, active && styles.dayChipActive]}
                    >
                      <Text style={[styles.dayName, active && styles.dayTextActive]}>
                        {WEEKDAYS[day.getDay()]}
                      </Text>
                      <Text style={[styles.dayNum, active && styles.dayTextActive]}>
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <PrimaryButton title="Saat seç" onPress={() => setStep(1)} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yeni saat · {formatDate(date)}</Text>
            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>Uygun saatler yükleniyor…</Text>
              </View>
            ) : slots.length === 0 ? (
              <Card>
                <Text style={styles.muted}>Bu gün için uygun saat bulunmuyor.</Text>
                <PrimaryButton title="Başka tarih seç" variant="ghost" onPress={() => setStep(0)} />
              </Card>
            ) : (
              <View style={styles.slotsWrap}>
                {slots.map((s) => {
                  const active = slot === s.startTime;
                  return (
                    <Pressable
                      key={s.startTime}
                      onPress={() => setSlot(s.startTime)}
                      style={[styles.slot, active && styles.slotActive]}
                    >
                      <Text style={[styles.slotText, active && styles.slotTextActive]}>
                        {s.startTime.slice(0, 5)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {slot ? (
              <PrimaryButton title="Ertelemeyi Onayla" onPress={confirm} loading={saving} />
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { fontSize: 18, fontWeight: "800", color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  summary: { marginHorizontal: spacing.lg, gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: colors.muted, textTransform: "uppercase" },
  summaryValue: { fontSize: 16, fontWeight: "800", color: colors.text },
  scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  daysRow: { flexDirection: "row", gap: spacing.sm },
  dayChip: {
    width: 56,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayName: { fontSize: 11, color: colors.muted, fontWeight: "700" },
  dayNum: { fontSize: 18, fontWeight: "800", color: colors.text, marginTop: 2 },
  dayTextActive: { color: colors.white },
  loadingBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 14, fontWeight: "700", color: colors.text },
  slotTextActive: { color: colors.white },
});
