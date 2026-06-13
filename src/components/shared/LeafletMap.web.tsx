import React from "react";
import { View } from "react-native";

interface LeafletMapProps {
  latitude:  number;
  longitude: number;
}

export default function LeafletMap({ latitude, longitude }: LeafletMapProps) {
  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:#e8eaed}</style>
</head><body><div id="map"></div><script>
var map=L.map('map',{center:[${latitude},${longitude}],zoom:15,zoomControl:false,attributionControl:false,dragging:false,touchZoom:false,doubleClickZoom:false,scrollWheelZoom:false});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
L.marker([${latitude},${longitude}]).addTo(map);
</script></body></html>`;

  return (
    <View style={{ flex: 1 }}>
      {React.createElement("iframe", {
        srcDoc: html,
        style: { width: "100%", height: "100%", border: "none", display: "block" },
        title: "map",
      })}
    </View>
  );
}
