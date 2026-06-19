import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "../state/AuthContext";
import * as api from "../api/client";
import { RootStackParamList, TabsParamList } from "../navigation/types";
import { Card, Field, PrimaryButton } from "../components/ui";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { LegalDocId } from "../legal";
import { requestUserLocation } from "../lib/location";
import { colors, radius, shadow, spacing } from "../theme";

export function ProfileScreen() {
  const navigation = useNavigation<
    CompositeNavigationProp<
      BottomTabNavigationProp<TabsParamList, "Profile">,
      NativeStackNavigationProp<RootStackParamList>
    >
  >();
  const { clientUser, setClientUser, signOut } = useAuth();
  const [fullName, setFullName] = useState(clientUser?.fullName ?? "");
  const [phone, setPhone] = useState(clientUser?.phone ?? "");
  const [city, setCity] = useState(clientUser?.city ?? "");
  const [address, setAddress] = useState(clientUser?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);
  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
      });
      setClientUser(updated);
      Alert.alert("Kaydedildi", "Profiliniz güncellendi.");
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Çıkış yapılamadı.");
    }
  };

  const confirmSignOut = () => {
    if (Platform.OS === "web") {
      const ok =
        typeof globalThis.confirm === "function" &&
        globalThis.confirm("Hesabınızdan çıkmak istiyor musunuz?");
      if (ok) void performSignOut();
      return;
    }
    Alert.alert("Çıkış yap", "Hesabınızdan çıkmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => void performSignOut() },
    ]);
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportMyData();
      const json = JSON.stringify(data, null, 2);
      const filename = `asistan-verilerim-${data.exportedAt.slice(0, 10)}.json`;

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert("İndirildi", "Verileriniz JSON dosyası olarak indirildi.");
      } else {
        await Share.share({ message: json, title: filename });
      }
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Veriler indirilemedi.");
    } finally {
      setExporting(false);
    }
  };

  const performDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      await signOut();
      Alert.alert("Hesap silindi", "Hesabınız ve kişisel verileriniz silinme sürecine alındı.");
    } catch (e) {
      Alert.alert("Hata", e instanceof Error ? e.message : "Hesap silinemedi.");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleteAccount = () => {
    const message =
      "Hesabınız kalıcı olarak silinecek. Gelecekteki randevularınız iptal edilir. Bu işlem geri alınamaz.";
    if (Platform.OS === "web") {
      const ok =
        typeof globalThis.confirm === "function" && globalThis.confirm(message);
      if (ok) void performDeleteAccount();
      return;
    }
    Alert.alert("Hesabı sil", message, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Hesabımı sil", style: "destructive", onPress: () => void performDeleteAccount() },
    ]);
  };
  const initials = (clientUser?.fullName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient
          colors={["#0D5C6B", "#1BA8B5", "#4DD4E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.name}>{clientUser?.fullName}</Text>
          {clientUser?.email ? <Text style={styles.email}>{clientUser.email}</Text> : null}
        </LinearGradient>

        <View style={styles.quickRow}>
          <QuickItem
            icon="calendar-outline"
            label="Randevular"
            onPress={() => navigation.navigate("Appointments")}
          />
          <QuickItem
            icon="heart-outline"
            label="Favoriler"
            onPress={() => navigation.navigate("Favorites")}
          />
          <QuickItem
            icon="notifications-outline"
            label="Bildirimler"
            onPress={() => navigation.navigate("Notifications")}
          />
        </View>

        <Card>
          <View style={styles.sectionHead}>
            <Ionicons name="person-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>
          </View>
          <Field label="Ad Soyad" value={fullName} onChangeText={setFullName} />
          <Field
            label="Telefon"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Field label="Şehir" value={city} onChangeText={setCity} />
          <Field label="Adres" value={address} onChangeText={setAddress} />
          <PrimaryButton
            title={locating ? "Konum alınıyor..." : "Konumumu Güncelle"}
            variant="ghost"
            onPress={async () => {
              setLocating(true);
              try {
                const coords = await requestUserLocation();
                if (!coords) {
                  Alert.alert("Konum", "Konum izni verilmedi veya alınamadı.");
                  return;
                }
                const updated = await api.updateProfile({
                  locationLat: coords.lat,
                  locationLng: coords.lng,
                });
                setClientUser(updated);
                Alert.alert("Konum güncellendi", "Yakın klinikler mesafeye göre sıralanacak.");
              } catch (e) {
                Alert.alert("Hata", e instanceof Error ? e.message : "Konum güncellenemedi.");
              } finally {
                setLocating(false);
              }
            }}
            loading={locating}
          />
          <PrimaryButton title="Kaydet" onPress={save} loading={saving} />
        </Card>

        <Card>
          <View style={styles.sectionHead}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Gizlilik & Hesap</Text>
          </View>
          <PrivacyLink
            icon="document-text-outline"
            label="Gizlilik Politikası"
            onPress={() => setLegalDoc("privacy")}
          />
          <PrivacyLink
            icon="reader-outline"
            label="Kullanım Koşulları"
            onPress={() => setLegalDoc("terms")}
          />
          <PrimaryButton
            title="Verilerimi İndir"
            variant="ghost"
            onPress={exportData}
            loading={exporting}
          />
          <PrimaryButton
            title="Hesabımı Sil"
            variant="danger"
            onPress={confirmDeleteAccount}
            loading={deleting}
          />
          <Text style={styles.privacyNote}>
            Verileriniz HTTPS ile şifrelenir. Hesap silindikten sonra kayıtlar 30 gün içinde kalıcı
            olarak silinir (KVKK / GDPR).
          </Text>
        </Card>

        <PrimaryButton title="Çıkış Yap" variant="danger" onPress={confirmSignOut} />
      </ScrollView>

      <LegalDocumentModal
        visible={legalDoc !== null}
        doc={legalDoc}
        onClose={() => setLegalDoc(null)}
      />
    </SafeAreaView>
  );
}
function PrivacyLink({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.privacyLink} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.privacyLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

function QuickItem({  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickItem} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.quickIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: {
    marginTop: spacing.sm,
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    overflow: "hidden",
    ...shadow.soft,
  },
  avatarRing: {
    padding: 4,
    borderRadius: radius.xl + 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primary, fontSize: 30, fontWeight: "800" },
  name: { fontSize: 22, fontWeight: "800", color: colors.white },
  email: { color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "500" },
  quickRow: { flexDirection: "row", gap: spacing.sm },
  quickItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: { fontSize: 11, fontWeight: "700", color: colors.text },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.text },
  privacyLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  privacyLinkText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },
  privacyNote: {
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
});