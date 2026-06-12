import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import {
  setupNotificationHandler,
  getFcmToken,
  savePushToken,
  clearPushToken,
  addNotificationResponseListener,
  isExpoGo,
} from "./src/services/shared/pushNotifications.service";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { AuthProvider } from "./src/context/AuthContext";
import { AppConfigProvider } from "./src/context/AppConfigContext";
import { useAuthContext } from "./src/context/AuthContext";

import SplashScreen           from "./src/screens/onboarding/SplashScreen";
import LanguageSelectionScreen from "./src/screens/onboarding/LanguageSelectionScreen";
import OnboardingScreen       from "./src/screens/onboarding/OnboardingScreen";
import PhoneEntryScreen       from "./src/screens/auth/PhoneEntryScreen";
import OTPVerificationScreen  from "./src/screens/auth/OTPVerificationScreen";
import RoleSelectionScreen    from "./src/screens/registration/RoleSelectionScreen";
import BasicInfoScreen        from "./src/screens/registration/BasicInfoScreen";
import RoleSpecificInfoScreen from "./src/screens/registration/RoleSpecificInfoScreen";
import AllergyPreferencesScreen from "./src/screens/registration/AllergyPreferencesScreen";
import PendingScreen          from "./src/screens/seller/PendingScreen";
import SignInScreen           from "./src/screens/auth/SignInScreen";
import SellerDashboardScreen  from "./src/screens/seller/SellerDashboardScreen";
import CharityDashboardScreen from "./src/screens/charity/CharityDashboardScreen";
import CharityInfoScreen      from "./src/screens/charity/registration/CharityInfoScreen";
import CharityDocumentScreen  from "./src/screens/charity/registration/CharityDocumentScreen";
import RejectedScreen         from "./src/screens/seller/RejectedScreen";
import StoreDetailsScreen     from "./src/screens/buyer/StoreDetailsScreen";
import ChatbotScreen          from "./src/screens/buyer/support/ChatbotScreen";
import CheckoutScreen         from "./src/screens/buyer/reserve/CheckoutScreen";
import OrderConfirmedScreen   from "./src/screens/buyer/reserve/OrderConfirmedScreen";
import CharitySelectorScreen  from "./src/screens/buyer/reserve/CharitySelectorScreen";
import DonationConfirmedScreen    from "./src/screens/buyer/reserve/DonationConfirmedScreen";
import ImpactCelebrationScreen   from "./src/screens/buyer/reserve/ImpactCelebrationScreen";
import NearMeScreen              from "./src/screens/buyer/nearMe/NearMeScreen";
import BuyerTabNavigator          from "./src/navigation/BuyerTabNavigator";
import ListingFormScreen          from "./src/screens/seller/listings/ListingFormScreen";
import ForgotPasswordScreen       from "./src/screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen        from "./src/screens/auth/ResetPasswordScreen";
import NotificationsScreen        from "./src/screens/shared/NotificationsScreen";
import QRScannerScreen            from "./src/screens/buyer/QRScannerScreen";
import SellerDonateSurplusScreen  from "./src/screens/seller/donations/SellerDonateSurplusScreen";
import SellerDonationsHistoryScreen from "./src/screens/seller/donations/SellerDonationsHistoryScreen";
import AdminRedirectScreen        from "./src/screens/admin/AdminRedirectScreen";
import AdminDashboardScreen       from "./src/screens/admin/AdminDashboardScreen";
import AdminUserDetailScreen      from "./src/screens/admin/AdminUserDetailScreen";
import KaramCheckoutScreen        from "./src/screens/buyer/karam/KaramCheckoutScreen";
import KaramSuccessScreen         from "./src/screens/buyer/karam/KaramSuccessScreen";

