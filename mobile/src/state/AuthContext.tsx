import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Platform } from "react-native";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { hasPersistedSupabaseSession } from "../lib/sessionStorage";
import * as api from "../api/client";
import { ClientUser } from "../api/types";
import { TIMEOUT, withTimeout } from "../utils/async";

type Phase = "loading" | "unauthenticated" | "ready";

const SESSION_TIMEOUT_MS = Platform.OS === "web" ? 5_000 : 12_000;
const PROFILE_TIMEOUT_MS = Platform.OS === "web" ? 8_000 : 12_000;
const SAFETY_TIMEOUT_MS = Platform.OS === "web" ? 8_000 : 15_000;

interface AuthState {
  phase: Phase;
  session: Session | null;
  clientUser: ClientUser | null;
  isWorking: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    acceptedTerms: boolean;
    acceptedPrivacy: boolean;
    acceptedHealthData: boolean;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setClientUser: (user: ClientUser | null) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [clientUser, setClientUser] = useState<ClientUser | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const bootstrapped = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const result = await withTimeout(api.getProfile(), PROFILE_TIMEOUT_MS);
      if (result !== TIMEOUT) setClientUser(result);
    } catch {
      // Profile fetch failed; still allow app access.
    }
    bootstrapped.current = true;
    setPhase("ready");
    void import("../lib/pushNotifications").then((m) => m.registerForPushNotifications());
  }, []);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const finish = (next: Phase) => {
      if (!mounted || settled) return;
      settled = true;
      bootstrapped.current = true;
      setPhase(next);
    };

    const safety = setTimeout(() => {
      if (!mounted || settled) return;
      void supabase.auth.signOut({ scope: "local" }).catch(() => {});
      finish("unauthenticated");
    }, SAFETY_TIMEOUT_MS);

    const clearSafety = () => clearTimeout(safety);

    const bootstrapNative = async () => {
      try {
        const result = await withTimeout(supabase.auth.getSession(), SESSION_TIMEOUT_MS);
        if (!mounted || settled) return;

        if (result === TIMEOUT) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          clearSafety();
          finish("unauthenticated");
          return;
        }

        const { data, error } = result;
        if (error) {
          clearSafety();
          finish("unauthenticated");
          return;
        }

        setSession(data.session);
        clearSafety();
        if (data.session) await loadProfile();
        else finish("unauthenticated");
      } catch {
        if (mounted && !settled) {
          clearSafety();
          finish("unauthenticated");
        }
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);

      if (Platform.OS === "web") {
        if (event === "INITIAL_SESSION") {
          clearSafety();
          if (!nextSession) {
            finish("unauthenticated");
            return;
          }
          if (!settled) await loadProfile();
        } else if (!nextSession) {
          setClientUser(null);
          finish("unauthenticated");
        } else if (event === "SIGNED_IN") {
          await loadProfile();
        }
        return;
      }

      // Native: only handle post-bootstrap auth changes.
      if (!nextSession) {
        setClientUser(null);
        if (bootstrapped.current) setPhase("unauthenticated");
      } else if (event === "SIGNED_IN") {
        await loadProfile();
      }
    });

    if (Platform.OS === "web") {
      if (!hasPersistedSupabaseSession()) {
        clearSafety();
        finish("unauthenticated");
      } else {
        void supabase.auth.getSession().catch(() => {});
      }
    } else {
      void bootstrapNative();
    }

    return () => {
      mounted = false;
      clearSafety();
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsWorking(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw new Error(translateAuthError(error.message));
        await loadProfile();
      } finally {
        setIsWorking(false);
      }
    },
    [loadProfile]
  );

  const register = useCallback(
    async (input: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      acceptedTerms: boolean;
      acceptedPrivacy: boolean;
      acceptedHealthData: boolean;
    }) => {
      setIsWorking(true);
      try {
        const email = input.email.trim().toLowerCase();
        await api.register({ ...input, email });
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: input.password,
        });
        if (error) throw new Error(translateAuthError(error.message));
        const profile = await api.getProfile({
          fullName: input.fullName,
          phone: input.phone,
        });
        setClientUser(profile);
        bootstrapped.current = true;
        setPhase("ready");
      } finally {
        setIsWorking(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } finally {
      setSession(null);
      setClientUser(null);
      setPhase("unauthenticated");
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setClientUser(profile);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      phase,
      session,
      clientUser,
      isWorking,
      signIn,
      register,
      signOut,
      refreshProfile,
      setClientUser,
    }),
    [phase, session, clientUser, isWorking, signIn, register, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-posta henüz onaylanmadı.";
  return "Giriş yapılamadı. Lütfen tekrar deneyin.";
}
