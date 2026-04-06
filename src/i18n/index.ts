import { I18nManager } from "react-native";
import * as Localization from "expo-localization";

export type Language = "en" | "ar";

const translations = {
  en: {
    splash: {
      tagline: "Too good to waste",
    },
    onboarding: [
      {
        title: "Too good to waste",
        subtitle: "Discover surplus food from local stores at discounted prices",
      },
      {
        title: "Save money, help the planet",
        subtitle: "Reduce food waste and track your impact",
      },
      {
        title: "Share with others",
        subtitle: "Donate meals to local charities easily",
      },
      {
        title: "Join the community",
        subtitle: "Buyers, sellers, and charities working together",
      },
    ],
    skip: "Skip",
    next: "Next",
    getStarted: "Get Started",
    roleSelection: {
      title: "How will you use LeftO?",
      subtitle: "Choose your role to get started",
    },
    roles: {
      buyer: {
        label: "Buyer",
        description: "Find affordable food near you",
      },
      seller: {
        label: "Seller",
        description: "Sell surplus and reduce waste",
      },
      charity: {
        label: "Charity",
        description: "Receive and distribute donations",
      },
    },
    getStartedScreen: {
      title: "Ready to make a difference?",
      subtitle: "Join thousands of people fighting food waste together",
      createAccount: "Create Account",
      signIn: "Sign In",
    },
  },
  ar: {
    splash: {
      tagline: "لا يجب أن يُهدر الطعام",
    },
    onboarding: [
      {
        title: "لا يجب أن يُهدر الطعام",
        subtitle: "اكتشف الطعام الفائض من المحلات المحلية بأسعار مخفضة",
      },
      {
        title: "وفّر المال وساعد الكوكب",
        subtitle: "قلل هدر الطعام وتتبع تأثيرك الإيجابي",
      },
      {
        title: "شارك مع الآخرين",
        subtitle: "تبرع بالوجبات للجمعيات الخيرية المحلية بسهولة",
      },
      {
        title: "انضم إلى المجتمع",
        subtitle: "مشترون وبائعون وجمعيات خيرية يعملون معاً",
      },
    ],
    skip: "تخطّ",
    next: "التالي",
    getStarted: "ابدأ الآن",
    roleSelection: {
      title: "كيف ستستخدم LeftO؟",
      subtitle: "اختر دورك للبدء",
    },
    roles: {
      buyer: {
        label: "مشترٍ",
        description: "اعثر على طعام بأسعار معقولة بالقرب منك",
      },
      seller: {
        label: "بائع",
        description: "بع الفائض وقلل الهدر",
      },
      charity: {
        label: "جمعية خيرية",
        description: "استقبل التبرعات ووزّعها",
      },
    },
    getStartedScreen: {
      title: "هل أنت مستعد للتغيير؟",
      subtitle: "انضم إلى آلاف الأشخاص في مكافحة هدر الطعام معاً",
      createAccount: "إنشاء حساب",
      signIn: "تسجيل الدخول",
    },
  },
};

export type Translations = typeof translations.en;

let currentLanguage: Language = "en";

export function initLanguage(): Language {
  const locale = Localization.getLocales()[0]?.languageCode ?? "en";
  const lang: Language = locale === "ar" ? "ar" : "en";
  currentLanguage = lang;

  const shouldBeRTL = lang === "ar";
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }

  return lang;
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
