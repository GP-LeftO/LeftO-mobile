import React from "react";
import { Circle } from "react-native-maps";
import { Colors } from "../../../theme";
import type { Coordinate } from "../types/browse.types";

interface RadiusCircleProps {
  center: Coordinate;
  radiusMeters: number;
}

export function RadiusCircle({ center, radiusMeters }: RadiusCircleProps) {
  return (
    <Circle
      center={center}
      radius={radiusMeters}
      fillColor="rgba(22, 163, 74, 0.10)"
      strokeColor={Colors.greenMain}
      strokeWidth={1.5}
    />
  );
}
