# PR: feat(buyer) — Sprint 5 Ghayda Features

**Branch:** `ghaydaa_features` → `main`

Sprint 5 buyer-side features: dynamic pricing, rescue badges, Ramadan mode, monthly winner banner, impact certificate PDF, listing report system, karam service layer, seller review replies, favorites bell, share/directions, load more reviews, cancellation block banners, and dual-role buyer→seller UI.

---

## Features & How to Test

### 1. Dynamic Pricing Display (🔥 decay indicator)
**File:** `src/components/buyer/ListingCard.tsx`

Login as buyer `0591111111 / Buyer123!`. Open any listing card.
- All prices now show `currentPrice` (not `discountedPrice`)
- If a listing has `isPriceDecaying: true` → shows 🔥 icon + floor price + countdown timer
- Strikethrough on `originalPrice`, live price in orange
- Price recalculates every 60 seconds automatically

---

### 2. Rescue Now Section + Monthly Winner Banner
**File:** `src/screens/buyer/HomeScreen.tsx`

Login as buyer → Home screen.
- **Top banner (gold):** "🏆 بائع الشهر" — only shows when `GET /api/stats/monthly-winner` returns a winner. Tap "زيارة المتجر" → navigates to that seller's store.
- **"أنقذها الآن ⚡" section:** horizontal scroll of listings where `rescueBadge !== null`. Red badges for "Last chance / Last one", orange for "Expiring soon / Almost gone".
- If no expiring listings → section hidden entirely.

---

### 3. Ramadan UI Mode
**File:** `src/screens/buyer/HomeScreen.tsx` + `src/context/AppConfigContext.tsx`

> **Requires Tala to wrap `App.tsx` with `<AppConfigProvider>`.** The file `src/context/AppConfigContext.tsx` is ready — just add 2 lines:
> ```tsx
> import { AppConfigProvider } from "./src/context/AppConfigContext";
> // wrap around <AuthProvider>:
> <AppConfigProvider><AuthProvider>...</AuthProvider></AppConfigProvider>
> ```

To test: call `PATCH /api/app/config` as admin (`0598262751 / Admin123!`) with body `{ "isRamadanSeason": true }`.
- Green banner appears at top of HomeScreen: "🌙 رمضان كريم — ابحث عن وجبات الإفطار"
- When `isIftarWindow: true` → banner upgrades to iftar-specific text
- When `maghribTime` is set → countdown row shows below banner, updates every minute
- Toggle `isRamadanSeason: false` → banner disappears

---

### 4. Karam Home Section
**File:** `src/screens/buyer/HomeScreen.tsx` + `src/services/shared/community.service.ts`

Login as buyer → Home screen. Scroll down past Rescue Now.
- "برنامج كرم 💚" section shows seller cards with available Karam meal counts
- Each card shows store name, available count in green, distance
- Tap card → navigates to StoreDetailsScreen for that seller
- Section hidden if no Karam sellers are nearby

---

### 5. AI Seller Performance Score (public)
**File:** `src/screens/buyer/StoreDetailsScreen.tsx`

Login as buyer → tap any listing → StoreDetailsScreen.
- Card shows below seller description: "أداء البائع" with score/100
- Progress bar: green ≥70, orange 40–69, red <40
- 💪 green rows and ⚠️ orange rows from `weeklyInsight`
- If fetch fails → card hidden silently

---

### 6. Listing Report / Flag System (buyer side)
**File:** `src/screens/buyer/StoreDetailsScreen.tsx` + `src/components/buyer/ListingCard.tsx`

Login as buyer → open any store detail.
- Flag icon (🚩) in top-right header buttons
- Tap → bottom sheet with 5 reason options (طعام فاسد / وصف خاطئ / سعر خاطئ / محتوى غير لائق / سبب آخر) + optional details field
- Submit → `POST /api/reports/listings/:listingId` → toast "شكراً، سيراجع فريقنا البلاغ" → flag icon disappears
- Report same listing twice → alert "لقد أبلغت عن هذا العرض مسبقاً" (409)

