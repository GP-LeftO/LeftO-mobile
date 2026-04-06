import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import RoleSelectionScreen from "./src/screens/RoleSelectionScreen";
import GetStartedScreen from "./src/screens/GetStartedScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import SignInScreen from "./src/screens/SignInScreen";
import type { UserRole } from "./src/services/storage";

type AppStep = "splash" | "onboarding" | "role-selection" | "get-started" | "sign-up" | "sign-in" | "app";

export default function App() {
  const [step, setStep] = useState<AppStep>("splash");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        {step === "splash" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)}>
            <SplashScreen onComplete={() => setStep("onboarding")} />
          </Animated.View>
        )}
        {step === "onboarding" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
            <OnboardingScreen onComplete={() => setStep("role-selection")} />
          </Animated.View>
        )}
        {step === "role-selection" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
            <RoleSelectionScreen onComplete={(role) => { setSelectedRole(role); setStep("get-started"); }} />
          </Animated.View>
        )}
        {step === "get-started" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
            <GetStartedScreen role={selectedRole} onCreateAccount={() => setStep("sign-up")} onSignIn={() => setStep("sign-in")} />
          </Animated.View>
        )}
        {step === "sign-up" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
            <SignUpScreen role={selectedRole} onSignUp={() => setStep("app")} onGoToSignIn={() => setStep("sign-in")} />
          </Animated.View>
        )}
        {step === "sign-in" && (
          <Animated.View style={styles.screen} entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)}>
            <SignInScreen onSignIn={() => setStep("app")} onGoToSignUp={() => setStep("sign-up")} />
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  screen: { flex: 1, position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});