import React, { forwardRef, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import type { MapSeller, Coordinate } from "../types/browse.types";
import type { HeatSpot } from "../../../services/buyer/stats.service";
import { buildBrowseMapHtml, NABLUS } from "./leafletHtml";

interface Props {
  sellers:                 MapSeller[];
  selectedSellerId:        string | null;
  userLocation:            Coordinate | null;
  radiusMeters:            number;
  locationPermissionDenied: boolean;
  onSellerSelect:          (seller: MapSeller | null) => void;
  onMapTap:                () => void;
  heatspots?:              HeatSpot[];
}

const LeafletBrowseMap = forwardRef<WebView, Props>(function LeafletBrowseMap(
  { sellers, selectedSellerId, userLocation, radiusMeters, locationPermissionDenied, onSellerSelect, onMapTap, heatspots = [] },
  ref,
) {
  const center      = userLocation ?? NABLUS;
  const showUserPin = !locationPermissionDenied && !!userLocation;
  const [loaded, setLoaded] = useState(false);
  const prevSel     = useRef<string | null>(null);

  const html = buildBrowseMapHtml(sellers, center, radiusMeters, showUserPin, heatspots);

  // Use injectJavaScript for selection changes (avoids full WebView reload)
  useEffect(() => {
    if (!loaded) return;
    if (prevSel.current === selectedSellerId) return;
    prevSel.current = selectedSellerId;
    const id = selectedSellerId ? `'${selectedSellerId}'` : "null";
    const webview = typeof ref === "object" ? ref?.current : null;
    webview?.injectJavaScript(`window.selectSeller(${id}); true;`);
  }, [selectedSellerId, loaded, ref]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "sellerTap") {
        onSellerSelect(sellers.find((s) => s.id === msg.id) ?? null);
      } else if (msg.type === "mapTap") {
        onMapTap();
      }
    } catch {}
  };

  return (
    <WebView
      ref={ref}
      style={StyleSheet.absoluteFill}
      source={{ html, baseUrl: "https://openstreetmap.org" }}
      javaScriptEnabled
      originWhitelist={["*"]}
      onMessage={handleMessage}
      onLoad={() => { setLoaded(true); prevSel.current = null; }}
      scrollEnabled={false}
      allowUniversalAccessFromFileURLs
      allowFileAccessFromFileURLs
      mixedContentMode="always"
    />
  );
});

export default LeafletBrowseMap;