import { setLanguageAsync, restoreLanguage, isRTL } from "./src/i18n";
import type { Language } from "./src/i18n";
import type { UserRole } from "./src/services/shared/storage";
import type { PostLoginRoute } from "./src/screens/auth/SignInScreen";
import type { StoreDetailsParams, AllergyOption, CharityInfoFormData } from "./src/types";
import type { CheckoutParams, Order } from "./src/types/order.types";
import type { NearMeCoords } from "./src/types/nearMe";
import type { SellerListing } from "./src/services/seller/seller.service";
import type { KaramPressParams } from "./src/screens/buyer/StoreDetailsScreen";
import { Colors } from "./src/theme";
import { useAuth } from "./src/hooks/auth/useAuth";

// ── Step type ─────────────────────────────────────────────────────────────────
type AppStep =
  | "splash"
  | "language-selection"
  | "onboarding"
  | "phone-entry"
  | "otp-verification"
  | "role-selection"
  | "basic-info"
  | "role-specific"
  | "allergy-preferences"
  | "charity-info"
  | "charity-document"
  | "sign-in"
  | "under-review"
  | "rejected"
  | "buyer-home"
  | "chatbot"
  | "seller-dashboard"
  | "charity-dashboard"
  | "store-details"
  | "checkout"
  | "impact-celebration"
  | "order-confirmed"
  | "charity-selector"
  | "donation-confirmed"
  | "near-me"
  | "seller-create-listing"
  | "seller-edit-listing"
  | "forgot-password"
  | "reset-password"
  | "notifications"
  | "qr-scan"
  | "seller-donate-surplus"
  | "seller-donations-history"
  | "admin-dashboard"
  | "admin-user-detail"
  | "seller-upgrade"
  | "karam-checkout"
  | "karam-success";

interface BasicInfo { name: string; email: string; password: string }

// ── Root (provides auth context) ──────────────────────────────────────────────
export default function Index() {
  return (
    <SafeAreaProvider>
      <AppConfigProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </AppConfigProvider>
    </SafeAreaProvider>
  );
}

