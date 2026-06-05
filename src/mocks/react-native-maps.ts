import React from "react";
import { View } from "react-native";

export const PROVIDER_DEFAULT = null;
export const PROVIDER_GOOGLE = "google";

export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapPressEvent = {
  nativeEvent: { coordinate: { latitude: number; longitude: number } };
};

const MapView = React.forwardRef((_props: any, _ref: any) =>
  React.createElement(View, { style: _props.style })
);
MapView.displayName = "MapView";

export const Marker = ({ children }: any) =>
  React.createElement(View, null, children ?? null);

export const Circle = (_props: any) => null;
export const Callout = ({ children }: any) =>
  React.createElement(View, null, children ?? null);
export const Polygon = (_props: any) => null;
export const Polyline = (_props: any) => null;

export default MapView;
