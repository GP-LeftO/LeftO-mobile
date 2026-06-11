// Shared Leaflet map HTML builder — used by both the native (react-native-webview)
// and web (iframe) map components. No platform dependency so it bundles everywhere.
import type { MapSeller, Coordinate } from "../types/browse.types";
import type { HeatSpot } from "../../../services/buyer/stats.service";

export const NABLUS: Coordinate = { latitude: 32.2211, longitude: 35.2566 };

const EMOJI: Record<string, string> = {
  MEALS:              "🍽️",
  BREAD_AND_PASTRIES: "🥐",
  GROCERIES:          "🛒",
  MIXED:              "📦",
};

export function buildBrowseMapHtml(
  sellers:      MapSeller[],
  center:       Coordinate,
  radiusMeters: number,
  showUserPin:  boolean,
  heatspots:    HeatSpot[],
): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#e8eaed}
  .pin{display:flex;align-items:center;justify-content:center;width:36px;height:36px;
       border-radius:50%;background:white;border:2.5px solid #DE985A;font-size:16px;
       box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer}
  .pin.sel{background:#DE985A;border-color:white;transform:scale(1.25)}
  .pin.so{opacity:.45}
</style>
</head><body><div id="map"></div><script>
var EMOJI=${JSON.stringify(EMOJI)};
var sellers=${JSON.stringify(sellers)};
var markers={};
var radiusCircle=null;
var selectedId=null;

var map=L.map('map',{
  center:[${center.latitude},${center.longitude}],
  zoom:14,zoomControl:false,attributionControl:false
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

function drawRadius(lat,lng,r){
  if(radiusCircle)map.removeLayer(radiusCircle);
  radiusCircle=L.circle([lat,lng],{radius:r,color:'#16a34a',weight:2,fillColor:'#16a34a',fillOpacity:.08}).addTo(map);
}
drawRadius(${center.latitude},${center.longitude},${radiusMeters});

${showUserPin ? `
var uIcon=L.divIcon({html:'<div style="width:14px;height:14px;background:#4285F4;border-radius:50%;border:2px solid white;box-shadow:0 0 0 4px rgba(66,133,244,.25)"></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]});
L.marker([${center.latitude},${center.longitude}],{icon:uIcon,zIndexOffset:2000}).addTo(map);
` : ""}

function makeIcon(seller){
  var e=EMOJI[seller.category]||'📦';
  var isSel=seller.id===selectedId;
  var isSO=seller.listing.itemsLeft===0;
  var cls='pin'+(isSel?' sel':'')+(isSO?' so':'');
  return L.divIcon({html:'<div class="'+cls+'">'+e+'</div>',className:'',iconSize:[36,36],iconAnchor:[18,36]});
}

function renderPins(){
  Object.values(markers).forEach(function(m){map.removeLayer(m);});
  markers={};
  sellers.forEach(function(s){
    var m=L.marker([s.lat,s.lng],{icon:makeIcon(s)});
    m.on('click',function(e){
      L.DomEvent.stopPropagation(e);
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'sellerTap',id:s.id}));
    });
    m.addTo(map);
    markers[s.id]=m;
  });
}
renderPins();

map.on('click',function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapTap'}));
});

// ── Heatmap activity circles ──
var heatspots=${JSON.stringify(heatspots)};
heatspots.forEach(function(h){
  var r=20+(h.activeListings*8);
  var cm=L.circleMarker([h.lat,h.lng],{
    radius:r,
    color:'#DE985A',weight:1.5,
    fillColor:'#DE985A',fillOpacity:0.30
  }).addTo(map);
  cm.bindPopup('<b>'+h.businessName+'</b><br/>'+h.activeListings+' إدراجات نشطة',{closeButton:false});
  cm.on('click',function(e){L.DomEvent.stopPropagation(e);cm.openPopup();});
});

window.recenter=function(lat,lng){map.setView([lat,lng],14,{animate:true});};
window.selectSeller=function(id){
  selectedId=id;
  renderPins();
  if(id&&markers[id])map.panTo(markers[id].getLatLng(),{animate:true});
};
</script></body></html>`;
}
