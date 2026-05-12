import { useColorScheme } from "react-native";
import { colorTokens } from "../../theme";

export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "dark" && "dark" in colorTokens
      ? (colorTokens as Record<string, typeof colorTokens.light>).dark
      : colorTokens.light;
  return { ...palette, radius: colorTokens.radius };
}