---

### 7. Share + Get Directions
**File:** `src/screens/buyer/StoreDetailsScreen.tsx`

Login as buyer → open any store detail.
- **Share:** tap share icon (↗) in header → native share sheet with listing name + price + "حجز عبر LeftO 🇵🇸"
- **Directions:** scroll to map → tap "احصل على الاتجاهات" → opens Google Maps / Apple Maps centered on store
  - Only shows if seller has real coordinates (not 0,0)

---

### 8. Seller Review Reply Display
**File:** `src/components/buyer/profile/ReviewCard.tsx`

Login as buyer → open any store detail → scroll to reviews.
- If a review has `sellerReply` → gray indented box appears below the review text
- Label "💬 رد صاحب المحل:" in bold orange
- Reply text + date shown
- Test with seller `0551234567 / Seller123!` — reply to a review via API then reload

---

### 9. Load More Reviews
**File:** `src/screens/buyer/StoreDetailsScreen.tsx` + `src/hooks/buyer/useSellerReviews.ts`

Open any store with >10 reviews.
- "تحميل المزيد" button appears below the review list
- Tap → loads next page and appends reviews
- Button disappears when all reviews are loaded

---

### 10. SPECIFIC_PARCEL Expiry Date on Listing Cards
**File:** `src/components/buyer/ListingCard.tsx`

Find a `SPECIFIC_PARCEL` listing with an `expiryDate`.
- Shows "📅 ينتهي: {day month}" below the pickup window
- If expiry is within 2 days → date shown in red
- `MEAL_BAG` listings → no expiry date shown

---

### 11. Impact Certificate PDF Download
**File:** `src/screens/buyer/ProfileScreen.tsx` + `src/services/buyer/impact.service.ts`

Login as buyer → Profile → scroll to "📄 شهادة الأثر البيئي".
- Horizontal month picker (last 12 months, default = last month)
- Tap "تحميل ومشاركة" → spinner → native share sheet opens with PDF
- Test month: `2026-05`
- API: `GET /api/users/me/impact-certificate?month=2026-05`

---

### 12. Favorites Bell Toggle (persistent)
**File:** `src/features/favorites/screens/FavoritesScreen.tsx`

Login as buyer → Favorites tab.
- Bell icon in header → toggles notification preference
- Persists to `AsyncStorage` key `@favorites_notify`
- Survives app restart (re-open → bell stays in last state)

---

### 13. Cancellation Block Banners
**File:** `src/screens/buyer/ProfileScreen.tsx`

Login as buyer → Profile screen. Uses `isBlocked` and `cancellationCount` from `GET /api/users/me`.
- `cancellationCount >= 3 && !isBlocked` → yellow warning row: "⚠️ تنبيه: X إلغاءات — الحد الأقصى 5 قبل التعليق"
- `isBlocked === true` → red banner at very top: "🚫 حسابك موقوف مؤقتاً"
- `cancellationCount < 3` → nothing shown
- To test: use admin API to set `cancellationCount` or `isBlocked` on the buyer account

---

### 14. Dual Role: Buyer → Seller UI
**File:** `src/screens/buyer/ProfileScreen.tsx`

> **Requires `sellerStatus` from `useAuth()` — Tala's AuthContext already stores this. Confirm `ctx.sellerStatus` is populated on login.**

Login as buyer `0591111111 / Buyer123!` → Profile → Settings section.
- `sellerStatus === null` → "أصبح بائعاً" pressable row (briefcase icon)
- `sellerStatus === 'PENDING'` → "طلب التسجيل كبائع قيد المراجعة" (orange, clock icon)
- `sellerStatus === 'REJECTED'` → "تم رفض طلبك — تواصل مع الإدارة" (red, x-circle icon)
- `sellerStatus === 'APPROVED'` → "لوحة التاجر 🏪" pressable row → navigates to seller dashboard

