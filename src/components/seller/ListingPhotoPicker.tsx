import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { isRTL } from "../../i18n";
import { Colors } from "../../theme";

interface ListingPhotoPickerProps {
  photoUri: string | null;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved: () => void;
  uploading: boolean;
}

const TIPS = [
  { ar: "إضاءة جيدة",  en: "Good lighting"   },
  { ar: "خلفية نظيفة", en: "Clean background" },
  { ar: "صورة واضحة",  en: "Sharp photo"      },
];

export default function ListingPhotoPicker({
  photoUri,
  onPhotoSelected,
  onPhotoRemoved,
  uploading,
}: ListingPhotoPickerProps) {
  const rtl = isRTL();

  const launchGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        rtl ? "إذن مطلوب" : "Permission required",
        rtl
          ? "يرجى السماح بالوصول إلى مكتبة الصور من الإعدادات"
          : "Please allow photo library access in Settings",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const launchCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        rtl ? "إذن مطلوب" : "Permission required",
        rtl
          ? "يرجى السماح بالوصول إلى الكاميرا من الإعدادات"
          : "Please allow camera access in Settings",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotoSelected(result.assets[0].uri);
    }
  };

  const showPickerOptions = () => {
    Alert.alert(
      rtl ? "إضافة صورة" : "Add photo",
      undefined,
      [
        { text: rtl ? "اختر من المعرض" : "Choose from Gallery", onPress: launchGallery },
        { text: rtl ? "التقط صورة"    : "Take Photo",          onPress: launchCamera  },
        { text: rtl ? "إلغاء"          : "Cancel",              style: "cancel"        },
      ],
    );
  };

  return (
    <View>
      {photoUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: photoUri }} style={styles.image} resizeMode="cover" />

          {/* Remove button */}
          <TouchableOpacity
            style={[styles.removeBtn, rtl ? { left: 8 } : { right: 8 }]}
            onPress={onPhotoRemoved}
            disabled={uploading}
            activeOpacity={0.8}
          >
            <Feather name="x" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Change-photo overlay button */}
          {!uploading && (
            <TouchableOpacity style={styles.changeBtn} onPress={showPickerOptions} activeOpacity={0.8}>
              <Feather name="camera" size={14} color="#fff" />
              <Text style={styles.changeBtnText}>{rtl ? "تغيير" : "Change"}</Text>
            </TouchableOpacity>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator size="large" color={Colors.primaryOrange} />
              <Text style={styles.uploadingText}>{rtl ? "جارٍ رفع الصورة..." : "Uploading..."}</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.placeholder}
          onPress={showPickerOptions}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={32} color={Colors.grayMedium} />
          <Text style={styles.placeholderTitle}>
            {rtl ? "أضف صورة للإدراج" : "Add a listing photo"}
          </Text>
          <Text style={styles.placeholderSub}>
            {rtl ? "صورة واضحة تزيد المبيعات" : "A clear photo increases sales"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Tip chips */}
      <View style={[styles.tipsRow, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipChip}>
            <Text style={styles.tipText}>✓ {rtl ? tip.ar : tip.en}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 180,
    backgroundColor: "#F9FAFB",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#404040",
    marginTop: 4,
  },
  placeholderSub: {
    fontSize: 12,
    color: "#6B7280",
  },

  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
  },
  image: {
    width: "100%",
    height: 200,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    padding: 6,
  },
  changeBtn: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  changeBtnText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  uploadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryOrange,
  },

  tipsRow: {
    marginTop: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  tipChip: {
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
});
