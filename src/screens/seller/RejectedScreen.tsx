import React from "react";
import { StyleSheet, Text, View, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";

interface RejectedScreenProps {
  role?: string;
  onLogout?: () => void;
}

export default function RejectedScreen({ role = "seller", onLogout }: RejectedScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.iconSection}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Text style={styles.iconEmoji}>❌</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(500).springify()} style={styles.textBlock}>
          <Text style={[styles.title, rtl && styles.rtl]}>
            {rtl ? "تم رفض طلبك" : "Application Rejected"}
          </Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>
            {rtl
              ? "للأسف لم يتم قبول طلبك في الوقت الحالي. يمكنك التواصل مع فريق الدعم لمعرفة السبب أو إعادة التقديم."
              : "Unfortunately your application was not approved at this time. Contact support to find out why or reapply."}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500).springify()} style={styles.card}>
          <Feather name="info" size={16} color="#ef4444" />
          <Text style={[styles.cardText, rtl && styles.rtl]}>
            {rtl
              ? "قد يكون السبب وثائق ناقصة أو غير واضحة. تأكد من أن مستنداتك صالحة وتعيد التقديم."
              : "Common reasons include missing or unclear documents. Make sure your documents are valid and reapply."}
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(480).duration(500).springify()}
        style={styles.footer}
      >
        <TouchableOpacity style={styles.supportBtn} activeOpacity={0.8}>
          <Feather name="message-circle" size={16} color={Colors.primaryOrange} />
          <Text style={styles.supportBtnText}>{rtl ? "تواصل مع الدعم" : "Contact Support"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>{rtl ? "تسجيل الخروج" : "Sign Out"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, gap: Spacing.xl, justifyContent: "center" },
  rtl: { textAlign: "right" },

  iconSection: { alignItems: "center" },
  iconOuter: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  iconInner: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#fef2f2",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fecaca",
  },
  iconEmoji: { fontSize: 38 },

  textBlock: { gap: Spacing.sm, alignItems: "center" },
  title: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5, textAlign: "center" },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22, textAlign: "center" },

  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#fef2f2", borderRadius: 14, padding: Spacing.md,
    borderWidth: 1, borderColor: "#fecaca",
  },
  cardText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, gap: Spacing.sm },
  supportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.white,
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  supportBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primaryOrange },
  logoutBtn: { alignItems: "center", paddingVertical: 12 },
  logoutBtnText: { fontSize: 14, fontWeight: "600", color: Colors.grayMedium },
});
