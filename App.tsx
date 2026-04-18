import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { useAuthContext } from "./src/context/AuthContext";

import SplashScreen           from "./src/screens/SplashScreen";
import LanguageSelectionScreen from "./src/screens/LanguageSelectionScreen";
import OnboardingScreen       from "./src/screens/OnboardingScreen";
import PhoneEntryScreen       from "./src/screens/PhoneEntryScreen";
import OTPVerificationScreen  from "./src/screens/OTPVerificationScreen";
import RoleSelectionScreen    from "./src/screens/RoleSelectionScreen";
import BasicInfoScreen        from "./src/screens/BasicInfoScreen";
import RoleSpecificInfoScreen from "./src/screens/RoleSpecificInfoScreen";
import PendingScreen          from "./src/screens/PendingScreen";
import HomeScreen             from "./src/screens/HomeScreen";
import SignInScreen           from "./src/screens/SignInScreen";
import SellerDashboardScreen  from "./src/screens/SellerDashboardScreen";
import CharityDashboardScreen from "./src/screens/CharityDashboardScreen";
import RejectedScreen         from "./src/screens/RejectedScreen";

import { setLanguageAsync, restoreLanguage, isRTL } from "./src/i18n";
import type { Language } from "./src/i18n";
import type { UserRole } from "./src/services/storage";
import type { PostLoginRoute } from "./src/screens/SignInScreen";
import { Colors } from "./src/theme";
import { useAuth } from "./src/hooks/useAuth";

type AppStep =
  | "splash"
  | "language-selection"
  | "onboarding"
  | "phone-entry"
  | "otp-verification"
  | "role-selection"
  | "basic-info"
  | "role-specific"
  | "sign-in"
  | "under-review"
  | "rejected"
  | "buyer-home"
  | "seller-dashboard"
  | "charity-dashboard";

