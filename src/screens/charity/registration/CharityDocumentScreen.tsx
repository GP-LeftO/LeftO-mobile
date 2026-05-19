import React, { useState } from "react";
import {
  StyleSheet, Text, View, TouchableOpacity,
  Platform, KeyboardAvoidingView, ScrollView,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../../components/shared/Button";
import StepIndicator from "../../../components/auth/StepIndicator";
import { Colors, Spacing } from "../../../theme";
import { isRTL, t } from "../../../i18n";
import { useCharityRegistration } from "../../../hooks/charity/registration/useCharityRegistration";
import type { CharityInfoFormData } from "../../../types";

interface CharityDocumentScreenProps {
  basicInfo: { name: string; email: string; password: string };
  phone: string;
  charityInfo: CharityInfoFormData;
  onSuccess: () => void;
  onBack: () => void;
}

export default function CharityDocumentScreen({
  basicInfo,
  phone,
  charityInfo,
  onSuccess,
  onBack,
}: CharityDocumentScreenProps) {
  const insets       = useSafeAreaInsets();
  const rtl          = isRTL();
  const { charityReg } = t();

  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    docUri, docName, docError, setDocError,
    pickDocument, clearDoc,
    isUploading, uploadProgress,
    isSubmitting, submitError,
    isBusy,
    uploadAndRegister,
  } = useCharityRegistration();

  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async () => {
    if (!docUri) {
      setDocError(
        rtl
          ? "يرجى رفع وثيقة التسجيل"
          : "Please upload a registration document"
      );
      return;
    }

    const outcome = await uploadAndRegister(
      { name: basicInfo.name, phone, password: basicInfo.password, email: basicInfo.email },
      charityInfo
    );

    if (outcome === "success") {
      setSuccessMessage(charityReg.submitPending);
      setTimeout(onSuccess, 2200);
    }
  };

  const uploadFailed = !!docError && !docUri;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPadding + 12, paddingBottom: bottomPadding + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.8}
            disabled={isBusy}
          >
            <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
          </TouchableOpacity>
          <View style={styles.stepWrap}>
            <StepIndicator current={5} total={5} />
          </View>
        </View>

        {/* Title */}
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
          <View style={styles.iconWrap}>
            <Feather name="file-text" size={28} color={Colors.primaryOrange} />
          </View>
          <Text style={[styles.title, rtl && styles.rtl]}>{charityReg.docScreenTitle}</Text>
          <Text style={[styles.subtitle, rtl && styles.rtl]}>{charityReg.docScreenSubtitle}</Text>
        </Animated.View>

        {/* Document Upload */}
        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()} style={styles.section}>
          <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
            <Feather name="upload" size={14} color={Colors.primaryOrange} />{" "}
            {charityReg.uploadDoc}
          </Text>
          <Text style={[styles.sectionHint, rtl && styles.rtl]}>{charityReg.docHint}</Text>

          {docUri ? (
            <View style={styles.uploadDone}>
              <View style={styles.uploadDoneIcon}>
                <Feather name="check-circle" size={22} color={Colors.greenMain} />
              </View>
              <View style={styles.uploadDoneText}>
                <Text style={[styles.uploadDoneLabel, rtl && styles.rtl]}>
                  {charityReg.uploadSuccess}
                </Text>
                <Text style={[styles.uploadDoneFileName, rtl && styles.rtl]} numberOfLines={1}>
                  {docName}
                </Text>
              </View>
              {!isBusy && (
                <TouchableOpacity onPress={clearDoc} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={18} color={Colors.grayMedium} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBtn, !!docError && styles.uploadBtnError]}
              onPress={pickDocument}
              activeOpacity={0.8}
              disabled={isBusy}
            >
              <Feather name="upload" size={20} color={docError ? "#ef4444" : Colors.primaryOrange} />
              <Text style={[styles.uploadBtnLabel, docError && styles.uploadBtnLabelError, rtl && styles.rtl]}>
                {charityReg.selectDoc}
              </Text>
              <Text style={[styles.uploadBtnSub, rtl && styles.rtl]}>{charityReg.docHint}</Text>
            </TouchableOpacity>
          )}

          {/* Upload error */}
          {!!docError && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
              <Feather name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.errorBoxText, rtl && styles.rtl]}>{docError}</Text>
            </Animated.View>
          )}
        </Animated.View>

        {/* Upload progress bar */}
        {isUploading && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.progressSection}>
            <Text style={[styles.progressLabel, rtl && styles.rtl]}>{charityReg.uploading}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={[styles.progressPct, { textAlign: rtl ? "left" : "right" }]}>
              {uploadProgress}%
            </Text>
          </Animated.View>
        )}

        {/* Submitting label */}
        {isSubmitting && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.progressSection}>
            <Text style={[styles.progressLabel, rtl && styles.rtl]}>{charityReg.submitting}</Text>
          </Animated.View>
        )}

        {/* Approval note */}
        <Animated.View entering={FadeInDown.delay(280).duration(500).springify()} style={styles.approvalNote}>
          <Feather name="info" size={14} color={Colors.primaryOrange} />
          <Text style={[styles.approvalNoteText, rtl && styles.rtl]}>
            {charityReg.approvalNote}
          </Text>
        </Animated.View>

        {/* API / register error */}
        {!!submitError && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.errorBox}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={[styles.errorBoxText, rtl && styles.rtl]}>{submitError}</Text>
          </Animated.View>
        )}

        {/* Success message */}
        {!!successMessage && (
          <Animated.View entering={FadeInDown.duration(400)} style={styles.successBox}>
            <Text style={[styles.successText, rtl && styles.rtl]}>{successMessage}</Text>
          </Animated.View>
        )}

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(360).duration(500).springify()} style={{ gap: 12 }}>
          {uploadFailed ? (
            <Button
              label={charityReg.retryUpload}
              onPress={handleSubmit}
              variant="primary"
              loading={isBusy}
              testID="charity-doc-retry"
            />
          ) : (
            <Button
              label={charityReg.submit}
              onPress={handleSubmit}
              variant="primary"
              loading={isBusy}
              testID="charity-doc-submit"
            />
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1, backgroundColor: Colors.background },
  scroll:       { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl:          { textAlign: "right" },

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepWrap: { flex: 1 },

  titleBlock: { gap: Spacing.sm },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title:    { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },

  section:      { gap: 10 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  sectionHint:  { fontSize: 13, color: Colors.grayMedium, marginTop: -4 },

  uploadBtn: {
    backgroundColor: Colors.white, borderRadius: 18,
    borderWidth: 2, borderStyle: "dashed", borderColor: Colors.primaryOrange,
    padding: Spacing.xl, alignItems: "center", gap: 8,
  },
  uploadBtnError:      { borderColor: "#ef4444" },
  uploadBtnLabel:      { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },
  uploadBtnLabelError: { color: "#ef4444" },
  uploadBtnSub:        { fontSize: 13, color: Colors.grayMedium, textAlign: "center" },

  uploadDone: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#f0fdf4", borderRadius: 16,
    borderWidth: 2, borderColor: Colors.greenMain, padding: Spacing.md,
  },
  uploadDoneIcon:     { width: 40, height: 40, borderRadius: 12, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  uploadDoneText:     { flex: 1, gap: 2 },
  uploadDoneLabel:    { fontSize: 13, fontWeight: "700", color: Colors.greenMain },
  uploadDoneFileName: { fontSize: 13, color: Colors.grayMedium },

  progressSection: { gap: 6 },
  progressLabel:   { fontSize: 13, fontWeight: "600", color: Colors.grayDark },
  progressTrack:   { height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  progressFill:    { height: 8, backgroundColor: Colors.primaryOrange, borderRadius: 4 },
  progressPct:     { fontSize: 12, color: Colors.grayMedium },

  approvalNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.orangeLight, borderRadius: 12, padding: Spacing.md,
  },
  approvalNoteText: { flex: 1, fontSize: 13, color: Colors.orangeDark ?? Colors.primaryOrange, lineHeight: 18 },

  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: "#fecaca",
  },
  errorBoxText: { flex: 1, fontSize: 13, color: "#dc2626", lineHeight: 18 },

  successBox: {
    backgroundColor: "#f0fdf4", borderRadius: 16,
    borderWidth: 2, borderColor: Colors.greenMain, padding: Spacing.lg,
  },
  successText: { fontSize: 15, fontWeight: "700", color: Colors.greenMain, lineHeight: 22, textAlign: "center" },
});
