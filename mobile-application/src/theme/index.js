import { Platform } from "react-native";

export const colors = {
  navy: "#0B2A4A",
  navySoft: "#1E3A5F",
  teal: "#12B3C1",
  tealDark: "#0A8F9E",
  tealSoft: "#E3F6F8",
  tealTint: "#F0FAFB",
  bg: "#F4FAFC",
  card: "#FFFFFF",
  text: "#0B2A4A",
  muted: "#6B7C93",
  subtle: "#94A3B8",
  border: "#E3EEF3",
  success: "#16A34A",
  successSoft: "#E7F7EC",
  warning: "#D97706",
  warningSoft: "#FEF3E2",
  danger: "#E5484D",
  dangerSoft: "#FDECEC",
  info: "#2563EB",
  infoSoft: "#E8F0FE",
  white: "#FFFFFF",
  overlay: "rgba(11,42,74,0.45)",
};

export const gradients = {
  primary: ["#19C3CF", "#0A8F9E"],
  hero: ["#0B2A4A", "#0F6E86", "#12B3C1"],
  soft: ["#E9F8FA", "#F4FAFC"],
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const control = { height: 48, heightSmall: 38, inputHeight: 46 };

export const type = {
  display: { fontSize: 24, fontWeight: "800", color: colors.navy, letterSpacing: -0.4 },
  h1: { fontSize: 20, fontWeight: "800", color: colors.navy, letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.navy },
  h3: { fontSize: 15, fontWeight: "700", color: colors.navy },
  body: { fontSize: 14, color: colors.text, lineHeight: 20 },
  small: { fontSize: 12.5, color: colors.muted, lineHeight: 18 },
  caption: { fontSize: 10.5, color: colors.muted, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase" },
};

export const shadow = Platform.select({
  ios: { shadowColor: "#0B2A4A", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 2 },
  default: {},
});

export const shadowStrong = Platform.select({
  ios: { shadowColor: "#0A8F9E", shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  android: { elevation: 3 },
  default: {},
});
