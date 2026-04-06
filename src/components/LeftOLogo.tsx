import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import { Colors } from "../theme";

interface LeftOLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function LeftOLogo({ size = "md", showText = true }: LeftOLogoProps) {
  const sizes = {
    sm: { circle: 56, text: 18 },
    md: { circle: 84, text: 26 },
    lg: { circle: 130, text: 40 },
  };
  const s = sizes[size];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          {
            width: s.circle,
            height: s.circle,
            borderRadius: s.circle / 2,
          },
        ]}
      >
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      {showText && (
        <Text style={[styles.logoText, { fontSize: s.text }]}>LeftO</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    backgroundColor: Colors.white,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  logoText: {
    fontWeight: "800",
    color: Colors.grayDark,
    letterSpacing: -1,
  },
});
