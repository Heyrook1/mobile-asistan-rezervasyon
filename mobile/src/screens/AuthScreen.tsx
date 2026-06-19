import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../state/AuthContext";
import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { LegalDocumentModal } from "../components/LegalDocumentModal";
import { LegalDocId } from "../legal";
const BRAND = {
  heroTop: "#0D5C6B",
  heroMid: "#1BA8B5",
  heroBottom: "#4DD4E8",
  teal: "#1BA8B5",
  tealDark: "#0D7A86",
  text: "#1A2B3C",
  muted: "#6B7C8F",
  border: "#E4EBF0",
  bg: "#F4F7FA",
  white: "#FFFFFF",
  welcome: "#6B7C8F",
};

type Mode = "signIn" | "register";

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { signIn, register, isWorking } = useAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedHealthData, setAcceptedHealthData] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocId | "kvkk" | null>(null);

  const isSignIn = mode === "signIn";

  const submit = async () => {
    setError(null);
    if (!isSignIn) {
      if (!acceptedTerms || !acceptedPrivacy || !acceptedHealthData) {
        setError("Devam etmek için tüm onay kutularını işaretleyin.");
        return;
      }
    }
    try {
      if (isSignIn) await signIn(email, password);
      else {
        await register({
          fullName,
          email,
          phone,
          password,
          acceptedTerms,
          acceptedPrivacy,
          acceptedHealthData,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bir hata oluştu.");
    }
  };
  const forgotPassword = async () => {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      setError("Şifre sıfırlama için e-posta adresinizi girin.");
      return;
    }
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(mail);
    if (resetErr) {
      Alert.alert("Hata", "Sıfırlama e-postası gönderilemedi.");
    } else {
      Alert.alert(
        "E-posta gönderildi",
        "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={[BRAND.heroTop, BRAND.heroMid, BRAND.heroBottom]}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { paddingTop: insets.top + 20 }]}
          >
            <View style={styles.heroGlow} />

            <Image
              source={require("../../assets/asistan-logo-watermark.png")}
              style={styles.logoWatermark}
              resizeMode="contain"
              accessibilityLabel=""
            />

            <View style={styles.heroContent}>
              <View style={styles.brandRow}>
                <View style={styles.brandIconClip}>
                  <Image
                    source={require("../../assets/asistan-logo-watermark.png")}
                    style={styles.brandIconCrop}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandWord}>asistan</Text>
              </View>

              <Text style={styles.heroTitle}>Hızlı ve güvenli{"\n"}randevu</Text>
              <Text style={styles.heroSubtitle}>
                Klinikleri keşfedin, en uygun saati seçin.
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.card}>
            <Text style={styles.welcome}>Hoş geldiniz</Text>
            <Text style={styles.cardTitle}>{isSignIn ? "Giriş Yap" : "Kayıt Ol"}</Text>
            <Text style={styles.cardSub}>
              {isSignIn
                ? "Hesabınıza bağlanarak randevunuzu kolayca oluşturun."
                : "Birkaç adımda hesabınızı oluşturun."}
            </Text>

            {!config.isConfigured ? (
              <View style={styles.warn}>
                <Text style={styles.warnText}>
                  Supabase yapılandırması eksik. mobile/.env içine anahtarları ekleyin.
                </Text>
              </View>
            ) : null}

            {!isSignIn ? (
              <>
                <InputRow icon="person-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Ad Soyad"
                    placeholderTextColor={BRAND.muted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </InputRow>
                <InputRow icon="call-outline">
                  <TextInput
                    style={styles.input}
                    placeholder="Telefon"
                    placeholderTextColor={BRAND.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </InputRow>
              </>
            ) : null}

            <InputRow icon="mail-outline">
              <TextInput
                style={styles.input}
                placeholder="E-posta adresiniz"
                placeholderTextColor={BRAND.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </InputRow>

            <InputRow icon="lock-closed-outline">
              <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                placeholderTextColor={BRAND.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass((s) => !s)} hitSlop={8}>
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={BRAND.muted}
                />
              </TouchableOpacity>
            </InputRow>

            {!isSignIn ? (
              <View style={styles.consentBlock}>
                <ConsentRow
                  checked={acceptedTerms}
                  onToggle={() => setAcceptedTerms((v) => !v)}
                  text="Kullanım koşullarını okudum ve kabul ediyorum."
                  onRead={() => setLegalDoc("terms")}
                />
                <ConsentRow
                  checked={acceptedPrivacy}
                  onToggle={() => setAcceptedPrivacy((v) => !v)}
                  text="Gizlilik politikasını okudum ve kabul ediyorum."
                  onRead={() => setLegalDoc("privacy")}
                />
                <ConsentRow
                  checked={acceptedHealthData}
                  onToggle={() => setAcceptedHealthData((v) => !v)}
                  text="Sağlık verisi işleme açık rızasını veriyorum (KVKK)."
                  onRead={() => setLegalDoc("kvkk")}
                />
              </View>
            ) : null}

            <View style={styles.rowBetween}>              <TouchableOpacity
                style={styles.remember}
                onPress={() => setRemember((r) => !r)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <Text style={styles.rememberText}>Beni hatırla</Text>
              </TouchableOpacity>
              {isSignIn ? (
                <TouchableOpacity onPress={forgotPassword}>
                  <Text style={styles.link}>Şifremi unuttun?</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity activeOpacity={0.9} onPress={submit} disabled={isWorking}>
              <LinearGradient
                colors={[BRAND.teal, BRAND.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryBtn, isWorking && { opacity: 0.7 }]}
              >
                <Text style={styles.primaryBtnText}>
                  {isWorking ? "Lütfen bekleyin..." : isSignIn ? "Giriş Yap" : "Hesap Oluştur"}
                </Text>
                {!isWorking ? (
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                ) : null}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                {isSignIn ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
              </Text>
              <TouchableOpacity onPress={() => setMode(isSignIn ? "register" : "signIn")}>
                <Text style={styles.link}>{isSignIn ? "Kayıt ol" : "Giriş yap"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.ssl}>
            <Ionicons name="lock-closed" size={12} color={BRAND.muted} />
            <Text style={styles.sslText}>Verileriniz 256-bit SSL ile korunur.</Text>
          </View>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => setLegalDoc("privacy")}>
              <Text style={styles.legalLink}>Gizlilik</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => setLegalDoc("terms")}>
              <Text style={styles.legalLink}>Kullanım Koşulları</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalDocumentModal
        visible={legalDoc !== null}
        doc={legalDoc}
        onClose={() => setLegalDoc(null)}
      />
    </View>
  );
}
function ConsentRow({
  checked,
  onToggle,
  text,
  onRead,
}: {
  checked: boolean;
  onToggle: () => void;
  text: string;
  onRead: () => void;
}) {
  return (
    <View style={styles.consentRow}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>
          {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.consentText} onPress={onToggle}>
          {text}
        </Text>
        <TouchableOpacity onPress={onRead}>
          <Text style={styles.link}>Metni oku</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InputRow({  icon,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon} size={20} color={BRAND.muted} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND.bg },
  scroll: { paddingBottom: 32 },
  hero: {
    minHeight: 292,
    paddingHorizontal: 24,
    paddingBottom: 52,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    right: -40,
    top: 30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(45, 212, 191, 0.18)",
  },
  logoWatermark: {
    position: "absolute",
    right: -24,
    top: 48,
    width: 240,
    height: 72,
    opacity: 0.14,
    zIndex: 1,
  },
  heroContent: {
    position: "relative",
    zIndex: 3,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 22,
  },
  brandIconClip: {
    width: 38,
    height: 38,
    overflow: "hidden",
  },
  brandIconCrop: {
    width: 158,
    height: 38,
  },
  brandWord: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
    maxWidth: 240,
  },
  card: {
    marginTop: -36,
    marginHorizontal: 16,
    backgroundColor: BRAND.white,
    borderRadius: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
    shadowColor: "#0E1F33",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  welcome: { color: BRAND.welcome, fontSize: 13, fontWeight: "500" },
  cardTitle: { color: BRAND.text, fontSize: 26, fontWeight: "800", marginTop: 4 },
  cardSub: { color: BRAND.muted, fontSize: 13, marginTop: 6, marginBottom: 20, lineHeight: 19 },
  warn: {
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  warnText: { color: "#92400E", fontSize: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#FBFCFE",
  },
  input: { flex: 1, fontSize: 15, color: BRAND.text },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 18,
  },
  remember: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: BRAND.teal, borderColor: BRAND.teal },
  rememberText: { color: BRAND.text, fontSize: 13, fontWeight: "500" },
  link: { color: BRAND.teal, fontSize: 13, fontWeight: "700" },
  error: { color: "#DC2626", fontSize: 13, marginBottom: 12 },
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: BRAND.border },
  dividerText: { color: BRAND.muted, fontSize: 12 },
  bioBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: BRAND.white,
  },
  bioBtnText: { color: BRAND.text, fontSize: 15, fontWeight: "700" },
  social: { flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 16 },
  socialBtn: {
    width: 54,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBFCFE",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  registerText: { color: BRAND.muted, fontSize: 13 },
  ssl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 24,
  },
  sslText: { color: BRAND.muted, fontSize: 12 },
  consentBlock: { gap: 10, marginBottom: 14 },
  consentRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  consentText: { color: BRAND.text, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingBottom: 8,
  },
  legalLink: { color: BRAND.teal, fontSize: 12, fontWeight: "700" },
  legalDot: { color: BRAND.muted, fontSize: 12 },
});