---

### 15. Shareable Impact Card (after reservation)
**File:** `src/screens/buyer/reserve/ImpactCelebrationScreen.tsx`

Login as buyer → reserve a listing → mark as received → impact celebration screen fires.
- Green "شارك تأثيرك 🌱" button at bottom
- Tap → native share sheet with CO2 saved in grams/kg + km equivalent + `#LeftO #فلسطين`

---

## Coordination Needed from Tala

### 1. `AppConfigProvider` in `App.tsx` (required for Ramadan mode)
```tsx
import { AppConfigProvider } from "./src/context/AppConfigContext";

// In Index():
<AppConfigProvider>
  <AuthProvider>
    <AppContent />
  </AuthProvider>
</AppConfigProvider>
```

### 2. `StripeProvider` in `App.tsx` (required for Karam payment)
```tsx
import { StripeProvider } from "@stripe/stripe-react-native";

// Wrap the whole app:
<StripeProvider publishableKey="pk_test_...">
  ...
</StripeProvider>
```
Get the publishable key from backend Stripe dashboard → Developers → API Keys. **Never use the secret key.**

### 3. `sellerStatus` in AuthContext
Confirm `ctx.sellerStatus` is populated on login and on cold-start restore. The dual-role UI in ProfileScreen reads it via `useAuth()`.

---

## Demo Credentials
```
Admin:   0598262751 / Admin123!
Buyer:   0591111111 / Buyer123!
Seller:  0551234567 / Seller123!
```

---

## Sprint 5 — Part 2 Features

### NEW-G5 — Karam Stripe Payment on StoreDetailsScreen
**Files:** `src/screens/buyer/StoreDetailsScreen.tsx`

Login as buyer → open a Karam seller store (e.g. `0551234567`).
- Green "كرم" card appears below seller info: shows available/funded/claimed meal counts
- Tap "ادعم وجبة 💚" → Stripe payment sheet opens
- On success: card shows "✅ شكراً! دعمت وجبة مجانية 💚" + balance refreshes
- **Requires Tala:** `<StripeProvider publishableKey="pk_test_...">` in App.tsx

---

### T6 — Chatbot Voice Input
**Files:** `src/screens/buyer/support/ChatbotScreen.tsx`, `src/hooks/buyer/support/useChatbot.ts`

Login as buyer → open Chatbot (5th tab or from Home).
- Mic button (left of send) in input bar
- Tap mic → permission prompt (first time) → recording starts, button turns red with stop icon
- Tap stop → audio sent to `POST /api/chatbot/voice` → transcript appears as your message, bot reply appears
- Requires `expo-av` (already installed)

---

### T7 — Seller Waste Analytics Screen
**Files:** `src/screens/seller/analytics/SellerAnalyticsScreen.tsx`, `src/hooks/seller/useSellerAnalytics.ts`

Login as seller → (Tala must add "تحليلات" button in SellerDashboardScreen → navigates here with `onBack` prop).
- 2×2 stats grid: revenue, items sold, CO₂ saved, active listings
- Animated sell-through gauge bar (green ≥70%, orange 40–69%, red <40%)
- Peak hours horizontal bar chart — top hour in orange
- Top listing card + AI-generated insight text

---

### T8 + NEW-G6 + NEW-G7 — Admin Web Panel
**Location:** `admin/` folder (separate React+Vite app)

```
cd admin
npm install
npm run dev   →   http://localhost:3001
```

Login with admin credentials `0598262751 / Admin123!`.
- **Dashboard:** stats grid, line chart, Ramadan/Donation toggles, best-rated cards
- **Sellers/Charities:** approve or reject pending applications with optional reason
- **Users:** search + filter by role/blocked status, unblock, delete
- **Reports (NEW-G7):** view flagged listings across Pending/Reviewed/Dismissed tabs, dismiss or remove a listing

---

