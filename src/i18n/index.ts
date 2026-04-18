import { I18nManager } from "react-native";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./en.json";
import ar from "./ar.json";

export type Language = "en" | "ar";
export type Translations = typeof en;

const translations: Record<Language, Translations> = { en, ar };
const LANGUAGE_KEY = "@lefto_language";

let currentLanguage: Language = "en";

export function initLanguage(): Language {
  const locale = Localization.getLocales()[0]?.languageCode ?? "en";
  const lang: Language = locale === "ar" ? "ar" : "en";
  currentLanguage = lang;
  applyRTL(lang);
  return lang;
}

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  applyRTL(lang);
}

export async function setLanguageAsync(lang: Language): Promise<void> {
  currentLanguage = lang;
  applyRTL(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

export async function restoreLanguage(): Promise<Language | null> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === "en" || saved === "ar") {
      currentLanguage = saved;
      applyRTL(saved);
      return saved;
    }
    return null;
  } catch {
    return null;
  }
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(): Translations {
  return translations[currentLanguage];
}

export function isRTL(): boolean {
  return currentLanguage === "ar";
}

function applyRTL(lang: Language): void {
  const shouldBeRTL = lang === "ar";
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
}
