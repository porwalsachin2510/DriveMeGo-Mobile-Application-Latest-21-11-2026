import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors } from "../theme";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services";
import { initials } from "../utils/format";
import { API_URL } from "../config/env";

export const resolveImage = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

export function useUnreadCount() {
  const { userId, isAuthenticated } = useAuth();
  const { data } = useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: () => notificationService.unreadCount(userId),
    enabled: isAuthenticated && !!userId,
    refetchInterval: 60000,
  });
  return data?.unreadCount ?? data?.count ?? data?.data?.unreadCount ?? data?.data?.count ?? 0;
}

export function AppHeader({ onBack, transparent }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const unread = useUnreadCount();
  const avatar = resolveImage(user?.profileImage);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }, transparent && { backgroundColor: "transparent" }]}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={19} color={colors.navy} />
          </Pressable>
        ) : null}
        <Image source={require("../../assets/images/logo-full.png")} style={styles.logo} contentFit="contain" />
      </View>
      <View style={styles.right}>
        <Pressable onPress={() => router.push("/notifications")} hitSlop={8} style={styles.bell} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={22} color={colors.navy} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable onPress={() => router.push("/profile")} style={styles.avatar} accessibilityLabel="Profile">
          {avatar ? (
            <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : user?.fullName ? (
            <Text style={styles.initials}>{initials(user.fullName)}</Text>
          ) : (
            <Ionicons name="person" size={20} color={colors.teal} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 118, height: 32 },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  bell: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 1,
    right: 1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.tealSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: { fontSize: 14, fontWeight: "800", color: colors.tealDark },
});
