import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  donationId: string;
  onClose: () => void;
  onConfirm: (donationId: string, imageUri?: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProofUploadModal({
  visible,
  donationId,
  onClose,
  onConfirm,
}: Props) {
  const rtl = isRTL();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setError(null);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      await onConfirm(donationId, imageUri ?? undefined);
      setImageUri(null);
      onClose();
    } catch {
      setError(
        rtl
          ? "تعذّر تأكيد التبرع. يرجى المحاولة مجدداً."
          : "Could not confirm donation. Please try again."
      );
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    if (confirming) return;
    setImageUri(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
            {rtl ? "تأكيد التوزيع" : "Confirm Distribution"}
          </Text>
          <Text style={[styles.subtitle, { textAlign: rtl ? "right" : "left" }]}>
            {rtl
              ? "يمكنك رفع صورة إثبات التوزيع (اختياري)"
              : "You may upload a proof photo (optional)"}
          </Text>

          {/* Image area */}
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.changeBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Text style={styles.changeBtnText}>
                  {rtl ? "تغيير الصورة" : "Change Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Feather name="image" size={20} color={Colors.primaryOrange} />
              <Text style={styles.pickBtnText}>
                {rtl ? "اختر صورة من الاستوديو" : "Choose from Gallery"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error && (
            <Text style={[styles.errorText, { textAlign: rtl ? "right" : "left" }]}>
              {error}
            </Text>
          )}

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, confirming && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={confirming}
            activeOpacity={0.85}
          >
            {confirming ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Feather name="check-circle" size={16} color={Colors.white} />
                <Text style={styles.confirmBtnText}>
                  {rtl ? "تأكيد التوزيع" : "Confirm Distribution"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleClose}
            disabled={confirming}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>{rtl ? "إلغاء" : "Cancel"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLight,
    alignSelf: "center",
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.grayDark,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    marginBottom: Spacing.md,
  },

  imageContainer: { alignItems: "center", gap: 8, marginBottom: Spacing.sm },
  preview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
  },
  changeBtn: { paddingVertical: 4 },
  changeBtnText: { fontSize: 13, color: Colors.grayMedium, fontWeight: "600" },

  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: Spacing.sm,
  },
  pickBtnText: { fontSize: 14, color: Colors.primaryOrange, fontWeight: "700" },

  errorText: { fontSize: 13, color: "#EF4444", marginBottom: 4 },

  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.greenMain,
    borderRadius: 12,
    paddingVertical: 14,
  },
  confirmBtnDisabled: { opacity: 0.7 },
  confirmBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, color: Colors.grayMedium, fontWeight: "600" },
});