interface BasicInfo { name: string; email: string; password: string }

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const ctx = useAuthContext();

  const { register, login } = useAuth();
  const rtl = isRTL();

  const [stepHistory,   setStepHistory]   = useState<AppStep[]>(["splash"]);
  const [selectedRole,  setSelectedRole]  = useState<UserRole>(null);
  const [phone,         setPhone]         = useState("");
  const [basicInfo,     setBasicInfo]     = useState<BasicInfo>({ name: "", email: "", password: "" });
  const [language,      setCurrentLanguage] = useState<Language>("en");
  const [langRestored,  setLangRestored]  = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");

  const step   = stepHistory[stepHistory.length - 1];
  const goTo   = (s: AppStep) => setStepHistory(prev => [...prev, s]);
  const goBack = ()           => setStepHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  useEffect(() => {
    (async () => {
      const saved = await restoreLanguage();
      if (saved) setCurrentLanguage(saved);
      setLangRestored(true);
    })();
  }, []);

  useEffect(() => {
    if (ctx.isInitializing || !langRestored) return;
    if (ctx.isAuthenticated && ctx.user) {
      const route = resolveHomeRoute(ctx.user.role, ctx.sellerStatus, ctx.charityStatus);
      goTo(route);
    }
  }, [ctx.isInitializing, ctx.isAuthenticated, langRestored]);

  const resolveHomeRoute = (
    role: string,
    sellerStatus: string | null,
    charityStatus: string | null
  ): AppStep => {
    if (role === "BUYER") return "buyer-home";
    const status = role === "SELLER" ? sellerStatus : charityStatus;
    if (status === "APPROVED") return role === "SELLER" ? "seller-dashboard" : "charity-dashboard";
    if (status === "REJECTED") return "rejected";
    return "under-review";
  };

  const handlePostLogin = (route: PostLoginRoute) => {
    goTo(route as AppStep);
  };

  const handleRegisterAndProceed = async (info: BasicInfo) => {
    setBasicInfo(info);
    setIsRegistering(true);
    setRegisterError("");
    try {
      const apiRole = (selectedRole as string).toUpperCase() as "BUYER" | "SELLER" | "CHARITY";
      await register({ name: info.name, phone, password: info.password, role: apiRole, email: info.email || undefined });
      setIsRegistering(false);
      goTo("role-specific");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const status   = axiosErr.response?.status;
      const msg      = axiosErr.response?.data?.message;
      if (status === 409) {
        // Phone already registered from a previous attempt — log in silently and continue
        try {
          await login(phone, info.password);
          setIsRegistering(false);
          goTo("role-specific");
        } catch {
          setIsRegistering(false);
          setRegisterError(rtl
            ? "رقم الهاتف مسجّل مسبقاً بكلمة مرور مختلفة، يرجى تسجيل الدخول"
            : "Phone registered with a different password — please sign in instead");
        }
      } else {
        setIsRegistering(false);
        setRegisterError(msg ?? (rtl ? "حدث خطأ في التسجيل، يرجى المحاولة مجدداً" : "Registration failed, please try again"));
      }
    }
  };

  const handleLogout = () => {
    setStepHistory(["language-selection"]);
    setSelectedRole(null);
    setPhone("");
    setBasicInfo({ name: "", email: "", password: "" });
    setRegisterError("");
  };

  if (ctx.isInitializing || !langRestored) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={Colors.primaryOrange} size="large" />
      </View>
    );
  }

  const screen = (content: React.ReactNode) => (
    <Animated.View style={styles.screen} entering={FadeIn.duration(350)} exiting={FadeOut.duration(250)}>
      {content}
    </Animated.View>
  );

  return (
    <View style={styles.container}>

      {step === "splash" &&
        screen(<SplashScreen onComplete={() => goTo("language-selection")} />)
      }

      {step === "language-selection" &&
        screen(
          <LanguageSelectionScreen
            onComplete={async (lang) => {
              await setLanguageAsync(lang);
              setCurrentLanguage(lang);
              goTo("onboarding");
            }}
          />
        )
      }

      {step === "onboarding" &&
        screen(<OnboardingScreen key={language} onComplete={() => goTo("phone-entry")} />)
      }

      {step === "phone-entry" &&
        screen(
          <PhoneEntryScreen
            key={language}
            onBack={goBack}
            onComplete={(ph) => { setPhone(ph); goTo("otp-verification"); }}
            onSignIn={() => goTo("sign-in")}
          />
        )
      }

      {step === "otp-verification" &&
        screen(
          <OTPVerificationScreen
            key={language}
            phone={phone}
            onBack={goBack}
            onComplete={() => goTo("role-selection")}
          />
        )
      }

      {step === "role-selection" &&
        screen(
          <RoleSelectionScreen
            key={language}
            onBack={goBack}
            onComplete={(role) => { setSelectedRole(role); goTo("basic-info"); }}
          />
        )
      }

      {step === "basic-info" &&
        screen(
          <BasicInfoScreen
            key={language}
            role={selectedRole ?? undefined}
            onBack={goBack}
            registerError={registerError}
            isRegistering={isRegistering}
            onComplete={handleRegisterAndProceed}
          />
        )
      }

      {step === "role-specific" &&
        screen(
          <RoleSpecificInfoScreen
            key={language}
            role={selectedRole}
            phone={phone}
            name={basicInfo.name}
            email={basicInfo.email}
            password={basicInfo.password}
            onBack={goBack}
            onComplete={() => goTo("buyer-home")}
            onPending={() => goTo("under-review")}
          />
        )
      }

      {step === "sign-in" &&
        screen(
          <SignInScreen
            key={language}
            onBack={goBack}
            onSuccess={handlePostLogin}
            onRegister={() => goBack()}
          />
        )
      }

      {step === "buyer-home" &&
        screen(<HomeScreen onLogout={handleLogout} />)
      }

      {step === "seller-dashboard" &&
        screen(<SellerDashboardScreen onLogout={handleLogout} />)
      }

      {step === "charity-dashboard" &&
        screen(<CharityDashboardScreen onLogout={handleLogout} />)
      }

      {step === "under-review" &&
        screen(<PendingScreen role={selectedRole ?? ctx.user?.role?.toLowerCase() ?? "seller"} onLogout={handleLogout} onGoToSignIn={() => goTo("sign-in")} />)
      }

      {step === "rejected" &&
        screen(<RejectedScreen role={ctx.user?.role?.toLowerCase()} onLogout={handleLogout} />)
      }

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});