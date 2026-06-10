import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet, View, Text, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../theme";

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

const NABLUS_LAT = 32.2211;
const NABLUS_LNG = 35.2544;

function buildMapHtml(centerLat: number, centerLng: number, hasPin: boolean): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#e8eaed}
</style>
</head><body><div id="map"></div><script>
var marker=null;
var map=L.map('map',{center:[${centerLat},${centerLng}],zoom:15,zoomControl:false,attributionControl:false});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

function postPin(lat,lng){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',lat:lat,lng:lng}));
}

function placeMarker(lat,lng){
  if(marker){marker.setLatLng([lat,lng]);}
  else{
    marker=L.marker([lat,lng],{draggable:true}).addTo(map);
    marker.on('dragend',function(){var p=marker.getLatLng();postPin(p.lat,p.lng);});
  }
  postPin(lat,lng);
}

${hasPin ? `placeMarker(${centerLat},${centerLng});` : ""}

map.on('click',function(e){
  placeMarker(e.latlng.lat,e.latlng.lng);
  map.panTo([e.latlng.lat,e.latlng.lng]);
});

window.moveTo=function(lat,lng){
  map.setView([lat,lng],15,{animate:true});
  placeMarker(lat,lng);
};
</script></body></html>`;
}

export default function MapLocationPicker({ onConfirm, onCancel, initialLocation }: MapLocationPickerProps) {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);

  const startLat = initialLocation?.latitude ?? NABLUS_LAT;
  const startLng = initialLocation?.longitude ?? NABLUS_LNG;

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

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as { type: string; lat: number; lng: number };
      if (msg.type === "pin") {
        setPin({ latitude: msg.lat, longitude: msg.lng });
        reverseGeocode(msg.lat, msg.lng);
      }
    } catch {}
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
      webviewRef.current?.injectJavaScript(`window.moveTo(${latitude}, ${longitude}); true;`);
    } catch {
      // silent — user stays on Nablus view
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!pin) return;
    onConfirm({ latitude: pin.latitude, longitude: pin.longitude, address });
  };

  const mapHtml = buildMapHtml(startLat, startLng, !!initialLocation);

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.map}
        source={{ html: mapHtml }}
        javaScriptEnabled
        originWhitelist={["*"]}
        onMessage={handleWebViewMessage}
        scrollEnabled={false}
      />

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