// ── App content (can use auth context) ────────────────────────────────────────
function AppContent() {
  const ctx = useAuthContext();

  const { register, login } = useAuth();
  const rtl = isRTL();

  const [stepHistory,    setStepHistory]    = useState<AppStep[]>(["splash"]);
  const [selectedRole,   setSelectedRole]   = useState<UserRole>(null);
  const [phone,          setPhone]          = useState("");
  const [basicInfo,      setBasicInfo]      = useState<BasicInfo>({ name: "", email: "", password: "" });
  const [language,       setCurrentLanguage] = useState<Language>("en");
  const [langRestored,   setLangRestored]   = useState(false);
  const [isRegistering,  setIsRegistering]  = useState(false);
  const [registerError,  setRegisterError]  = useState("");
  const [storeParams,       setStoreParams]       = useState<StoreDetailsParams | null>(null);
  const [charityInfoData,   setCharityInfoData]   = useState<CharityInfoFormData | null>(null);
  const [checkoutParams,    setCheckoutParams]    = useState<CheckoutParams | null>(null);
  const [confirmedOrder,    setConfirmedOrder]    = useState<Order | null>(null);
  const [donationQuantity,  setDonationQuantity]  = useState(1);
  const [donatedCharityName, setDonatedCharityName] = useState("");
  const [nearMeCoords,      setNearMeCoords]      = useState<NearMeCoords | null>(null);
  const [listingToEdit,       setListingToEdit]       = useState<SellerListing | undefined>(undefined);
  const [listingToDonate,     setListingToDonate]     = useState<SellerListing | undefined>(undefined);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [resetPhone,        setResetPhone]        = useState("");
  const [qrScanParams,      setQrScanParams]      = useState<{ orderId: string; orderTitle?: string } | null>(null);
  const [openDonationsTab,  setOpenDonationsTab]  = useState(false);
  const [adminUserId,       setAdminUserId]       = useState<string | null>(null);
  const [karamParams,       setKaramParams]       = useState<KaramPressParams | null>(null);
  const [karamSponsored,    setKaramSponsored]    = useState(0);

  const step   = stepHistory[stepHistory.length - 1];
  const goTo   = (s: AppStep) => setStepHistory(prev => [...prev, s]);
  const goBack = ()           => setStepHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  // Prevents the startup-session-restore effect from firing during fresh registration.
  // Set true before register() is called; cleared on success, error, or logout.
  const isRegistrationInProgressRef = useRef(false);

  // ── Restore language + check existing auth session on startup ──────────────
  useEffect(() => {
    (async () => {
      const saved = await restoreLanguage();
      if (saved) setCurrentLanguage(saved);
      setLangRestored(true);
    })();
  }, []);

  // When auth initializes and user is already logged in → skip to their home.
  // Guarded by isRegistrationInProgressRef: during fresh registration, register()
  // flips ctx.isAuthenticated which would otherwise trigger this effect and push
  // "under-review" before the seller has completed the multi-step form.
  useEffect(() => {
    if (ctx.isInitializing || !langRestored) return;
    if (ctx.isAuthenticated && ctx.user) {
      if (isRegistrationInProgressRef.current) return;
      const route = resolveHomeRoute(ctx.user.role, ctx.sellerStatus, ctx.charityStatus);
      goTo(route);
    }
  }, [ctx.isInitializing, ctx.isAuthenticated, langRestored]);

  // Seller view-mode switch: SELLER → buyer-home / back to seller-dashboard
  useEffect(() => {
    if (ctx.user?.role !== "SELLER") return;
    if (ctx.viewMode === "buyer" && step === "seller-dashboard") {
      goTo("buyer-home");
    } else if (ctx.viewMode === "seller" && step === "buyer-home") {
      goTo("seller-dashboard");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.viewMode]);

  // ── Push notifications: register on login, clear on logout ───────────────────
  // All calls go through pushNotifications.service.ts which guards Expo Go.
  const notifUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    void setupNotificationHandler();
  }, []);

  useEffect(() => {
    if (isExpoGo) return;

    if (!ctx.isAuthenticated) {
      void clearPushToken();
      notifUnsubRef.current?.();
      notifUnsubRef.current = null;
      return;
    }

    void (async () => {
      const token = await getFcmToken();
      if (token) await savePushToken(token);

      const unsub = await addNotificationResponseListener((response) => {
        const res = response as { notification: { request: { content: { data: Record<string, unknown> } } } };
        const type = res?.notification?.request?.content?.data?.type as string | undefined;

        if (!ctx.isAuthenticated) return;

        if (type === "SELLER_APPROVED")       goTo("seller-dashboard");
        else if (type === "SELLER_REJECTED")  goTo("rejected");
        else if (type === "CHARITY_APPROVED") goTo("charity-dashboard");
        else if (type === "ACCOUNT_BLOCKED")  goTo("buyer-home");
        else                                  goTo("notifications");
      });
      notifUnsubRef.current = unsub;
    })();

    return () => {
      notifUnsubRef.current?.();
      notifUnsubRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.isAuthenticated]);

  // ── Resolve home route from user role + status ─────────────────────────────
  const resolveHomeRoute = (
    role: string,
    sellerStatus: string | null,
    charityStatus: string | null
  ): AppStep => {
    if (role === "BUYER") return "buyer-home";
    if (role === "ADMIN") return "admin-dashboard";
    const status = role === "SELLER" ? sellerStatus : charityStatus;
    if (status === "APPROVED") return role === "SELLER" ? "seller-dashboard" : "charity-dashboard";
    if (status === "REJECTED") return "rejected";
    return "under-review";
  };

  const handlePostLogin = (route: PostLoginRoute) => {
    goTo(route as AppStep);
  };

  const handleRegisterAndProceed = async (info: BasicInfo, allergyPreferences: AllergyOption[] = []) => {
    setBasicInfo(info);
    setIsRegistering(true);
    setRegisterError("");
    isRegistrationInProgressRef.current = true;
    try {
      const apiRole = (selectedRole as string).toUpperCase() as "BUYER" | "SELLER" | "CHARITY";
      await register({
        name: info.name,
        phone,
        password: info.password,
        role: apiRole,
        email: info.email || undefined,
        allergyPreferences: allergyPreferences.length > 0 ? allergyPreferences : undefined,
      });
      setIsRegistering(false);
      goTo("role-specific");
    } catch (err: unknown) {
      isRegistrationInProgressRef.current = false;
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const status   = axiosErr.response?.status;
      const msg      = axiosErr.response?.data?.message;
      if (status === 409) {
        isRegistrationInProgressRef.current = true;
        try {
          await login(phone, info.password);
          setIsRegistering(false);
          goTo("role-specific");
        } catch {
          isRegistrationInProgressRef.current = false;
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
    isRegistrationInProgressRef.current = false;
    setStepHistory(["language-selection"]);
    setSelectedRole(null);
    setPhone("");
    setBasicInfo({ name: "", email: "", password: "" });
    setRegisterError("");
    setStoreParams(null);
    setCharityInfoData(null);
    setCheckoutParams(null);
    setConfirmedOrder(null);
    setDonationQuantity(1);
    setDonatedCharityName("");
  };

  const handleOpenCheckout = (params: CheckoutParams) => {
    setCheckoutParams(params);
    goTo("checkout");
  };

  const handleListingPress = (params: StoreDetailsParams) => {
    setStoreParams(params);
    goTo("store-details");
  };

  const handleOpenNearMe = (coords: NearMeCoords) => {
    setNearMeCoords(coords);
    goTo("near-me");
  };

  const handleOpenKaram = (params: KaramPressParams) => {
    setKaramParams(params);
    goTo("karam-checkout");
  };

  // ── Wait until both auth + language are ready before showing splash ─────────
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
    <View style={styles.root}>
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
            onComplete={(info) => {
              if (selectedRole === "buyer") {
                setBasicInfo(info);
                goTo("allergy-preferences");
              } else if (selectedRole === "charity") {
                setBasicInfo(info);
                goTo("charity-info");
              } else {
                handleRegisterAndProceed(info);
              }
            }}
          />
        )
      }

      {step === "allergy-preferences" &&
        screen(
          <AllergyPreferencesScreen
            key={language}
            onBack={goBack}
            isRegistering={isRegistering}
            registerError={registerError}
            onContinue={(allergies) => handleRegisterAndProceed(basicInfo, allergies)}
            onSkip={() => handleRegisterAndProceed(basicInfo)}
          />
        )
      }

      {step === "charity-info" &&
        screen(
          <CharityInfoScreen
            key={language}
            onBack={goBack}
            onNext={(data) => {
              setCharityInfoData(data);
              goTo("charity-document");
            }}
          />
        )
      }

      {step === "charity-document" && charityInfoData &&
        screen(
          <CharityDocumentScreen
            key={language}
            basicInfo={basicInfo}
            phone={phone}
            charityInfo={charityInfoData}
            onBack={goBack}
            onSuccess={() => goTo("charity-dashboard")}
          />
        )
      }

      {step === "role-specific" &&
        screen(
          <RoleSpecificInfoScreen
            key={`${selectedRole ?? "none"}-${language}`}
            role={selectedRole}
            phone={phone}
            name={basicInfo.name}
            email={basicInfo.email}
            password={basicInfo.password}
            onBack={goBack}
            onComplete={() => { isRegistrationInProgressRef.current = false; goTo("buyer-home"); }}
            onPending={() => { isRegistrationInProgressRef.current = false; goTo("under-review"); }}
          />
        )
      }

      {step === "seller-upgrade" &&
        screen(
          <RoleSpecificInfoScreen
            role="seller"
            onBack={goBack}
            isUpgrade
            onComplete={async () => {
              ctx.setHasSeller(true);
              await ctx.saveSession({
                user: ctx.user!,
                accessToken: ctx.accessToken!,
                sellerStatus: "APPROVED",
                hasSeller: true,
              });
              try {
                await ctx.switchRoleToken("SELLER");
              } catch { /* best-effort */ }
              goTo("seller-dashboard");
            }}
            onPending={() => {
              ctx.setHasSeller(true);
              goTo("under-review");
            }}
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
            onForgotPassword={() => goTo("forgot-password")}
          />
        )
      }

      {step === "forgot-password" &&
        screen(
          <ForgotPasswordScreen
            onBack={goBack}
            onOtpSent={(ph) => { setResetPhone(ph); goTo("reset-password"); }}
          />
        )
      }

      {step === "reset-password" &&
        screen(
          <ResetPasswordScreen
            phone={resetPhone}
            onBack={goBack}
            onSuccess={() => setStepHistory(["sign-in"])}
          />
        )
      }

      {step === "notifications" &&
        screen(<NotificationsScreen onBack={goBack} />)
      }

      {step === "qr-scan" && qrScanParams &&
        screen(
          <QRScannerScreen
            orderId={qrScanParams.orderId}
            orderTitle={qrScanParams.orderTitle}
            onBack={goBack}
            onSuccess={() => setStepHistory(["buyer-home"])}
          />
        )
      }

      {step === "buyer-home" &&
        screen(
          <BuyerTabNavigator
            onLogout={handleLogout}
            onListingPress={handleListingPress}
            onOpenChatbot={() => goTo("chatbot")}
            onOpenNearMe={handleOpenNearMe}
            onOpenNotifications={() => goTo("notifications")}
            onOpenQRScan={(params) => { setQrScanParams(params); goTo("qr-scan"); }}
            onNavigateToSellerDashboard={async () => {
              try {
                await ctx.switchRoleToken("SELLER");
                goTo("seller-dashboard");
              } catch { /* silently ignore — ProfileScreen handles UI states */ }
            }}
            onNavigateToSellerRegister={() => goTo("seller-upgrade")}
          />
        )
      }

      {step === "chatbot" &&
        screen(<ChatbotScreen onBack={goBack} />)
      }

      {step === "near-me" && nearMeCoords &&
        screen(
          <NearMeScreen
            coords={nearMeCoords}
            onBack={goBack}
            onListingPress={handleListingPress}
          />
        )
      }

      {step === "seller-dashboard" &&
        screen(
          <SellerDashboardScreen
            onLogout={handleLogout}
            refreshKey={dashboardRefreshKey}
            openDonationsTab={openDonationsTab}
            onCreateListing={() => {
              setListingToEdit(undefined);
              goTo("seller-create-listing");
            }}
            onEditListing={(listing) => {
              setListingToEdit(listing);
              goTo("seller-edit-listing");
            }}
            onDonateFromListing={(listing) => {
              setListingToDonate(listing);
              goTo("seller-donate-surplus");
            }}
          />
        )
      }

      {(step === "seller-create-listing" || step === "seller-edit-listing") &&
        screen(
          <ListingFormScreen
            existing={step === "seller-edit-listing" ? listingToEdit : undefined}
            onBack={goBack}
            onComplete={() => {
              setDashboardRefreshKey(k => k + 1);
              goBack();
            }}
          />
        )
      }

      {step === "seller-donate-surplus" && listingToDonate &&
        screen(
          <SellerDonateSurplusScreen
            listing={listingToDonate}
            onBack={goBack}
            onComplete={(charityName) => {
              setOpenDonationsTab(true);
              goBack();
              setTimeout(() => setOpenDonationsTab(false), 500);
            }}
          />
        )
      }

      {step === "seller-donations-history" &&
        screen(<SellerDonationsHistoryScreen onBack={goBack} />)
      }

      {step === "charity-dashboard" &&
        screen(<CharityDashboardScreen onLogout={handleLogout} />)
      }

      {step === "admin-dashboard" &&
        screen(<AdminRedirectScreen onLogout={handleLogout} />)
      }

      {step === "admin-user-detail" && adminUserId &&
        screen(<AdminUserDetailScreen userId={adminUserId} onBack={goBack} />)
      }

      {step === "under-review" &&
        screen(<PendingScreen role={selectedRole ?? ctx.user?.role?.toLowerCase() ?? "seller"} onLogout={handleLogout} onGoToSignIn={() => goTo("sign-in")} onApproved={() => goTo("seller-dashboard")} />)
      }

      {step === "rejected" &&
        screen(<RejectedScreen role={ctx.user?.role?.toLowerCase()} onLogout={handleLogout} />)
      }

      {step === "store-details" && storeParams &&
        screen(
          <StoreDetailsScreen
            listingId={storeParams.listingId}
            sellerId={storeParams.sellerId}
            onBack={goBack}
            onCheckout={handleOpenCheckout}
            onKaramPress={handleOpenKaram}
            karamRefreshKey={karamSponsored}
          />
        )
      }

      {step === "karam-checkout" && karamParams &&
        screen(
          <KaramCheckoutScreen
            sellerId={karamParams.sellerId}
            listingId={karamParams.listingId}
            sellerName={karamParams.sellerName}
            onBack={goBack}
            onSuccess={() => goTo("karam-success")}
            onSponsored={() => setKaramSponsored(n => n + 1)}
          />
        )
      }

      {step === "karam-success" && karamParams &&
        screen(
          <KaramSuccessScreen
            sellerName={karamParams.sellerName}
            onDone={() => setStepHistory(prev => prev.slice(0, prev.findIndex(s => s === "karam-checkout")))}
          />
        )
      }

      {step === "checkout" && checkoutParams &&
        screen(
          <CheckoutScreen
            params={checkoutParams}
            onBack={goBack}
            onReserved={(order) => {
              setConfirmedOrder(order);
              goTo("impact-celebration");
            }}
            onOpenChatbot={() => goTo("chatbot")}
          />
        )
      }

      {step === "impact-celebration" && confirmedOrder && checkoutParams &&
        screen(
          <ImpactCelebrationScreen
            co2SavedKg={checkoutParams.estimatedCo2SavedKg ?? 0.5}
            moneySaved={checkoutParams.originalPrice - checkoutParams.discountedPrice}
            pointsEarned={Math.round(checkoutParams.discountedPrice)}
            isDonation={confirmedOrder.type === "DONATION"}
            newBadge={null}
            onViewDetails={() =>
              goTo(confirmedOrder.type === "DONATION" ? "donation-confirmed" : "order-confirmed")
            }
            onGoHome={() => setStepHistory(["buyer-home"])}
          />
        )
      }

      {step === "order-confirmed" && confirmedOrder && checkoutParams &&
        screen(
          <OrderConfirmedScreen
            order={confirmedOrder}
            params={checkoutParams}
            onGoHome={() => setStepHistory(["buyer-home"])}
          />
        )
      }

      {step === "charity-selector" && checkoutParams &&
        screen(
          <CharitySelectorScreen
            checkoutParams={checkoutParams}
            quantity={donationQuantity}
            onBack={goBack}
            onDonated={(charityName, order) => {
              setDonatedCharityName(charityName);
              setConfirmedOrder(order);
              goTo("impact-celebration");
            }}
          />
        )
      }

      {step === "donation-confirmed" && checkoutParams && confirmedOrder &&
        screen(
          <DonationConfirmedScreen
            charityName={donatedCharityName}
            checkoutParams={checkoutParams}
            quantity={donationQuantity}
            order={confirmedOrder}
            onGoHome={() => setStepHistory(["buyer-home"])}
          />
        )
      }

    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  screen: { flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});