import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

import en from './en.json';
import ar from './ar.json';

const LANGUAGE_KEY = 'user-language';

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const isRTL = lang === 'ar';

  if (I18nManager.isRTL !== isRTL) {
    I18nManager.forceRTL(isRTL);
    await Updates.reloadAsync();
  }
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLanguage) {
    savedLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
  }

  const isRTL = savedLanguage === 'ar';
  I18nManager.forceRTL(isRTL);

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;