### T9 + T19 — Impact Detail Pages
**Files:** `src/screens/buyer/impact/Co2ImpactScreen.tsx`, `MoneySavedScreen.tsx`, `DonationsImpactScreen.tsx`

Login as buyer → Profile tab → tap any stat card in the impact grid.
- **CO₂ card** → CO₂ screen: hero value, km-equivalent pill, animated badge milestones (0.1 / 10 / 50 / 100 kg)
- **Money card** → savings screen: total saved, original vs paid per order, monthly breakdown list
- **Donations card** → donations screen: milestone track (0→5→10→25→50) with progress bar
- Points card is intentionally non-tappable

---

### T10 — Charity Directory + Public Profile
**Files:** `src/screens/buyer/charity/CharityDirectoryScreen.tsx`, `CharityPublicProfileScreen.tsx`

Login as buyer → Profile tab → expand settings → tap **"دليل الجمعيات المعتمدة"** (green heart icon).
- List of charities with TrustBadge (green = ≥80, orange = ≥60, gray = new)
- Search by name or region
- Tap any charity → public profile: trust score breakdown bars, stats (total donations, confirmed, avg rating), address

---

### T12 — Community Leaderboard
**Files:** `src/screens/buyer/stats/LeaderboardScreen.tsx`

Login as buyer → Profile tab → expand settings → tap **"لوحة المتصدرين 🏆"** (orange award icon).
- **المشترون tab:** buyers ranked by CO₂ saved — top 3 get 🥇🥈🥉, current user row highlighted in orange
- **البائعون tab:** sellers ranked by meals rescued + rating
- Pull to refresh; badge emoji legend at bottom

---

### T13 — Neighborhood Heatmap on Browse Map
**Files:** `src/features/browse/BrowseScreen.tsx`, `src/features/browse/components/LeafletBrowseMap.tsx`

Login as buyer → Browse tab → tap the **Map** toggle.
- Semi-transparent orange circles appear on the map over seller locations
- Larger circle = more active listings at that location (radius = `20 + activeListings × 8` px)
- Tap a circle → popup shows seller name + "X إدراجات نشطة"
- Seller emoji pins still show on top of the circles

---

### T20 — Chatbot Topic Chips + Rating Prompt
**Files:** `src/screens/buyer/support/ChatbotScreen.tsx`, `src/hooks/buyer/support/useChatbot.ts`

Login as buyer → Chatbot.
- 5 chip buttons below header when chat is empty: "كيف أحجز وجبة؟", "كيف تعمل آلية الاستلام؟", "كيف أتبرع لجمعية؟", "ما هو برنامج الكرم؟", "كيف أتواصل مع المحل؟"
- Tap a chip → sends as a message, chips hide
- After first bot reply → **"قيّم ⭐"** pill appears in header top-right
- Tap it → bottom sheet with 5 star buttons → tap any star → "شكراً 😊" shown, saved to AsyncStorage

---

### T21 — Buyer Notification Settings
**Files:** `src/screens/buyer/ProfileScreen.tsx`, `src/hooks/buyer/useNotificationSettings.ts`

Login as buyer → Profile tab → expand settings → tap **"إعدادات الإشعارات"**.
- 6 toggles with emoji icons: orders 📦, favorites ⭐, new listings 🔔, karam 🤝, promos 🎁, daily reminder 📱
- Toggle "التذكير اليومي" ON → 7-day chip picker appears (الأحد → السبت)
- Tap chips to select/deselect reminder days
- All selections persist across app restarts (AsyncStorage `@lefto_notification_settings`)

---

## Coordination Needed from Tala (Part 2)

| Item | What's needed |
|------|---------------|
| Karam Stripe | `<StripeProvider publishableKey="pk_test_...">` wrapping App root |
| Seller Analytics | "تحليلات" button in SellerDashboardScreen → navigate to `SellerAnalyticsScreen` (pass `onBack` prop) |
