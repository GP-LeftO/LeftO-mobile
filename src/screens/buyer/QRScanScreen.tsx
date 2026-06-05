import React, { useState } from "react";
import {
  StyleSheet, Text, View, Platform, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import api from "../../services/shared/api";

interface QRScanScreenProps {
  orderId: string;
  orderTitle?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function QRScanScreen({ orderId, orderTitle, onBack, onSuccess }: QRScanScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScan = async () => {
    if (!token.trim()) {
      setError(rtl ? "يرجى إدخال رمز QR" : "Please enter the QR token");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post(`/api/orders/${orderId}/scan`, { token: token.trim() });
      Alert.alert(
        rtl ? "تم الاستلام!" : "Pickup Confirmed!",
        rtl ? "تم تأكيد استلام طلبك بنجاح." : "Your order has been marked as received.",
        [{ text: rtl ? "حسناً" : "OK", onPress: onSuccess }]
      );
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 400) {
        setError(rtl ? "رمز QR غير صالح أو منتهي الصلاحية" : "QR code is invalid or expired");
      } else if (status === 404) {
        setError(rtl ? "الطلب غير موجود" : "Order not found");
      } else {
        setError(rtl ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(60).duration(450).springify()} style={[styles.header, rtl && styles.headerRTL]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>
          {rtl ? "مسح رمز QR" : "Scan QR Code"}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500).springify()} style={styles.content}>
        {/* QR placeholder frame */}
        <View style={styles.qrFrame}>
          <View style={styles.qrFrameCornerTL} />
          <View style={styles.qrFrameCornerTR} />
          <View style={styles.qrFrameCornerBL} />
          <View style={styles.qrFrameCornerBR} />
          <Feather name="maximize" size={100} color={Colors.primaryOrange} style={{ opacity: 0.2 }} />
          <View style={styles.qrCameraPlaceholder}>
            <Feather name="camera-off" size={36} color={Colors.grayMedium} />
            <Text style={[styles.qrCameraText, rtl && styles.rtl]}>
              {rtl
                ? "كاميرا QR غير متاحة في هذا الإصدار"
                : "QR camera not available in this build"}
            </Text>
            <Text style={[styles.qrCameraNote, rtl && styles.rtl]}>
              {rtl
                ? "أدخل رمز التحقق يدوياً أدناه"
                : "Enter the verification token below"}
            </Text>
          </View>
        </View>

        {orderTitle ? (
          <Text style={[styles.orderLabel, rtl && styles.rtl]}>
            {rtl ? `الطلب: ${orderTitle}` : `Order: ${orderTitle}`}
          </Text>
        ) : null}

        {/* Manual token entry */}
        <View style={styles.tokenField}>
          <Text style={[styles.tokenLabel, rtl && styles.rtl]}>
            {rtl ? "رمز التحقق" : "Verification Token"}
          </Text>
          <View style={[styles.tokenRow, rtl && styles.tokenRowRTL]}>
            <TextInput
              style={[styles.tokenInput, rtl && styles.rtlInput]}
              value={token}
              onChangeText={(v) => { setToken(v); setError(""); }}
              placeholder={rtl ? "الصق رمز QR هنا" : "Paste QR token here"}
              placeholderTextColor={Colors.grayMedium}
              autoCapitalize="none"
              autoCorrect={false}
              textAlign={rtl ? "right" : "left"}
              onSubmitEditing={handleScan}
            />
            <TouchableOpacity
              style={[styles.scanBtn, loading && { opacity: 0.6 }]}
              onPress={handleScan}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Feather name="check" size={20} color={Colors.white} />
              }
            </TouchableOpacity>
          </View>
          {error ? <Text style={[styles.errorText, rtl && styles.rtl]}>{error}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const CORNER = 24;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  headerRTL: { flexDirection: "row-reverse" },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },

  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.lg },

  qrFrame: {
    aspectRatio: 1, maxWidth: 280, alignSelf: "center", width: "100%",
    borderRadius: 20, backgroundColor: Colors.grayLight + "60",
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  qrFrameCornerTL: {
    position: "absolute", top: 12, left: 12,
    width: CORNER, height: CORNER,
    borderTopWidth: 3, borderLeftWidth: 3,
    borderColor: Colors.primaryOrange, borderTopLeftRadius: 8,
  },
  qrFrameCornerTR: {
    position: "absolute", top: 12, right: 12,
    width: CORNER, height: CORNER,
    borderTopWidth: 3, borderRightWidth: 3,
    borderColor: Colors.primaryOrange, borderTopRightRadius: 8,
  },
  qrFrameCornerBL: {
    position: "absolute", bottom: 12, left: 12,
    width: CORNER, height: CORNER,
    borderBottomWidth: 3, borderLeftWidth: 3,
    borderColor: Colors.primaryOrange, borderBottomLeftRadius: 8,
  },
  qrFrameCornerBR: {
    position: "absolute", bottom: 12, right: 12,
    width: CORNER, height: CORNER,
    borderBottomWidth: 3, borderRightWidth: 3,
    borderColor: Colors.primaryOrange, borderBottomRightRadius: 8,
  },
  qrCameraPlaceholder: { alignItems: "center", gap: 8, padding: Spacing.md },
  qrCameraText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium, textAlign: "center" },
  qrCameraNote: { fontSize: 12, color: Colors.grayMedium, textAlign: "center" },

  orderLabel: { fontSize: 14, fontWeight: "700", color: Colors.grayDark, textAlign: "center" },

  tokenField: { gap: 8 },
  tokenLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  tokenRow: { flexDirection: "row", gap: 10 },
  tokenRowRTL: { flexDirection: "row-reverse" },
  tokenInput: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 48,
    fontSize: 14, color: Colors.grayDark,
  },
  rtlInput: { textAlign: "right" },
  scanBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
  },
  errorText: { fontSize: 13, color: "#ef4444" },
});
