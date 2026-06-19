import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../navigation/types";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { ServiceItem, SlotItem } from "../api/types";
import { Card, PrimaryButton } from "../components/ui";
import { trackEvent } from "../lib/analytics";
import { colors, radius, shadow, spacing } from "../theme";
import { addDaysIso, formatDate, formatPrice, todayIso } from "../utils/format";

type Props = NativeStackScreenProps<RootStackParamList, "Booking">;

const STEPS = ["Hizmet", "Tarih", "Saat", "Onay"] as const;
const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function Stepper({ current, done }: { current: number; done: boolean[] }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const isDone = done[i];
        const isCurrent = i === current;
        const active = isDone || isCurrent;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={styles.stepLine}>
              {i > 0 ? (
                <View style={[styles.connector, done[i - 1] && styles.connectorOn]} />
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  isDone && styles.stepDotDone,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Text style={[styles.stepDotText, active && styles.stepDotTextActive]}>
                    {i + 1}
                  </Text>
                )}
              </View>
              {i < STEPS.length - 1 ? (
                <View style={[styles.connector, isDone && styles.connectorOn]} />
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>
            <Text
              style={[styles.stepLabel, (isCurrent || isDone) && styles.stepLabelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryRowLabel}>{label}</Text>
        <Text style={styles.summaryRowValue}>{value}</Text>
      </View>
    </View>
  );
}

export function BookingScreen({ route, navigation }: Props) {
  const { provider, serviceId: initialServiceId } = route.params;
  const { clientUser } = useAuth();

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(
    initialServiceId ?? provider.services[0]?.id ?? ""
  );
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [note, setNote] = useState("");
  const [booking, setBooking] = useState(false);

  const days = useMemo(() => {
    const base = todayIso();
    return Array.from({ length: 14 }, (_, i) => addDaysIso(base, i));
  }, []);

  const selectedService = provider.services.find((s) => s.id === serviceId);

  const stepDone = [
    !!serviceId,
    !!date,
    !!slot,
    false,
  ];

  useEffect(() => {
    trackEvent("booking_start", {
      staffId: provider.staffId,
      clinicName: provider.clinicName,
      serviceId: initialServiceId ?? null,
    });
  }, [provider.staffId, provider.clinicName, initialServiceId]);

  useEffect(() => {
    if (!serviceId || !date || step < 2) return;
    let active = true;
    setLoadingSlots(true);
    setSlot(null);
    api
      .slots(provider.staffId, serviceId, date)
      .then((res) => active && setSlots(res))
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [serviceId, date, provider.staffId, step]);

  const canNext =
    (step === 0 && !!serviceId) ||
    (step === 1 && !!date) ||
    (step === 2 && !!slot) ||
    step === 3;

  const goNext = () => {
    if (step < 3) setStep((s) => s + 1);
    else void confirm();
  };

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const confirm = async () => {
    if (!serviceId || !slot) return;
    setBooking(true);
    try {
      const res = await api.book({
        businessId: provider.businessId,
        staffId: provider.staffId,
        serviceId,
        date,
        startTime: slot,
        note: note.trim() || null,
        contactPhone: clientUser?.phone ?? null,
      });
      const confirmed = res.status === "CONFIRMED";
      trackEvent("booking_confirmed", {
        staffId: provider.staffId,
        status: res.status,
        date: res.date,
      });
      Alert.alert(
        confirmed ? "Randevu onaylandı" : "Randevu alındı",
        confirmed
          ? `${formatDate(res.date)} · ${res.startTime} için randevunuz onaylandı.`
          : `${formatDate(res.date)} · ${res.startTime} için talebiniz alındı. Onay bekleniyor.`,
        [
          {
            text: "Ana Sayfa",
            onPress: () => navigation.navigate("Tabs", { screen: "Home" }),
          },
          {
            text: "Randevularım",
            onPress: () => navigation.navigate("Tabs", { screen: "Appointments" }),
          },
        ]
      );
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Randevu oluşturulamadı.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading} numberOfLines={1}>
            {provider.doctorName}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {provider.clinicName}
          </Text>
        </View>
      </View>

      <Stepper current={step} done={stepDone} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet seçin</Text>
            <View style={{ gap: spacing.sm }}>
              {provider.services.map((s) => (
                <ServiceOption
                  key={s.id}
                  service={s}
                  selected={serviceId === s.id}
                  onPress={() => setServiceId(s.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tarih seçin</Text>
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
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Saat seçin · {formatDate(date)}
            </Text>
            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>Uygun saatler yükleniyor…</Text>
              </View>
            ) : slots.length === 0 ? (
              <Card>
                <View style={styles.emptySlots}>
                  <Ionicons name="time-outline" size={28} color={colors.muted} />
                  <Text style={styles.emptySlotsText}>
                    Bu gün için uygun saat bulunmuyor.
                  </Text>
                  <PrimaryButton
                    title="Başka tarih seç"
                    variant="ghost"
                    onPress={() => setStep(1)}
                  />
                </View>
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
          </View>
        ) : null}

        {step === 3 && selectedService ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Randevu özeti</Text>
            <Card style={{ gap: spacing.md }}>
              <SummaryRow icon="person-outline" label="Doktor" value={provider.doctorName} />
              <SummaryRow icon="business-outline" label="Klinik" value={provider.clinicName} />
              <SummaryRow icon="medkit-outline" label="Hizmet" value={selectedService.name} />
              <SummaryRow
                icon="calendar-outline"
                label="Tarih & saat"
                value={`${formatDate(date)} · ${slot?.slice(0, 5) ?? ""}`}
              />
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Toplam</Text>
                <Text style={styles.priceValue}>
                  {formatPrice(selectedService.price, selectedService.currency)}
                </Text>
              </View>
            </Card>

            <Text style={styles.noteLabel}>Not (isteğe bağlı)</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Doktorunuza iletmek istediğiniz not…"
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              multiline
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Geri" variant="ghost" onPress={goBack} />
          </View>
        ) : null}
        <View style={{ flex: step > 0 ? 2 : 1 }}>
          {step === 3 ? (
            <PrimaryButton
              title="Randevuyu Onayla"
              onPress={goNext}
              loading={booking}
              disabled={!slot}
            />
          ) : (
            <Pressable
              onPress={goNext}
              disabled={!canNext}
              style={({ pressed }) => [
                styles.nextWrap,
                !canNext && { opacity: 0.5 },
                pressed && canNext && { opacity: 0.9 },
              ]}
            >
              <LinearGradient
                colors={["#1BA8B5", "#4DD4E8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextText}>Devam</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.white} />
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ServiceOption({
  service,
  selected,
  onPress,
}: {
  service: ServiceItem;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.serviceRow, selected && styles.serviceRowActive]}
    >
      <View style={[styles.serviceIcon, selected && styles.serviceIconActive]}>
        <Ionicons
          name="medkit-outline"
          size={20}
          color={selected ? colors.white : colors.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.muted}>
          {service.durationMin} dk · {formatPrice(service.price, service.currency)}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>
        {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: { fontSize: 18, fontWeight: "800", color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  stepper: {
    flexDirection: "row",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  stepItem: { flex: 1, alignItems: "center" },
  stepLine: { flexDirection: "row", alignItems: "center", width: "100%" },
  connector: { flex: 1, height: 2, backgroundColor: colors.border },
  connectorOn: { backgroundColor: colors.success },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  stepDotDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepDotText: { fontSize: 12, fontWeight: "800", color: colors.muted },
  stepDotTextActive: { color: colors.primary },
  stepLabel: { fontSize: 10, color: colors.muted, marginTop: 6, fontWeight: "600" },
  stepLabelActive: { color: colors.primary, fontWeight: "800" },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.text },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadow.card,
  },
  serviceRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceIconActive: { backgroundColor: colors.primary },
  serviceName: { fontSize: 15, fontWeight: "700", color: colors.text },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  daysRow: { flexDirection: "row", gap: spacing.sm, paddingRight: spacing.lg },
  dayChip: {
    width: 58,
    height: 68,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    ...shadow.card,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayName: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  dayNum: { fontSize: 18, color: colors.text, fontWeight: "800" },
  dayTextActive: { color: colors.white },
  loadingBox: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptySlots: { alignItems: "center", gap: spacing.sm },
  emptySlotsText: { color: colors.muted, textAlign: "center", fontSize: 14 },
  slotsWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 72,
    alignItems: "center",
  },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
  slotTextActive: { color: colors.white },
  summaryRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  summaryRowLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  summaryRowValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  priceLabel: { fontSize: 14, color: colors.muted, fontWeight: "600" },
  priceValue: { fontSize: 22, fontWeight: "800", color: colors.text },
  noteLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  noteInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.card,
  },
  nextWrap: { borderRadius: radius.md, overflow: "hidden", ...shadow.soft },
  nextBtn: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextText: { color: colors.white, fontSize: 16, fontWeight: "800" },
});
