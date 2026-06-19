export const colors = {
  bg: "#F4F7FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF6F8",
  border: "#E4EBF0",
  borderLight: "#F0F4F8",
  text: "#1A2B3C",
  muted: "#6B7C8F",
  primary: "#1BA8B5",
  primaryDark: "#0D7A86",
  primarySoft: "#E0F7FA",
  secondary: "#4DD4E8",
  accent: "#0D5C6B",
  verified: "#3B82F6",
  cta: "#22C55E",
  ctaSoft: "#DCFCE7",
  success: "#22C55E",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#EF4444",
  dangerSoft: "#FEE2E2",
  star: "#F59E0B",
  white: "#FFFFFF",
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const shadow = {
  card: {
    shadowColor: "#1A2B3C",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  soft: {
    shadowColor: "#1BA8B5",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
};

export const typography = {
  h1: { fontSize: 26, fontWeight: "800" as const, color: colors.text, letterSpacing: -0.4 },
  h2: { fontSize: 20, fontWeight: "800" as const, color: colors.text },
  h3: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "500" as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: "600" as const, color: colors.muted },
  label: { fontSize: 12, fontWeight: "700" as const, color: colors.muted },
};
