import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@lefto_onboarding_complete";
const ROLE_KEY = "@lefto_selected_role";

export type UserRole = "buyer" | "seller" | "charity" | null;

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // silently fail
  }
}

export async function saveSelectedRole(role: UserRole): Promise<void> {
  try {
    if (role) {
      await AsyncStorage.setItem(ROLE_KEY, role);
    }
  } catch {
    // silently fail
  }
}

export async function getSelectedRole(): Promise<UserRole> {
  try {
    const value = await AsyncStorage.getItem(ROLE_KEY);
    return (value as UserRole) ?? null;
  } catch {
    return null;
  }
}

export async function clearOnboarding(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, ROLE_KEY]);
  } catch {
    // silently fail
  }
}
