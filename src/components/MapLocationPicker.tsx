import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import MapView, { Marker, MapPressEvent, Region, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "../theme";

export interface PickedLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface MapLocationPickerProps {
  onConfirm: (location: PickedLocation) => void;
  onCancel: () => void;
  initialLocation?: { latitude: number; longitude: number };
}

const PALESTINE_DEFAULT: Region = {
  latitude: 32.2211,
  longitude: 35.2544,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
};

export default function MapLocationPicker({ onConfirm, onCancel, initialLocation }: MapLocationPickerProps) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(
    initialLocation ?? null
  );
  const [address, setAddress] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (initialLocation) reverseGeocode(initialLocation.latitude, initialLocation.longitude);
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
        setAddress(parts.join(", "));
      } else {
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    } catch {
      setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    reverseGeocode(latitude, longitude);
  };

  const handleMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setPin({ latitude, longitude });
      reverseGeocode(latitude, longitude);
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        800
      );
    } catch {
      // silent
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!pin) return;
    onConfirm({ latitude: pin.latitude, longitude: pin.longitude, address });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={
          initialLocation
            ? { ...initialLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
            : PALESTINE_DEFAULT
        }
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {pin && (
          <Marker coordinate={pin} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.markerContainer}>
              <View style={styles.markerBubble}>
                <Feather name="map-pin" size={18} color={Colors.white} />
              </View>
              <View style={styles.markerTail} />
            </View>
          </Marker>
        )}
      </MapView>

      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[styles.topBar, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 8 }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={onCancel} activeOpacity={0.85}>
          <Feather name="x" size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <View style={styles.topTitle}>
          <Text style={styles.topTitleText}>Pick your location</Text>
          <Text style={styles.topSubtitle}>Tap anywhere on the map</Text>
        </View>
        <TouchableOpacity style={styles.myLocationBtn} onPress={handleMyLocation} activeOpacity={0.85} disabled={locating}>
          {locating
            ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
            : <Feather name="navigation" size={20} color={Colors.primaryOrange} />
          }
        </TouchableOpacity>
      </Animated.View>

      {!pin && (
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.hint}>
          <Feather name="map-pin" size={14} color={Colors.grayMedium} />
          <Text style={styles.hintText}>Tap the map to drop a pin, or use your current location</Text>
        </Animated.View>
      )}

      {pin && (
        <Animated.View
          entering={FadeInUp.duration(350).springify()}
          style={[styles.bottomCard, { paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 12 }]}
        >
          <View style={styles.addressRow}>
            <View style={styles.addressIcon}>
              <Feather name="map-pin" size={16} color={Colors.primaryOrange} />
            </View>
            <View style={styles.addressTextWrap}>
              <Text style={styles.addressLabel}>Selected location</Text>
              {geocoding
                ? <ActivityIndicator size="small" color={Colors.grayMedium} style={{ alignSelf: "flex-start" }} />
                : <Text style={styles.addressValue} numberOfLines={2}>{address || "Unknown location"}</Text>
              }
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmBtn, (!pin || geocoding) && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.85}
            disabled={!pin || geocoding}
          >
            <Feather name="check" size={18} color={Colors.white} />
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { flex: 1, gap: 1 },
  topTitleText: { fontSize: 16, fontWeight: "700", color: Colors.grayDark },
  topSubtitle: { fontSize: 12, color: Colors.grayMedium },
  myLocationBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },

  markerContainer: { alignItems: "center" },
  markerBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 8, elevation: 6,
  },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    borderTopColor: Colors.primaryOrange,
    marginTop: -1,
  },

  hint: {
    position: "absolute", bottom: 32,
    alignSelf: "center",
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  hintText: { fontSize: 13, color: Colors.grayMedium },

  bottomCard: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 10,
  },
  addressRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  addressIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
    marginTop: 2,
  },
  addressTextWrap: { flex: 1, gap: 2 },
  addressLabel: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.5 },
  addressValue: { fontSize: 15, fontWeight: "600", color: Colors.grayDark, lineHeight: 20 },

  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16, paddingVertical: 15,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
});
