// BuyerTabNavigator — custom 5-tab bottom navigation for the buyer flow

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import HomeScreen from "../screens/buyer/HomeScreen";
import BrowseScreen from "../features/browse/BrowseScreen";
import { FavoritesScreen } from "../features/favorites";
import OrdersScreen from "../screens/buyer/OrdersScreen";
import ProfileScreen from "../screens/buyer/ProfileScreen";
import { FavoritesProvider, useFavoritesContext } from "../context/shared/FavoritesContext";

import { Colors } from "../theme";
import { isRTL } from "../i18n";

import type { StoreDetailsParams } from "../types";
import type { NearMeCoords } from "../types/nearMe";

// ─── Types ────────────────────────────────────────────────────────────────────

type BuyerTab = "home" | "browse" | "favorites" | "orders" | "profile";

interface TabConfig {
  key: BuyerTab;
  icon: string;
  labelEn: string;
  labelAr: string;
}

export interface BuyerTabNavigatorProps {
  onLogout?: () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
  onOpenChatbot?: () => void;
  onOpenNearMe?: (coords: NearMeCoords) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  { key: "home",      icon: "home",         labelEn: "Home",      labelAr: "الرئيسية" },
  { key: "browse",    icon: "compass",      labelEn: "Browse",    labelAr: "تصفح"     },
  { key: "favorites", icon: "heart",        labelEn: "Favorites", labelAr: "المفضلة"  },
  { key: "orders",    icon: "shopping-bag", labelEn: "Orders",    labelAr: "طلباتي"   },
  { key: "profile",   icon: "user",         labelEn: "Profile",   labelAr: "حسابي"    },
] as const;

const TAB_BAR_HEIGHT = 56 as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuyerTabNavigator(props: BuyerTabNavigatorProps) {
  return (
    <FavoritesProvider>
      <BuyerTabContent {...props} />
    </FavoritesProvider>
  );
}

// ─── Inner content — has access to FavoritesContext ───────────────────────────

function BuyerTabContent({ onLogout, onListingPress, onOpenChatbot, onOpenNearMe }: BuyerTabNavigatorProps) {
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 16 : insets.bottom;
  const rtl = isRTL();

  const [activeTab, setActiveTab] = useState<BuyerTab>("home");

  const { toastMessage } = useFavoritesContext();

  const goToBrowse     = useCallback(() => setActiveTab("browse"), []);
  const handleTabPress = useCallback((key: BuyerTab) => setActiveTab(key), []);

  const renderScreen = (): React.ReactNode => {
    switch (activeTab) {
      case "home":
        return (
          <HomeScreen
            onLogout={onLogout}
            onListingPress={onListingPress}
            onSearchPress={goToBrowse}
            onOpenNearMe={onOpenNearMe}
          />
        );
      case "browse":
        return <BrowseScreen onListingPress={onListingPress} />;
      case "favorites":
        return (
          <FavoritesScreen
            onBrowse={goToBrowse}
            onListingPress={onListingPress}
          />
        );
      case "orders":
        return <OrdersScreen />;
      case "profile":
        return <ProfileScreen onLogout={onLogout} onOpenChatbot={onOpenChatbot} />;
    }
  };

  return (
    <View style={styles.root}>

      {/* ── Screen content ── */}
      <View style={styles.screenArea}>
        {renderScreen()}
      </View>

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { borderTopColor: Colors.grayLight }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const label = rtl ? tab.labelAr : tab.labelEn;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => handleTabPress(tab.key)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: isActive }}
            >
              {isActive && <View style={styles.activeIndicator} />}

              <Feather
                name={tab.icon as "home"}
                size={22}
                color={isActive ? Colors.primaryOrange : Colors.grayMedium}
              />

              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Safe-area spacer ── */}
      <View style={[styles.safeAreaSpacer, { height: botPad }]} />

      {/* ── Global toast (shown on any tab when favorites API succeeds/fails) ── */}
      {toastMessage !== null && (
        <View style={styles.toast} pointerEvents="none">
          <Feather name="check-circle" size={16} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  screenArea: {
    flex: 1,
  },

  tabBar: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 14,
  },

  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 6,
    position: "relative",
  },

  activeIndicator: {
    position: "absolute",
    top: 0,
    width: "60%",
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primaryOrange,
  },

  tabLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  tabLabelActive: {
    fontWeight: "700",
    color: Colors.primaryOrange,
  },
  tabLabelInactive: {
    fontWeight: "400",
    color: Colors.grayMedium,
  },

  safeAreaSpacer: {
    backgroundColor: Colors.white,
  },

  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.greenMain,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: "600", color: Colors.white },
});
