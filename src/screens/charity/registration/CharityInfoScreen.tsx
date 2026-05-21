import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput,
  TouchableOpacity, Platform, KeyboardAvoidingView,
  ScrollView, Modal,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Button from "../../../components/shared/Button";
import MapLocationPicker from "../../../components/buyer/MapLocationPicker";
import type { PickedLocation } from "../../../components/buyer/MapLocationPicker";
import StepIndicator from "../../../components/auth/StepIndicator";
import { Colors, Spacing } from "../../../theme";
import { isRTL, t } from "../../../i18n";
import { useCharityRegistration } from "../../../hooks/charity/registration/useCharityRegistration";
import type { CharityInfoFormData } from "../../../types";

interface CharityInfoScreenProps {
  onNext: (data: CharityInfoFormData) => void;
  onBack: () => void;
}

export default function CharityInfoScreen({ onNext, onBack }: CharityInfoScreenProps) {
  const insets       = useSafeAreaInsets();
  const rtl          = isRTL();
  const { charityReg } = t();

  const topPadding    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const {
    orgName, setOrgName,
    description, setDescription,
    region, setRegion,
    registrationNumber, setRegistrationNumber,
    contactPhone, setContactPhone,
    infoErrors, validateInfoFields, clearInfoError,
  } = useCharityRegistration();

  const orgNameRef            = useRef<TextInput>(null);
  const regionRef             = useRef<TextInput>(null);
  const registrationNumberRef = useRef<TextInput>(null);
  const contactPhoneRef       = useRef<TextInput>(null);

  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [showMap, setShowMap]               = useState(false);

  const handleNext = () => {
    if (!validateInfoFields(pickedLocation)) return;
    onNext({
      orgName:            orgName.trim(),
      description:        description.trim(),
      region:             region.trim(),
      registrationNumber: registrationNumber.trim(),
      location:           pickedLocation,
      contactPhone:       contactPhone.trim(),
    });
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
            <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
              <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
            </TouchableOpacity>
            <View style={styles.stepWrap}>
              <StepIndicator current={4} total={5} />
            </View>
          </View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={styles.titleBlock}>
            <View style={styles.iconWrap}>
              <Feather name="heart" size={28} color={Colors.greenMain} />
            </View>
            <Text style={[styles.title, rtl && styles.rtl]}>{charityReg.screenTitle}</Text>
            <Text style={[styles.subtitle, rtl && styles.rtl]}>{charityReg.screenSubtitle}</Text>
          </Animated.View>

          {/* Organization Name */}
          <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="briefcase" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.orgName}
            </Text>
            <View style={[styles.inputWrap, !!infoErrors.orgName && styles.inputError]}>
              <TextInput
                ref={orgNameRef}
                style={[styles.input, rtl && styles.rtl]}
                value={orgName}
                onChangeText={v => { setOrgName(v); clearInfoError("orgName"); }}
                placeholder={charityReg.orgNamePlaceholder}
                placeholderTextColor={Colors.grayMedium}
                textAlign={rtl ? "right" : "left"}
                returnKeyType="next"
                onSubmitEditing={() => regionRef.current?.focus()}
                submitBehavior="submit"
                autoCapitalize="words"
              />
            </View>
            {!!infoErrors.orgName && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.orgName}</Text>
            )}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(240).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="file-text" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.description}
            </Text>
            <View style={[styles.textAreaWrap, !!infoErrors.description && styles.inputError]}>
              <TextInput
                style={[styles.textArea, rtl && styles.rtl]}
                value={description}
                onChangeText={v => { setDescription(v); clearInfoError("description"); }}
                placeholder={charityReg.descriptionPlaceholder}
                placeholderTextColor={Colors.grayMedium}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                textAlign={rtl ? "right" : "left"}
              />
            </View>
            {!!infoErrors.description && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.description}</Text>
            )}
          </Animated.View>

          {/* Region (governorate / city) */}
          <Animated.View entering={FadeInDown.delay(270).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="map" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.region}
            </Text>
            <View style={[styles.inputWrap, !!infoErrors.region && styles.inputError]}>
              <TextInput
                ref={regionRef}
                style={[styles.input, rtl && styles.rtl]}
                value={region}
                onChangeText={v => { setRegion(v); clearInfoError("region"); }}
                placeholder={charityReg.regionPlaceholder}
                placeholderTextColor={Colors.grayMedium}
                textAlign={rtl ? "right" : "left"}
                returnKeyType="next"
                onSubmitEditing={() => registrationNumberRef.current?.focus()}
                submitBehavior="submit"
              />
            </View>
            {!!infoErrors.region && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.region}</Text>
            )}
          </Animated.View>

          {/* Ministry of Interior Registration Number */}
          <Animated.View entering={FadeInDown.delay(285).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="hash" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.registrationNumber}
            </Text>
            <Text style={[styles.sectionHint, rtl && styles.rtl]}>
              {charityReg.registrationNumberHint}
            </Text>
            <View style={[styles.inputWrap, !!infoErrors.registrationNumber && styles.inputError]}>
              <TextInput
                ref={registrationNumberRef}
                style={[styles.input, rtl && styles.rtl]}
                value={registrationNumber}
                onChangeText={v => { setRegistrationNumber(v); clearInfoError("registrationNumber"); }}
                placeholder={charityReg.registrationNumberPlaceholder}
                placeholderTextColor={Colors.grayMedium}
                textAlign={rtl ? "right" : "left"}
                returnKeyType="next"
                onSubmitEditing={() => contactPhoneRef.current?.focus()}
                submitBehavior="submit"
                autoCapitalize="characters"
              />
            </View>
            {!!infoErrors.registrationNumber && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.registrationNumber}</Text>
            )}
          </Animated.View>

          {/* Location — map picker */}
          <Animated.View entering={FadeInDown.delay(300).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="map-pin" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.locationLabel}
            </Text>

            {pickedLocation ? (
              <TouchableOpacity
                style={styles.locationSelected}
                onPress={() => setShowMap(true)}
                activeOpacity={0.85}
              >
                <View style={styles.locationIcon}>
                  <Feather name="map-pin" size={18} color={Colors.primaryOrange} />
                </View>
                <View style={styles.locationTextWrap}>
                  <Text style={[styles.locationAddress, rtl && styles.rtl]} numberOfLines={2}>
                    {pickedLocation.address}
                  </Text>
                  <Text style={[styles.locationChange, rtl && styles.rtl]}>
                    {charityReg.tapToChange}
                  </Text>
                </View>
                <Feather
                  name={rtl ? "chevron-left" : "chevron-right"}
                  size={18}
                  color={Colors.grayMedium}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.mapPickerBtn, !!infoErrors.location && styles.mapPickerBtnError]}
                onPress={() => { setShowMap(true); clearInfoError("location"); }}
                activeOpacity={0.85}
              >
                <View style={styles.mapPickerBtnInner}>
                  <View style={styles.mapPreviewDot} />
                  <Feather name="map" size={26} color={Colors.primaryOrange} />
                </View>
                <Text style={styles.mapPickerBtnLabel}>{charityReg.chooseOnMap}</Text>
                <Text style={styles.mapPickerBtnSub}>{charityReg.tapToOpenMap}</Text>
              </TouchableOpacity>
            )}

            {!!infoErrors.location && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.location}</Text>
            )}
          </Animated.View>

          {/* Contact Phone */}
          <Animated.View entering={FadeInDown.delay(360).duration(500).springify()} style={styles.section}>
            <Text style={[styles.sectionLabel, rtl && styles.rtl]}>
              <Feather name="phone" size={14} color={Colors.primaryOrange} />{" "}
              {charityReg.contactPhone}
            </Text>
            <View style={[styles.inputWrap, !!infoErrors.contactPhone && styles.inputError]}>
              <TextInput
                ref={contactPhoneRef}
                style={[styles.input, rtl && styles.rtl]}
                value={contactPhone}
                onChangeText={v => { setContactPhone(v); clearInfoError("contactPhone"); }}
                placeholder={charityReg.contactPhonePlaceholder}
                placeholderTextColor={Colors.grayMedium}
                keyboardType="phone-pad"
                textAlign={rtl ? "right" : "left"}
                returnKeyType="done"
                onSubmitEditing={handleNext}
              />
            </View>
            {!!infoErrors.contactPhone && (
              <Text style={[styles.errorText, rtl && styles.rtl]}>{infoErrors.contactPhone}</Text>
            )}
          </Animated.View>

          {/* Next Button */}
          <Animated.View entering={FadeInDown.delay(420).duration(500).springify()}>
            <Button
              label={charityReg.next}
              onPress={handleNext}
              variant="primary"
              testID="charity-info-next"
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showMap} animationType="slide" statusBarTranslucent>
        <MapLocationPicker
          initialLocation={pickedLocation ?? undefined}
          onConfirm={loc => {
            setPickedLocation(loc);
            clearInfoError("location");
            setShowMap(false);
          }}
          onCancel={() => setShowMap(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView:  { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  rtl:           { textAlign: "right" },

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
    backgroundColor: "#f0fdf4",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title:    { fontSize: 26, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, lineHeight: 22 },

  section:      { gap: 10 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  sectionHint:  { fontSize: 13, color: Colors.grayMedium, marginTop: -4 },
  errorText:    { fontSize: 13, color: "#ef4444" },

  inputWrap: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 52,
    justifyContent: "center",
  },
  input: { fontSize: 15, color: Colors.grayDark },
  inputError: { borderColor: "#ef4444" },

  textAreaWrap: {
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    padding: Spacing.md, minHeight: 110,
  },
  textArea: { fontSize: 15, color: Colors.grayDark, lineHeight: 22 },

  mapPickerBtn: {
    backgroundColor: Colors.white, borderRadius: 18,
    borderWidth: 2, borderColor: Colors.primaryOrange,
    borderStyle: "dashed", padding: Spacing.lg,
    alignItems: "center", gap: 8,
  },
  mapPickerBtnError: { borderColor: "#ef4444" },
  mapPickerBtnInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", position: "relative",
  },
  mapPreviewDot: {
    position: "absolute", width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.primaryOrange, top: 10, right: 10,
  },
  mapPickerBtnLabel: { fontSize: 16, fontWeight: "700", color: Colors.primaryOrange },
  mapPickerBtnSub:   { fontSize: 13, color: Colors.grayMedium, textAlign: "center" },

  locationSelected: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.primaryOrange, padding: Spacing.md,
  },
  locationIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  locationTextWrap:  { flex: 1, gap: 2 },
  locationAddress:   { fontSize: 14, fontWeight: "600", color: Colors.grayDark, lineHeight: 20 },
  locationChange:    { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },
});
