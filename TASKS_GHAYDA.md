# LeftO — Ghayda's Task List
> All tasks for Ghayda (D1 — Backend Engineer helping Frontend)
> Written for Claude — every task is self-contained with full context.
> Last updated: June 4, 2026

---

## ⚠️ Coordination Note with Tala

Tala is working in parallel on seller and charity screens. You will **never edit the same file**.

**Files Tala owns — do not touch:**
- `src/screens/seller/*` (all seller screens)
- `src/screens/charity/*` (all charity screens)
- `src/screens/auth/*` (all auth screens)
- `src/screens/buyer/reserve/CheckoutScreen.tsx`
- `src/screens/buyer/reserve/CharitySelectorScreen.tsx`
- `src/screens/buyer/reserve/DonationConfirmedScreen.tsx`
- `src/context/AuthContext.tsx`
- `src/navigation/BuyerTabNavigator.tsx`
- `App.tsx` (she owns all App.tsx changes — tell her what step names you need if any)

**Files you own — Tala will not touch:**
- `src/screens/buyer/HomeScreen.tsx`
- `src/screens/buyer/StoreDetailsScreen.tsx`
- `src/screens/buyer/ProfileScreen.tsx`
- `src/screens/buyer/support/ChatbotScreen.tsx`
- `src/screens/buyer/nearMe/NearMeScreen.tsx`
- `src/features/browse/BrowseScreen.tsx`
- `src/screens/buyer/reserve/ImpactCelebrationScreen.tsx`
- `src/features/favorites/screens/FavoritesScreen.tsx`
- `src/components/buyer/ListingCard.tsx`
- `src/components/buyer/profile/ReviewCard.tsx`
- Any new screens you create

**One coordination point:** You will create `src/context/AppConfigContext.tsx`. Tell Tala when it's ready — she will add 2 lines to `App.tsx` to wrap it.

**Your new screens can be modals/sheets from existing screens — no App.tsx changes needed from your side.**

---

## Project Context

**What is LeftO?** A food rescue mobile app for Palestine. Connects buyers with surplus food from local Nablus stores at discounted prices, enables community giving through the Karam pay-it-forward system, and routes food donations to verified charities.

**Stack:**
- React Native 0.83.6 + Expo 55 (Managed workflow)
- TypeScript 5.9
- Custom state-machine router in `App.tsx` — no React Navigation at the root
- Buyer home uses `BuyerTabNavigator.tsx` (5 bottom tabs: Home, Browse, Favorites, Orders, Profile)
- HTTP: Axios instance at `src/services/shared/api.ts` — **already handles Bearer token automatically**. Just do: `import api from '../../services/shared/api'` and call `api.get(...)`, `api.post(...)` etc. Never pass auth headers manually.
- AsyncStorage for persistence
- i18n: `src/i18n/index.ts` with Arabic (RTL) and English (LTR)

**Backend URL:** `https://lefto-backend-production.up.railway.app`

**MVVM pattern — always follow this structure:**
```
// 1. Service: raw API call, no state
// src/services/buyer/someFeature.service.ts
import api from '../shared/api';
export const getSomething = (params) => api.get('/api/something', { params });
export const doSomething = (body) => api.post('/api/something', body);

// 2. Hook: state management, calls service
// src/hooks/buyer/useSomething.ts
import { useState, useEffect } from 'react';
import { getSomething } from '../../services/buyer/someFeature.service';
export const useSomething = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const load = async () => {
    setLoading(true);
    try {
      const res = await getSomething();
      setData(res.data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);
  return { data, loading, error, refresh: load };
};

// 3. Screen: only renders UI
// src/screens/buyer/SomeScreen.tsx
const SomeScreen = ({ onBack }) => {
  const { data, loading } = useSomething();
  return (
    <View>
      {loading ? <ActivityIndicator /> : <Text>{data?.name}</Text>}
    </View>
  );
};
```

**API response shape — always:**
```ts
// Axios wraps response in res.data
// Our API wraps data in .data
// So: res.data.data is your actual payload
// res.data.data.pagination for paginated responses

const res = await api.get('/api/something');
const item = res.data.data;          // single item
const items = res.data.data.items;   // paginated list
const pagination = res.data.data.pagination; // { page, limit, total, totalPages }
```

**RTL — required on every new screen:**
```ts
import { isRTL } from '../../i18n';  // adjust path depth

// Use in StyleSheet.create:
row: { flexDirection: isRTL() ? 'row-reverse' : 'row' },
text: { textAlign: isRTL() ? 'right' : 'left' },
rightAligned: { alignItems: isRTL() ? 'flex-start' : 'flex-end' },
```

**Design tokens (from `src/theme/index.ts`):**
```ts
// Colors:
primary:      '#DE985A'   // warm orange — main CTAs
primaryLight: '#FFE8D6'   // orange background
green:        '#16A34A'   // positive, impact, donation
greenLight:   '#D1FAE5'   // green background
background:   '#FAFAF8'   // screen background
textDark:     '#404040'   // primary text
textMedium:   '#9CA3AF'   // secondary text, labels
white:        '#FFFFFF'
error:        '#EF4444'   // red
warning:      '#F59E0B'   // amber/warning

// Spacing: 4, 8, 16, 24, 32, 48
// Font: Nunito (already loaded via expo-google-fonts)
// Icons: Feather icons from @expo/vector-icons — <Feather name="..." size={...} color={...} />
```

**Navigation — how to open new screens:**
Since App.tsx is owned by Tala and your screens must not conflict:
- Use `Modal` from React Native for overlay screens
- Use bottom sheets (react-native-modal or custom) for partial screens
- Use React Navigation stack inside a feature if needed
- For screens that fit in a tab: show as a new tab view within the existing tab (e.g., inside Profile or Browse)
- If you absolutely need a new App.tsx step, tell Tala what string to add and she adds it

**Important architecture decisions:**
- Buyer donation orders (`type: "DONATION"`) are **DEPRECATED** — backend returns 410. Never send this type.
- `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG` listing types are **REMOVED** — backend rejects them.
- **Karam system** is the community giving feature — pay-it-forward pools at seller level.
- **Charity registration** is always PENDING after signup — no auto-approval.

**Demo credentials (use for testing):**
```
Admin:           0598262751 / Admin123!
Buyer (يوسف):    0591111111 / Buyer123!
Buyer (مريم):    0592222222 / Buyer123!
Seller (Karam):  0551234567 / Seller123!
Charity:         0597777777 / Charity123!
```

---

## Task List — Priority Order

---

### TASK 1 — App Config Context (Required First) 🔴

**What:** Create a global context that reads `GET /api/app/config` on app launch and exposes `isRamadanSeason`, `isIftarWindow`, and `maghribTime` to all screens.

**Why:** Every Ramadan feature and the iftar countdown depend on this. Nothing Ramadan-related works until this is in place.

**API:**
```
GET  /api/app/config   Public (no auth needed)
Response:
{
  isRamadanSeason: boolean,
  isIftarWindow: boolean,
  maghribTime: string | null  // ISO string for today's Maghrib, e.g. "2026-06-04T18:42:00.000Z"
}
```

**File to create:**
```
src/context/AppConfigContext.tsx
```

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/shared/api';

interface AppConfig {
  isRamadanSeason: boolean;
  isIftarWindow: boolean;
  maghribTime: string | null;
}

const AppConfigContext = createContext<AppConfig>({
  isRamadanSeason: false,
  isIftarWindow: false,
  maghribTime: null,
});

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>({
    isRamadanSeason: false,
    isIftarWindow: false,
    maghribTime: null,
  });

  useEffect(() => {
    api.get('/api/app/config')
      .then(res => setConfig(res.data.data))
      .catch(() => {}); // fail silently — defaults to false
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => useContext(AppConfigContext);
```

**After creating this file:** Tell Tala it's ready. She adds `<AppConfigProvider>` wrapper to `App.tsx`.

**Done when:** `useAppConfig()` returns live config values in any screen. If backend is unreachable, defaults to `{ isRamadanSeason: false, isIftarWindow: false, maghribTime: null }`.

---

### TASK 2 — Karam Buyer UI on Store Detail 🔴

**What:** When a buyer views a store that participates in Karam (`seller.participatesInKaram === true`), show a "تبرع لكرم" button on the store details page with the current balance and a sponsor action.

**What is Karam:** Palestinian pay-it-forward concept. A restaurant has a running pool of sponsored meals. Any walk-in customer who needs a free meal can claim one face-to-face. Buyers remotely fund the pool via this button.

**API:**
```
GET  /api/sellers/:sellerId/karam   Public (no auth)
Response: { sponsored: 7, claimed: 4, available: 3 }

POST /api/sellers/:sellerId/karam/sponsor   Auth: Bearer (BUYER)
(No body)
Response: { sponsored: 8, claimed: 4, available: 4 }
Errors:
  400 "This seller is not participating in the Karam program" → hide button on this error
```

**File to modify:**
```
src/screens/buyer/StoreDetailsScreen.tsx
```

**What to add to StoreDetailsScreen:**

Check if `listing.seller.participatesInKaram === true`. If yes, show a Karam card below the main listing info:

```
┌────────────────────────────────────────────────┐
│  🤝 كرم — تبرع لمن يحتاج                        │
│  الوجبات المتاحة اليوم: 3                        │
│  ممولة: 7  |  مُستلمة: 4                         │
│  [  تبرع بوجبة — مجاناً  ]  ← orange button     │
└────────────────────────────────────────────────┘
```

- Card background: `#D1FAE5` (greenLight)
- Card border: 1px solid `#16A34A`
- "تبرع بوجبة" button: green `#16A34A`
- On tap: call `POST /api/sellers/:sellerId/karam/sponsor` → update balance inline (optimistic update) → show toast "شكراً! ساعدت في تمويل وجبة لمحتاج 💚"
- Load the current balance on screen mount via `GET /api/sellers/:sellerId/karam`
- Show loading spinner while the balance loads
- If `available === 0`: dim the button slightly but keep it tappable (more sponsorships always welcome)

**New service + hook:**
```
src/services/buyer/karam.service.ts
src/hooks/buyer/useKaram.ts
```

`karam.service.ts`:
```ts
import api from '../shared/api';
export const getKaramBalance = (sellerId: string) =>
  api.get(`/api/sellers/${sellerId}/karam`);
export const sponsorMeal = (sellerId: string) =>
  api.post(`/api/sellers/${sellerId}/karam/sponsor`);
```

`useKaram.ts`:
```ts
// State: balance { sponsored, claimed, available }, loading, sponsoring
// Functions: loadBalance(sellerId), sponsor(sellerId) → updates balance optimistically
```

**RTL:** Card text right-aligned, icon on the right side.

**Done when:** Karam card appears on store detail for participating sellers. Buyer can tap and sponsor a meal. Balance updates live.

---

### TASK 3 — Rescue Score Display on Listing Cards 🟡

**What:** The backend already returns `rescueBadge` on every listing from the recommendations endpoint. Display it as an urgency chip on listing cards, and add a "Rescue Now" section to the home screen.

**API — the recommendations endpoint already returns:**
```
GET  /api/listings/recommended?lat=&lng=   Auth: Bearer (BUYER)
Response: [{
  id, title, type, category, quantity, originalPrice, discountedPrice,
  pickupStart, pickupEnd, freshnessBadge, photoUrl, allergenNote,
  rescueScore: number,       // ← NEW: urgency score 0-75+
  rescueBadge: string | null // ← NEW: "🔴 Last chance" | "🟠 Expiring soon" | "🔴 Last one" | "🟠 Almost gone" | null
  seller: { ... }
}]
```

**Files to modify:**
```
src/components/buyer/ListingCard.tsx   ← add rescueBadge display
src/screens/buyer/HomeScreen.tsx       ← add "Rescue Now" section
```

**ListingCard changes:**
- Add an optional `rescueBadge?: string | null` prop
- If `rescueBadge` is not null, show a small colored pill badge overlaid on the listing card image (top-left corner):
  - Badges containing "Last" → red background `#EF4444`, white text
  - Badges containing "soon" or "Almost" → orange background `#DE985A`, white text
- Badge text: show the badge string directly (it's already formatted)
- If `rescueBadge` is null → show nothing extra

**HomeScreen changes:**
- Fetch from `GET /api/listings/recommended?lat=&lng=` (already done, just use the new fields)
- Add a new section ABOVE the existing sections: "أنقذها الآن ⚡" with horizontal scroll
- Shows top 5 listings where `rescueBadge !== null`, sorted by `rescueScore` descending
- Each card in this section uses the existing `ListingCard` with `rescueBadge` prop
- Section title in orange: "أنقذها الآن ⚡" (these are expiring soonest)
- Empty state: if no listings with a badge → don't show the section

**Done when:** Urgency badges appear on listing cards in the "Rescue Now" section. The badges match the color coding above.

---

### TASK 4 — Ramadan UI Mode 🟡

**What:** When `isRamadanSeason: true` from AppConfig, activate Ramadan visual mode. When `isIftarWindow: true`, show an iftar time banner. Show a countdown to Maghrib from `maghribTime`.

**Dependency:** Task 1 (AppConfigContext) must be done first.

**File to modify:**
```
src/screens/buyer/HomeScreen.tsx
```

**What to add at the top of HomeScreen:**

```tsx
const { isRamadanSeason, isIftarWindow, maghribTime } = useAppConfig();
```

**Ramadan season banner (when `isRamadanSeason === true`):**
- Show at top of home screen (above all sections): a green banner with a crescent moon icon 🌙
- Text: "رمضان كريم 🌙 — ابحث عن وجبات الإفطار"
- Background: `#D1FAE5` (greenLight), text `#16A34A` (green)

**Iftar window banner (when `isIftarWindow === true`):**
- Replace the Ramadan season banner with a more prominent iftar banner:
- Text: "حان وقت الإفطار! 🌙 — ابحث عن وجبات الإفطار القريبة منك"
- Slightly more prominent — slightly taller, bolder text

**Maghrib countdown (when `maghribTime !== null`):**
- Below the Ramadan banner, show a small row: "🕌 المغرب اليوم الساعة — الوقت المتبقي: XX:XX"
- Calculate remaining time from `new Date(maghribTime)` and current time
- Update every minute using `setInterval`
- If Maghrib has already passed today → don't show the countdown

**Done when:** When the admin toggles `isRamadanSeason ON` (via admin panel or API call), the home screen immediately shows the Ramadan banner. When `isIftarWindow ON`, the iftar banner appears. The countdown shows correct time.

---

### TASK 5 — Karam Home Section 🟡

**What:** Add a dedicated Karam section on the home screen showing nearby restaurants with active Karam pools.

**API:**
```
GET  /api/sellers/karam?lat=&lng=&radius=5   Public
Response: [{
  id, businessName, businessType, address,
  location: { latitude, longitude },
  logoUrl: string | null,
  karam: { sponsored: 7, claimed: 4, available: 3 }
}]
```

**File to modify:**
```
src/screens/buyer/HomeScreen.tsx
```

**New component to create:**
```
src/components/buyer/KaramSellerCard.tsx
```

**Home screen Karam section:**
- Section title: "🤝 كرم — مطاعم تستضيف وجبات مجانية"
- Horizontal scroll row of `KaramSellerCard` components
- Each card shows:
  - Restaurant name + logo (or initials avatar if no logo)
  - "X وجبات متاحة" in green
  - Distance (if location available)
- Tap card → navigate to that seller's store details (`StoreDetailsScreen` with the seller's active listing, or with seller ID)
- Use buyer's GPS coordinates (already available from the Near Me feature via `expo-location`)
- If no Karam sellers nearby → hide the section entirely (don't show empty section)

**KaramSellerCard:**
- White card, green left border (3px solid `#16A34A`)
- Green "X متاحة" badge in top-right
- Width: ~160px (card in horizontal scroll)
- RTL: text right-aligned

**Done when:** Karam section appears on home screen when there are participating sellers nearby. Cards are tappable and lead to the store detail.

---

### TASK 6 — Voice Recognition Wiring 🟡

**What:** The mic button UI is already complete in both NearMeScreen and ChatbotScreen. The `@react-native-voice/voice` package is NOT installed. Install it and wire the voice-to-text functionality.

**Install:**
```bash
npx expo install @react-native-voice/voice
# This package requires expo-dev-client or bare workflow for native modules
# If using managed Expo: use expo-speech-recognition instead
# Try: npx expo install expo-speech-recognition
```

Note: If `@react-native-voice/voice` fails to work in managed Expo, use `expo-speech-recognition` which works without ejecting.

**For NearMe voice (mic button in NearMeScreen):**
```
src/hooks/buyer/nearMe/useVoiceRecognition.ts  ← this file exists, wire it
src/screens/buyer/nearMe/NearMeScreen.tsx      ← already has mic button UI
```

In `useVoiceRecognition.ts`:
```ts
// Start recording on press: Voice.start('ar-PS') or 'ar-SA'
// Stop recording on release: Voice.stop()
// On results: SpeechResultsEvent → take first result → send to sendNearMeQuery()
// Show waveform/pulse animation while recording
// On error: show toast "لم يتم التعرف على الصوت، حاول مجدداً"
```

**For chatbot voice (mic button in ChatbotScreen):**
```
src/screens/buyer/support/ChatbotScreen.tsx   ← add voice input
src/hooks/buyer/support/useChatbot.ts         ← add voice sending function
src/services/buyer/support/chatbotService.ts  ← add voice service function
```

The chatbot voice endpoint sends audio as a file (different from speech-to-text in Near Me). Near Me uses the device's speech recognition. Chatbot uses Whisper API via the backend.

**Chatbot voice API:**
```
POST  /api/chatbot/voice   Auth: Bearer
Body: FormData
  - field "audio": audio file (.m4a, .mp3, .wav, .webm, max 25MB)
  - field "lat": string (optional, for location-aware responses)
  - field "lng": string (optional)
Response: { transcript: string, reply: string }
```

For the chatbot mic button:
1. Record audio using `expo-av` Audio recording API (already available in Expo)
2. On stop → get audio file URI → create FormData → `POST /api/chatbot/voice`
3. Show transcript as a user message first, then show the reply as AI response

`chatbotService.ts` voice function:
```ts
export const sendVoiceMessage = (audioUri: string, lat?: number, lng?: number) => {
  const formData = new FormData();
  formData.append('audio', { uri: audioUri, name: 'audio.m4a', type: 'audio/m4a' } as any);
  if (lat) formData.append('lat', String(lat));
  if (lng) formData.append('lng', String(lng));
  return api.post('/api/chatbot/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

**Done when:** Tapping the mic button in Near Me starts voice recording. Speech is transcribed. Tapping mic in the chatbot records audio, sends to Whisper, shows transcript + AI reply.

---

### TASK 7 — Seller Waste Analytics Screen 🟡

**What:** Build a new analytics screen for sellers showing sell-through rate, peak hours, top listing, and CO2 impact.

**Note:** This is a NEW screen. Tala owns `SellerDashboardScreen.tsx`. You build the screen; she adds a navigation button to it. Coordinate: tell Tala to add a button in the seller dashboard that navigates to `"seller-analytics"` (App.tsx step she adds), and tell her what prop the screen needs.

**API:**
```
GET  /api/stats/my-analytics   Auth: Bearer (SELLER)
Response:
{
  totalListings: 12,
  activeListings: 4,
  totalItemsSold: 47,
  totalRevenue: 846.00,
  co2SavedKg: 58.5,
  sellThroughRate: 78,       // percentage 0-100
  peakHours: [
    { hour: 14, count: 18 },
    { hour: 19, count: 14 }
  ],
  topListing: {
    id: "uuid",
    title: "حقيبة مفاجأة مسائية",
    unitsSold: 21
  }
}
```

**Files to create:**
```
src/screens/seller/analytics/SellerAnalyticsScreen.tsx
src/hooks/seller/useSellerAnalytics.ts
src/services/seller/analytics.service.ts
```

**Screen layout (scroll view):**

**Header:** "تحليلات المحل" ← back arrow

**Row 1 — Key stats grid (2×2):**
```
┌─────────────────┬─────────────────┐
│  إجمالي المبيعات│  الكمية المباعة │
│   846 ₪         │   47 وجبة       │
├─────────────────┼─────────────────┤
│  CO₂ موفر       │  الإدراجات النشطة│
│   58.5 كغ       │   4 إدراج       │
└─────────────────┴─────────────────┘
```

**Sell-through gauge:**
- Title: "نسبة المبيع"
- Large circular progress indicator showing `sellThroughRate`% in orange
- Label below: "78% من وجباتك تُباع — ممتاز!"
- Color: green if ≥70%, orange if 40-69%, red if <40%

**Peak hours bar chart:**
- Title: "أوقات الذروة"
- Simple horizontal bar chart using View widths (no external chart library needed)
- Each bar: hour label (e.g. "2 م", "7 م") + bar width proportional to count
- Highlight the tallest bar in orange

**Top listing card:**
- Title: "الأكثر طلباً"
- Show listing title + "21 وجبة مباعة" badge
- Link to the listing (optional)

**AI insight text** (simple string, no AI call needed — generate from data):
```ts
const generateInsight = (data) => {
  const peakHour = data.peakHours[0]?.hour;
  const hourLabel = peakHour ? `${peakHour > 12 ? peakHour - 12 : peakHour} ${peakHour >= 12 ? 'م' : 'ص'}` : '';
  if (data.sellThroughRate < 50) {
    return `معدل مبيعاتك ${data.sellThroughRate}% — جرب أن تنزل كميتك أو تقدّم وقت البيع. الذروة عندك الساعة ${hourLabel}.`;
  } else if (data.sellThroughRate >= 70) {
    return `ممتاز! ${data.sellThroughRate}% من وجباتك تُباع. الوقت المثالي للإدراج عندك الساعة ${hourLabel}.`;
  }
  return `نسبة مبيعك ${data.sellThroughRate}%. حاول الإدراج الساعة ${hourLabel} لتحسين النتيجة.`;
};
```
Show insight in a green card at the bottom.

**RTL:** All text right-aligned.

**Done when:** Screen shows real data from the API. Sell-through gauge animates on load. Peak hours chart renders. Insight text is shown.

---

### TASK 8 — Admin Web Panel (Separate React App) 🟡

**What:** A basic React web app that lets the admin approve/reject sellers and charities, view platform stats, and toggle the Ramadan season flag. This is a **completely separate project** from the mobile app — no shared files.

**Create in:** `../lefto-admin` (sibling to the mobile app directory, or wherever the team decides) — or just create inside a `/admin` folder in the same repo.

**Admin API endpoints:**
```
GET  /api/admin/stats              Auth: Bearer (ADMIN)
Response:
{
  users:    { total: 120, buyers: 95, sellers: 18, charities: 7 },
  listings: { active: 34 },
  orders:   { total: 580, pending: 12, completed: 520, cancelled: 48 },
  donations:{ total: 64 },
  pendingApprovals: { sellers: 3, charities: 2 },
  impact:   { totalCo2SavedKg: 142, totalItemsSaved: 520 }
}

GET  /api/admin/sellers/pending    Auth: Bearer (ADMIN)
Response: [{ id, businessName, businessType, status, createdAt, user: { name, phone }, documents: [{url, documentType}] }]

PATCH /api/admin/sellers/:id/approve   Auth: Bearer (ADMIN)
Body: {} (empty or { reason: "" })
PATCH /api/admin/sellers/:id/reject    Auth: Bearer (ADMIN)
Body: { reason?: string (max 500 chars) }

GET  /api/admin/charities/pending  Auth: Bearer (ADMIN)
Response: [{ id, orgName, status, createdAt, user: { name, phone }, documents: [...] }]

PATCH /api/admin/charities/:id/approve   Auth: Bearer (ADMIN)
PATCH /api/admin/charities/:id/reject    Auth: Bearer (ADMIN)
Body: { reason?: string }

GET  /api/admin/users?page=1&limit=20   Auth: Bearer (ADMIN)
Response: { users: [{ id, name, phone, role, createdAt }], pagination: {...} }

PATCH /api/app/config              Auth: Bearer (ADMIN)
Body: { isRamadanSeason?: boolean, donationEnabled?: boolean }
Response: { success: true }
```

**Tech stack for admin panel:** Plain React + Vite + plain CSS (no extra libraries needed). Simple and fast.

**Admin login:** Use the admin credentials (0598262751 / Admin123!) to get an access token. Store it in localStorage. Include it as `Authorization: Bearer <token>` on every request to `https://lefto-backend-production.up.railway.app`.

**Pages:**

**Dashboard page** (`/`):
```
Stats cards in a row:
  [ 120 Users ]  [ 34 Active Listings ]  [ 580 Orders ]  [ 142 kg CO₂ ]

Pending approvals alert: "3 sellers + 2 charities awaiting review"

Ramadan Control card:
  Toggle: "Ramadan Season" ON/OFF → PATCH /api/app/config { isRamadanSeason }
  Toggle: "Donation Enabled" ON/OFF → PATCH /api/app/config { donationEnabled }
```

**Pending Sellers page** (`/sellers`):
- Table: business name, type, owner name, phone, submitted date, documents links, Approve/Reject buttons
- Reject: prompt for reason text first

**Pending Charities page** (`/charities`):
- Same table structure

**Users page** (`/users`):
- Paginated table: name, phone, role, joined date

**Navigation:** Simple sidebar with: Dashboard, Sellers, Charities, Users.

**Done when:** Admin can log in with the admin credentials, see platform stats, approve/reject sellers and charities, and toggle the Ramadan season flag. Toggling Ramadan shows the change immediately in the stats.

---

### TASK 9 — Impact Detail Pages 🟡

**What:** The profile screen shows 4 impact stats (Points, CO2, Donations, Orders). Tapping each one should open a dedicated detail page. Wire these taps and build the pages as modals.

**Files to modify:**
```
src/screens/buyer/ProfileScreen.tsx  ← add onPress to stat cards + modal state
```

**Files to create:**
```
src/screens/buyer/impact/Co2ImpactScreen.tsx
src/screens/buyer/impact/MoneySavedScreen.tsx
src/screens/buyer/impact/DonationsImpactScreen.tsx
```

**How to open as modals from ProfileScreen:**
```tsx
// In ProfileScreen, add state:
const [activeModal, setActiveModal] = useState<'co2' | 'money' | 'donations' | null>(null);

// Wrap the screen with Modal:
<Modal visible={activeModal === 'co2'} animationType="slide">
  <Co2ImpactScreen
    totalCo2KgSaved={profile.totalCo2SavedKg}
    onClose={() => setActiveModal(null)}
  />
</Modal>
```

**Data available from `GET /api/users/me`:**
```ts
{
  points: number,
  totalCo2SavedKg: number,
  badges: [{ id: string, earnedAt: string }],
  activeOrdersCount: number,
  // orders and donations come from GET /api/orders/me
}
```

**Money Saved calculation (no backend field exists — calculate from orders):**
```ts
// From orders list (GET /api/orders/me):
const moneySaved = completedOrders.reduce((sum, order) => {
  return sum + ((order.listing.originalPrice - order.listing.discountedPrice) * order.quantity);
}, 0);
```
Ensure `order.listing.originalPrice` and `order.listing.discountedPrice` are returned in orders. Check if they are; if not, pass `0` for money saved with a note.

---

**Co2ImpactScreen:**
- Header: "أثري البيئي 🌱" + close button
- Large number: `{totalCo2SavedKg} كغ CO₂`
- Equivalence string (calculate):
  ```ts
  const kmEquivalent = (totalCo2SavedKg * 4.6).toFixed(1); // 1 km driving ≈ 0.21 kg CO2
  const label = `يعادل عدم قيادة ${kmEquivalent} كم`;
  ```
- Info card: "ما هو CO₂؟" expandable section explaining carbon dioxide in simple Arabic:
  *"CO₂ هو غاز ثاني أكسيد الكربون الناتج عن إنتاج الطعام ونقله. كل وجبة تنقذها تقلل انبعاثاته."*
- Badge progress: show Eco Hero (10kg target) and Eco Champion (50kg target) with progress bars
- Empty state (if 0kg): "ابدأ بحجز أول وجبة لتبدأ رحلتك البيئية 🌱" + CTA button

**MoneySavedScreen:**
- Header: "مبلغ وفّرته 💰" + close button
- Large number: `{moneySaved} ₪`
- Subtitle: "بدلاً من دفع {totalOriginalValue} ₪ دفعت {totalActualPaid} ₪"
- Monthly breakdown: group completed orders by month, show savings per month as a simple list
  ```
  يونيو 2026: وفّرت 18 ₪ (3 وجبات)
  مايو 2026: وفّرت 34 ₪ (5 وجبات)
  ```
- Total savings sticky at bottom of screen: "المجموع: {moneySaved} ₪"

**DonationsImpactScreen:**
- Header: "أثري الاجتماعي 🤝" + close button
- Number: Karam sponsorships count (meals sponsored via Karam)
- Charity donations: count of seller donations the buyer has contributed to (if applicable)
- Visual: simple milestone progress (0 → 5 → 10 → 25 meals)
- Encourage next step: "أنت على وشك تمويل وجبتك الـ X القادمة!"

**Done when:** All three impact screens open as modals when buyer taps the stat cards. CO2 page shows equivalence calculation. Money Saved shows monthly breakdown. Donations page shows Karam count.

---

### TASK 10 — Charity Directory + Public Profile 🟡

**What:** Build a standalone charity directory accessible from the buyer settings panel, and a public charity profile page.

**API:**
```
GET  /api/charities   Public
Response: [{
  id, orgName, description, region, address,
  verifiedBadge: boolean,
  rating: number,
  trustScore: number,      // 0-100
  totalDonations: number
}]

GET  /api/charities/:id   Public
Response: {
  id, orgName, description, region, address,
  verifiedBadge, rating, trustScore,
  breakdown: {
    volume: number,       // up to 20 pts
    proofRate: number,    // up to 32 pts
    rating: number,       // up to 24 pts (avg 4.8 ÷ 5 × 24)
    responseSpeed: number // up to 6 pts (10÷(avgDays+1)×6 capped at 6)
  },
  totalDonations: number,
  confirmedCount: number,
  avgRating: number
}
```

**Files to create:**
```
src/screens/buyer/charity/CharityDirectoryScreen.tsx
src/screens/buyer/charity/CharityPublicProfileScreen.tsx
src/hooks/buyer/useCharities.ts
src/services/buyer/charity.service.ts
```

**Files to modify:**
```
src/screens/buyer/ProfileScreen.tsx  ← add "دليل الجمعيات" button in settings panel
```

**How to open from ProfileScreen:**
The profile screen has a settings panel at the bottom (Personal Info, Notifications, etc.). Add a new item "دليل الجمعيات المعتمدة" → opens `CharityDirectoryScreen` as a Modal.

**CharityDirectoryScreen:**
- Header: "الجمعيات المعتمدة ✅"
- Search bar to filter by name
- List of `CharityCard` components
- Each card:
  - Org name + verified badge (green checkmark)
  - Region served
  - Trust Score badge: color-coded pill
    - 80-100: green "⭐ موثوق جداً"
    - 60-79: orange "✓ موثوق"
    - <60: gray "جديد"
  - Total donations count
  - Tap → opens `CharityPublicProfileScreen`

**CharityPublicProfileScreen:**
- Header: org name + close button
- Verified badge prominently displayed
- Description + region
- Trust Score card:
  ```
  ┌────────────────────────────────────────┐
  │  درجة الثقة: 82 / 100    🏆           │
  │  التحقق: ██████████ 40                  │
  │  معدل الاستلام: ████████░░ 32          │
  │  تقييم المانحين: ████████░░ 24         │
  │  سرعة الاستجابة: ████░░░░░░ 6         │
  └────────────────────────────────────────┘
  ```
  Each row: label + progress bar + score number
- Stats row: "20 تبرع | 18 مؤكدة | تقييم 4.8/5"
- Address + region

**Done when:** Buyer can tap "دليل الجمعيات" in profile settings, see list of charities with trust scores, tap any charity to see its full public profile.

---

### TASK 11 — Seller Review Reply Display 🟡

**What:** The backend already returns `sellerReply` and `repliedAt` in the reviews list. Just display them.

**API — already returns:**
```
GET  /api/reviews/seller/:sellerId
Response: {
  reviews: [{
    id, ratingOverall, ratingPickup, ratingQuality, ratingVariety,
    comment, createdAt,
    sellerReply: string | null,    // ← existing field
    repliedAt: string | null       // ← existing field
  }],
  averageRating, pagination
}
```

**File to modify:**
```
src/components/buyer/profile/ReviewCard.tsx
```

Below the review comment, if `sellerReply !== null`, show a reply box:
```
┌─────────────────────────────────────────┐
│  💬 رد صاحب المحل:                      │
│  "شكراً على تقييمك الإيجابي!"           │
│  24 مايو 2026                           │
└─────────────────────────────────────────┘
```
- Slightly indented (12px left/right margin within the card)
- Light gray background `#F3F4F6`
- Label "رد صاحب المحل:" in bold orange
- Reply text below
- Date in gray, small

**Done when:** Seller replies appear below reviews in the store details screen. If no reply, nothing extra is shown.

---

### TASK 12 — Community Leaderboard Screen 🟢

**What:** Build a leaderboard screen showing top buyers and sellers, accessible from the profile or browse tab.

**API:**
```
GET  /api/stats/leaderboard   Public
Response:
{
  buyers: [{
    rank: 1, id, name: "يوسف حمدان",
    co2SavedKg: 12.4,
    badges: ["first_save", "eco_hero_10kg"]
  }],
  sellers: [{
    rank: 1, id, businessName: "مطعم أبو العبد",
    rating: 4.7, mealsRescued: 47, totalDonations: 15
  }]
}
```

**Files to create:**
```
src/screens/buyer/stats/LeaderboardScreen.tsx
src/services/buyer/stats.service.ts
```

**Open as a modal from Profile screen:**
Add "لوحة المتصدرين 🏆" item to the profile settings panel → opens `LeaderboardScreen` as Modal.

**Screen layout:**
- Header: "أبطال إنقاذ الطعام 🏆 — هذا الأسبوع"
- Two tabs: "المشترون" | "البائعون"

**Buyers tab:**
| Rank | Name | CO₂ | Badges |
| --- | --- | --- | --- |
| 🥇 1 | يوسف | 12.4 كغ | 🌱🌟 |
| 🥈 2 | ... | ... | ... |

**Sellers tab:**
| Rank | Store | Meals | Rating |
| --- | --- | --- | --- |
| 🥇 1 | أبو العبد | 47 | ⭐ 4.7 |

- Top 3 get medal icons 🥇🥈🥉
- Highlight the current user's row (if they appear) with orange background

**Done when:** Screen loads and shows top buyers and sellers. Tab switching works.

---

### TASK 13 — Neighborhood Heatmap 🟢

**What:** Add a map layer to the browse screen showing Nablus with seller activity markers, where marker size indicates active listings count.

**API:**
```
GET  /api/stats/heatmap   Public
Response: [{
  sellerId, businessName,
  lat: 32.2214, lng: 35.2544,
  activeListings: 3,
  totalQuantity: 12
}]
```

**File to modify:**
```
src/features/browse/BrowseScreen.tsx  (or wherever the map view is)
```

**What to add:**
The browse screen already has a map view toggle. When the map view is active, in addition to individual listing pins, add activity markers:

For each seller in the heatmap response:
- Show a circle marker centered on their coordinates
- Circle radius = `20 + (activeListings * 8)` (so 1 listing = 28px radius, 5 listings = 60px radius)
- Circle color: orange `#DE985A` at 40% opacity (so individual pins show through)
- On tap: show tooltip with `businessName` + "X إدراجات نشطة"

Use the `LeafletMap` component that already exists at `src/components/shared/LeafletMap.tsx`, or React Native Maps if Leaflet doesn't support custom circles.

**Done when:** Opening map view in Browse shows activity circles on Nablus. Larger circles mean more active listings at that location.

---

### TASK 14 — Shareable Impact Card 🟢

**What:** After the impact celebration screen, add a "شارك تأثيرك" button that uses React Native's `Share` API to share the buyer's CO2 impact.

**File to modify:**
```
src/screens/buyer/reserve/ImpactCelebrationScreen.tsx
```

**What to add:**
After the existing confetti/celebration animation and the CO2 counter, add a green "شارك تأثيرك 🌱" button at the bottom.

```tsx
import { Share } from 'react-native';

const shareImpact = async (co2Kg: number) => {
  const co2Grams = Math.round(co2Kg * 1000);
  const kmEquivalent = (co2Kg * 4.6).toFixed(1);
  const message = `🌱 أنقذت وجبة مع LeftO اليوم!\nوفّرت ${co2Grams > 1000 ? co2Kg + ' كغ' : co2Grams + ' غ'} CO₂ — يعادل عدم قيادة ${kmEquivalent} كم 🇵🇸\n#LeftO #فلسطين`;
  
  await Share.share({ message });
};
```

Button style: green `#16A34A`, white text, full width, at bottom of celebration screen.

**Done when:** Buyer sees "شارك تأثيرك" button on the impact celebration screen. Tapping opens the native share sheet with the impact message.

---

### TASK 15 — Wire Favorites Notification Toggle 🟢

**What:** The bell icon on the favorites screen already exists and toggles local state. Wire it to the backend so the preference persists.

**API:**
```
PATCH  /api/users/me   Auth: Bearer
Body: { notifyOnFavoriteStores?: boolean }  ← OR per-listing if backend supports it
Response: { user: { ... } }
```

Note: If the backend doesn't have per-listing notification preferences yet, implement a global toggle: "notify me when any favorited store posts a new listing." Check `GET /api/users/me` response for a `notifyOnFavoriteStores` field. If it doesn't exist, implement the toggle UI only (persist to AsyncStorage locally).

**File to modify:**
```
src/features/favorites/screens/FavoritesScreen.tsx
```

Current behavior: bell icon toggles local state (`useState`) only — resets on app restart.

New behavior: On bell icon tap → call `PATCH /api/users/me { notifyOnFavoriteStores: !current }` → persist the preference. On screen mount, read from `GET /api/users/me` or AsyncStorage to set initial state.

**Done when:** Bell toggle in favorites persists across app restarts. (If backend doesn't support the field, persist to AsyncStorage as a temporary solution.)

---

### TASK 16 — SPECIFIC_PARCEL Expiry Date on Listing Card 🟢

**What:** For `SPECIFIC_PARCEL` listings, show the package expiry date on the listing card.

**File to modify:**
```
src/components/buyer/ListingCard.tsx
```

**What to add:**
- If `listing.type === "SPECIFIC_PARCEL"` AND `listing.expiryDate` is not null:
  - Show a small row below the pickup window: "📅 ينتهي: {formatted date}"
  - Format: `new Date(expiryDate).toLocaleDateString('ar-PS', { day: 'numeric', month: 'long' })`
  - Color: `#9CA3AF` (textMedium) for normal dates, `#EF4444` (error red) if expiry is within 2 days
- For `MEAL_BAG`: don't show expiry date (it's auto-set to end of pickup day by backend)

**Done when:** SPECIFIC_PARCEL listing cards show expiry date. Cards expiring within 2 days show red expiry.

---

### TASK 17 — Seller Reviews Load More 🟢

**What:** Seller reviews on the store details screen are hard-capped at 10. Add a "تحميل المزيد" button.

**File to modify:**
```
src/screens/buyer/StoreDetailsScreen.tsx
src/hooks/buyer/useSellerReviews.ts
```

The existing `useSellerReviews.ts` hook fetches with `limit=10`. Modify it to support pagination:
```ts
// Add state: page, hasMore
// Add function: loadMore() → fetches page+1 → appends to reviews array
// hasMore = (reviews.length < pagination.total)
```

In `StoreDetailsScreen.tsx`, after the reviews list, show a "تحميل المزيد" button if `hasMore === true`.

**Done when:** "تحميل المزيد" button appears when there are more than 10 reviews. Tapping it loads the next page and appends to the list.

---

### TASK 18 — Share + Get Directions on Store Detail 🟢

**What:** Add a Share button and a Get Directions button to the store details screen.

**File to modify:**
```
src/screens/buyer/StoreDetailsScreen.tsx
```

**Share button:**
```tsx
import { Share } from 'react-native';

const shareListing = async () => {
  await Share.share({
    message: `🥡 ${listing.seller.businessName} — ${listing.title}\n💰 ${listing.discountedPrice} ₪ بدلاً من ${listing.originalPrice} ₪\n⏰ ${formattedPickupWindow}\n\nحجز عبر LeftO 🇵🇸`
  });
};
```
Place the share button in the header next to the heart/favorite icon.

**Get Directions button:**
```tsx
import { Linking, Platform } from 'react-native';

const openDirections = () => {
  const lat = listing.seller.location?.latitude;
  const lng = listing.seller.location?.longitude;
  if (!lat || !lng) return;
  
  const url = Platform.OS === 'ios'
    ? `maps:0,0?q=${lat},${lng}`
    : `geo:${lat},${lng}?q=${lat},${lng}`;
  Linking.openURL(url);
};
```
Place as a button below the map view in the store details page with a map-pin icon and label "احصل على الاتجاهات".

**Done when:** Share button in store detail header opens native share sheet. Get Directions button opens the device's maps app centered on the store.

---

### TASK 19 — Order Cancellation from ProfileScreen + Impact Stats Wiring 🟢

**What:** ProfileScreen has two things to fix: (1) wire the tappable impact stat cards to open modals (see Task 9), (2) add a cancel button to RESERVED orders in the activity tab.

Note: Task 9 covers the modal screens themselves. This task just adds the `onPress` handlers in ProfileScreen.

**File to modify:**
```
src/screens/buyer/ProfileScreen.tsx
```

**Impact stat wiring** (coordinate with Task 9 — build the modal screens first):
```tsx
// Add modal state and handlers:
const [activeImpactModal, setActiveImpactModal] = useState<'co2' | 'money' | 'donations' | null>(null);

// On each stat card, add onPress:
onPress={() => setActiveImpactModal('co2')}    // on CO2 card
onPress={() => setActiveImpactModal('money')}  // on Money Saved card
onPress={() => setActiveImpactModal('donations')} // on Donations card
```

**Order cancel from ProfileScreen (Activity tab):**
The `OrderCard.tsx` component already handles order display. Check if it has a cancel prop. If not:
- For RESERVED orders in the Activity tab: show a small "إلغاء" text button
- On tap: call `PATCH /api/orders/:id/cancel` → show confirmation alert first → remove from list on success
- API: same as OrdersScreen cancel (already implemented there)

**Done when:** Tapping CO2/money/donations stats opens the correct modal. RESERVED orders in profile activity tab have a cancel button.

---

### TASK 20 — Chatbot Topic Chips + Rate Support 🟢

**What:** Add topic selection chips at the start of a chat session and a rating prompt at the end.

**File to modify:**
```
src/screens/buyer/support/ChatbotScreen.tsx
src/hooks/buyer/support/useChatbot.ts
```

**Topic chips (show when chat history is empty):**
```tsx
const TOPIC_CHIPS = [
  "كيف أحجز وجبة؟",
  "كيف تعمل آلية الاستلام؟",
  "كيف أتبرع لجمعية؟",
  "ما هو برنامج الكرم؟",
  "كيف أتواصل مع المحل؟",
];
```
Show as horizontally scrollable chips below the input bar. On tap → auto-send that text as a message. Hide after first message is sent.

**Rate support experience (show after a conversation ends):**
- Define "conversation ended" as: chat has ≥3 messages AND user hasn't sent a message in 5 minutes (use a timer or a "تم الانتهاء؟" button)
- OR simpler: Add a small "قيّم المحادثة" button in the header that shows after the first reply
- On tap: show a bottom sheet with 1–5 stars
- On submit: store rating locally (AsyncStorage) or send to a simple endpoint if available
- After rating: show "شكراً على تقييمك! 😊"

**Done when:** Topic chips appear at chat start. Tapping a chip sends it as a message. Rating prompt appears after conversation.

---

### TASK 21 — Buyer Notification Settings 🟢

**What:** Add notification preference toggles to the profile settings panel.

**File to modify:**
```
src/screens/buyer/ProfileScreen.tsx
```

The profile screen has a collapsible settings panel. Add a "الإشعارات" section in it:

```
الإشعارات:
  🔔 إشعارات الباقات الجديدة      [Toggle ON]
  🤝 تحديثات الكرم               [Toggle ON]
  📱 التذكير اليومي               [Toggle OFF]
     أيام التذكير: [الاثنين] [الأربعاء] [الجمعة]
```

Store preferences locally in AsyncStorage (`@lefto_notification_settings`). If `PATCH /api/users/me` supports notification preferences, also sync with backend. Otherwise AsyncStorage is sufficient.

**Done when:** User can toggle notification preferences. Selections persist across app restarts.

---

### TASK 22 — Real SMS OTP via Twilio (Backend) 🟡

**What:** OTP currently prints to the server terminal. Connect a real SMS provider.

**This is a backend task (D1 domain).**

**File to modify:**
```
Backend: src/services/otp.service.ts (or wherever OTPs are sent)
```

1. Install Twilio: `npm install twilio`
2. Add env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` to `.env`
3. Replace the `console.log(otp)` with:
```ts
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
await client.messages.create({
  body: `رمز التحقق الخاص بك في LeftO: ${otp}. صالح لمدة 5 دقائق.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: `+970${phone}` // Palestine country code
});
```
4. Add error handling: if SMS fails, log the error but do NOT throw — return success to client (OTP was saved to DB) and let them try again.

Test with a real Palestinian phone number. Twilio trial accounts support sending to verified numbers.

**Done when:** Sending OTP via `POST /api/auth/send-otp` results in an actual SMS being received on the phone. Terminal no longer shows OTP.

---

## Summary Table

| Task | Priority | Domain | Est. |
|------|----------|--------|------|
| T1: AppConfigContext | 🔴 CRITICAL | FE | 0.5h |
| T2: Karam Buyer UI (StoreDetails) | 🔴 CRITICAL | FE | 1.5h |
| T3: Rescue Score Display | 🟡 HIGH | FE | 1h |
| T4: Ramadan UI Mode | 🟡 HIGH | FE | 1.5h |
| T5: Karam Home Section | 🟡 HIGH | FE | 1.5h |
| T6: Voice Recognition Wiring | 🟡 HIGH | FE | 1.5h |
| T7: Seller Waste Analytics Screen | 🟡 HIGH | FE | 2h |
| T8: Admin Web Panel | 🟡 HIGH | Web | 2–3h |
| T9: Impact Detail Pages | 🟡 HIGH | FE | 2h |
| T10: Charity Directory + Profile | 🟡 HIGH | FE | 1.5h |
| T11: Seller Review Reply Display | 🟡 HIGH | FE | 0.5h |
| T12: Community Leaderboard | 🟢 MEDIUM | FE | 1.5h |
| T13: Neighborhood Heatmap | 🟢 MEDIUM | FE | 1.5h |
| T14: Shareable Impact Card | 🟢 MEDIUM | FE | 1h |
| T15: Favorites Bell Toggle | 🟢 MEDIUM | FE | 1h |
| T16: Expiry Date on Listing Card | 🟢 MEDIUM | FE | 0.5h |
| T17: Reviews Load More | 🟢 MEDIUM | FE | 0.5h |
| T18: Share + Get Directions | 🟢 MEDIUM | FE | 0.5h |
| T19: ProfileScreen Wiring | 🟢 MEDIUM | FE | 1h |
| T20: Chatbot Topic Chips | 🟢 MEDIUM | FE | 1h |
| T21: Notification Settings | 🟢 MEDIUM | FE | 1h |
| T22: Real SMS OTP | 🟡 HIGH | BE | 0.5h |
| **Total** | | | **~26h** |

---

## Build Order

Start with the critical foundation:
```
Day 1 (Critical):
  T1 AppConfigContext → tell Tala to wrap it
  T2 Karam Buyer UI
  T3 Rescue Score
  T4 Ramadan UI
  T5 Karam Home Section

Day 2 (High priority):
  T6 Voice Recognition
  T7 Seller Waste Analytics Screen
  T8 Admin Web Panel
  T22 Real SMS OTP

Day 3 (High priority continued):
  T9 Impact Detail Pages
  T10 Charity Directory
  T11 Seller Review Reply

Day 4-5 (Medium priority):
  T12-T21 (all medium items, ~30 min each)
```

---

---

## Sprint 5 — New Backend Features (Added June 5, 2026)

> Backend shipped major new features. All tasks below are NEW — no conflicts with original 22 tasks above.
> Task 22 (SMS OTP) is already done by the backend — cross it off.

---

### NEW-G1 — Monthly Winner Seller Banner (HomeScreen) 🔴

**What:** Every month-end the backend picks the top-rated seller. Show a golden banner at the top of the home screen visible to ALL users including guests.

**API:**
```
GET  /api/stats/monthly-winner   Public — no auth required
Response (winner):  { winner: { sellerId, name, rating, month: "2026-05" } }
Response (no winner): { winner: null }
```

**File to modify:** `src/screens/buyer/HomeScreen.tsx`

Fetch once on screen mount, cache in component state. Show at the very top of HomeScreen — above Ramadan banner and Rescue Now section.

```
┌──────────────────────────────────────────────────┐
│  🏆 بائع الشهر — مايو 2026                        │
│  مطعم أبو العبد    ⭐ 4.9                          │
│                [ زيارة المتجر ]                    │
└──────────────────────────────────────────────────┘
```

- Background: gold `#F59E0B`, text: white
- Month helper: `const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']; const fmt = (ym) => MONTHS_AR[+ym.split('-')[1]-1] + ' ' + ym.split('-')[0];`
- "زيارة المتجر" → navigate to StoreDetailsScreen with `sellerId`
- If `winner === null` → hide entirely, no placeholder

**Done when:** Banner shows when a winner exists. Gold, prominent. Tapping navigates to seller. Disappears when no winner.

---

### NEW-G2 — Dynamic Expiry Pricing Display 🔴

**What:** Every listing response now includes `currentPrice`, `isPriceDecaying`, `floorPrice`. Always show `currentPrice` as the main price. For decaying listings add a live countdown + flame indicator.

**New fields always present on listing responses:**
```ts
currentPrice: number       // USE THIS as the displayed price — replaces discountedPrice in UI
isPriceDecaying: boolean   // true → show decay UI
floorPrice: number | null  // present when decaying
expiryDate: string | null
```

**Files to modify:**
```
src/components/buyer/ListingCard.tsx   ← update price display
src/screens/buyer/HomeScreen.tsx       ← add 60s interval tick
```

**ListingCard — always show `currentPrice`:**

Normal listing: `~~originalPrice~~   currentPrice ₪` (no other change)

Decaying listing (`isPriceDecaying === true`):
```
~~30 ₪~~  →  13.50 ₪  🔥
ينخفض تلقائياً | الحد الأدنى 5 ₪ | ⏰ ينتهي بعد 3 ساعات
```

**Client-side real-time price formula (no extra API calls):**
```ts
const computeCurrentPrice = (listing: Listing): number => {
  if (!listing.isPriceDecaying || !listing.floorPrice || !listing.expiryDate) {
    return listing.discountedPrice;
  }
  const now   = Date.now();
  const start = new Date(listing.createdAt).getTime();
  const end   = new Date(listing.expiryDate).getTime();
  if (now >= end) return listing.floorPrice;
  if (now <= start) return listing.discountedPrice;
  const progress = (now - start) / (end - start);
  const price = listing.discountedPrice - progress * (listing.discountedPrice - listing.floorPrice);
  return Math.max(Math.round(price * 100) / 100, listing.floorPrice);
};
```

**HomeScreen interval — recalculate displayed prices every 60 seconds:**
```tsx
const [now, setNow] = useState(Date.now());
useEffect(() => {
  const timer = setInterval(() => setNow(Date.now()), 60_000);
  return () => clearInterval(timer);
}, []);
// Pass `now` as prop to ListingCard so it re-renders when tick fires
```

**Done when:** All listing cards show `currentPrice`. Decaying listings show 🔥, floor price, and time remaining. Price auto-decrements on screen every 60s.

---

### NEW-G3 — AI Seller Performance Score on StoreDetails 🟡

**What:** Show the public AI performance score and weekly sentiment on the store details page. No auth needed.

**API:**
```
GET  /api/listings/ai/performance/:sellerId   Public
Response:
{
  performanceScore: 84,
  breakdown: { sellThroughRate: 0.87, avgRating: 4.7, weeklyListingCount: 12, isVerified: true },
  weeklyInsight: "💪 أقوى نقطة: سرعة الاستجابة | ⚠️ أكثر شكوى: التأخر في الاستلام"
}
```

**File to modify:** `src/screens/buyer/StoreDetailsScreen.tsx`

Add a card below seller bio, above the listings list:
```
┌────────────────────────────────────────┐
│  أداء البائع                            │
│  ████████████████░░░░   84/100          │
│  💪 سرعة الاستجابة   ← green row        │
│  ⚠️ التأخر في الاستلام ← orange row      │
└────────────────────────────────────────┘
```

- Progress bar color: green ≥70, orange 40–69, red <40
- Parse `weeklyInsight` by `|` split. 💪 parts → `#D1FAE5` bg. ⚠️ parts → `#FFE8D6` bg.
- If `weeklyInsight === null` → show score only, hide sentiment rows
- If fetch fails → hide the card entirely (it's supplementary)

**Done when:** Store detail shows AI score. Sentiment rows appear when insight is not null.

---

### NEW-G4 — Impact Certificate PDF Download 🟡

**What:** Buyer can download a PDF certificate of their environmental impact for any past month.

**API:**
```
GET  /api/users/me/impact-certificate?month=2026-05   Auth: Bearer
Response: Binary PDF (application/pdf — NOT JSON)
```

**Packages needed:**
```bash
npx expo install expo-file-system expo-sharing
```

**Files to create:**
```
src/services/buyer/impact.service.ts
```

```ts
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export const downloadImpactCertificate = async (month: string, accessToken: string) => {
  const url = `https://lefto-backend-production.up.railway.app/api/users/me/impact-certificate?month=${month}`;
  const path = FileSystem.documentDirectory + `lefto-impact-${month}.pdf`;
  
  const result = await FileSystem.downloadAsync(url, path, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (result.status !== 200) throw new Error('فشل تحميل الشهادة');
  
  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'شهادتي البيئية من LeftO',
  });
};
```

**File to modify:** `src/screens/buyer/ProfileScreen.tsx`

Add a "شهادتي البيئية" section in the profile (below the impact stats grid):
```
┌─────────────────────────────────────┐
│  📄 شهادة الأثر البيئي              │
│  الشهر: [ مايو 2026 ▼ ]            │
│  [ تحميل ومشاركة ]                  │
└─────────────────────────────────────┘
```

Month picker: a simple dropdown/picker of the past 12 months. Default = last month.

On tap:
1. Show loading spinner
2. Read `accessToken` from AuthContext
3. Call `downloadImpactCertificate(selectedMonth, accessToken)`
4. Native share sheet opens with the PDF
5. On error → toast "لم نتمكن من تحميل الشهادة"

**Done when:** Buyer selects a month, taps download, native share sheet opens with the impact PDF.

---

### NEW-G5 — Karam Buyer Flow: Stripe Payment 🔴 (replaces original Task 2)

**What:** Karam sponsorship now uses real Stripe payment. The "تبرع بوجبة" button no longer does a free action — it opens a Stripe payment sheet.

**Updated POST response:**
```
POST  /api/sellers/:sellerId/karam/sponsor   Auth: Bearer (BUYER)
Response: { clientSecret: "pi_xxx_secret_xxx", amountNIS: 15, sellerName: "مطعم أبو العبد" }
```

**Install Stripe:**
```bash
npx expo install @stripe/stripe-react-native
```

**Tell Tala:** She needs to wrap App.tsx with `<StripeProvider publishableKey="pk_test_...">`. Give her the publishable key from the backend Stripe dashboard (Developers → API Keys → Publishable key). **Never share the secret key.**

**File to modify:** `src/screens/buyer/StoreDetailsScreen.tsx`

```tsx
import { useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

const handleSponsorKaram = async () => {
  setSponsoring(true);
  try {
    const res = await api.post(`/api/sellers/${sellerId}/karam/sponsor`);
    const { clientSecret, amountNIS } = res.data.data;

    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'LeftO — كرم',
    });
    if (initError) throw new Error(initError.message);

    const { error: payError } = await presentPaymentSheet();
    if (payError) {
      if (payError.code !== 'Canceled') showToast('فشلت عملية الدفع، حاول مجدداً', 'error');
      return;
    }

    // Payment succeeded — backend webhook handles counter increment
    showToast('شكراً! دعمت وجبة مجانية لشخص محتاج 💚 — جزاك الله خيراً', 'success');
    setTimeout(() => loadKaramBalance(sellerId), 2000); // wait for webhook
  } finally {
    setSponsoring(false);
  }
};
```

**Update Karam card on StoreDetailsScreen:**
- Button label: "تبرع بوجبة — {amountNIS} ₪" (show the price, not "مجاناً")
- Show `amountNIS` on the card: "سعر التبرع: 15 ₪ للوجبة"

**Done when:** Tapping Karam button → Stripe sheet opens → payment → success toast → balance refreshes after ~2s.

---

### NEW-G6 — Admin Panel: Charts + Filters + Delete + Unblock 🟡 (extends Task 8)

Add these to the admin React web app (Task 8):

**A — 6-Month Charts (`GET /api/admin/stats/charts` — Admin auth):**
```json
{ charts: [{ month: "2026-01", completedOrders: 67, listingsCreated: 180, newUsers: 34 }, ...] }
```
Install `recharts`. Add a `LineChart` with 3 lines to the admin dashboard page.
Convert `"2026-05"` → `"مايو 2026"` for X-axis labels.

**B — Best-Rated Cards (`GET /api/admin/stats/best-rated` — Admin auth):**
```json
{ bestSeller: { businessName, rating }, bestCharity: { orgName, _count: { donations } } }
```
Two cards on the dashboard: "🏅 أفضل بائع" and "🤝 أنشط جمعية".

**C — User Filters (`GET /api/admin/users?role=&isBlocked=&search=` — Admin auth):**
Add filter bar above users table: search input (300ms debounce) + role dropdown + blocked status dropdown.

**D — Unblock User (`PATCH /api/admin/users/:userId/unblock` — Admin auth):**
Show red "محظور" badge next to blocked users. Add "إلغاء التعليق" button per row.

**E — Soft Delete User (`DELETE /api/admin/users/:id` — Admin auth):**
Add "حذف" button with confirm dialog: "هل أنت متأكد؟ لا يمكن التراجع."

**F — Delete Listing (`DELETE /api/admin/listings/:id` — Admin auth):**
Add a listings moderation table or page with remove buttons.

---

### NEW-G7 — Listing Report / Flag System 🟡

**What:** Buyers can flag a listing as problematic. Admins see a moderation queue and can dismiss or remove it.

---

**Buyer side — Report button on listing card / store detail:**

```
POST  /api/reports/listings/:listingId   Auth: Bearer (BUYER)
Body: { reason: string, details?: string }
Reason values: "SPOILED_FOOD" | "WRONG_DESCRIPTION" | "WRONG_PRICE" | "INAPPROPRIATE_CONTENT" | "OTHER"
Response (201): { id, reason, status: "PENDING", createdAt }
Errors:
  409 → "لقد أبلغت عن هذا العرض مسبقاً"
  403 → only BUYER role allowed
```

**Files to modify:**
```
src/screens/buyer/StoreDetailsScreen.tsx   ← add report button
src/components/buyer/ListingCard.tsx        ← add 3-dot menu
src/services/buyer/report.service.ts        ← new file
```

`report.service.ts`:
```ts
import api from '../shared/api';
export const reportListing = (listingId: string, reason: string, details?: string) =>
  api.post(`/api/reports/listings/${listingId}`, { reason, details });
```

**UX — 3-dot menu or flag icon on each listing:**
- On tap → open a bottom sheet (Modal) with reason options:
  ```
  ⚠️ الإبلاغ عن هذا العرض
  
  ○ طعام فاسد
  ○ وصف خاطئ
  ○ سعر خاطئ
  ○ محتوى غير لائق
  ○ سبب آخر
  
  [تفاصيل إضافية (اختياري)...]
  
  [إلغاء]   [إرسال البلاغ]
  ```
- After success → toast "شكراً، سيراجع فريقنا البلاغ" + disable the flag icon on that listing
- On 409 → toast "لقد أبلغت عن هذا العرض مسبقاً"

**Arabic reason labels:**
```ts
const REASON_LABELS: Record<string, string> = {
  SPOILED_FOOD: 'طعام فاسد',
  WRONG_DESCRIPTION: 'وصف خاطئ',
  WRONG_PRICE: 'سعر خاطئ',
  INAPPROPRIATE_CONTENT: 'محتوى غير لائق',
  OTHER: 'سبب آخر',
};
```

---

**Admin side — Report queue in admin panel (Task 8):**

```
GET    /api/reports?status=PENDING&page=1&limit=20   Admin auth
Response: { reports: [{ id, reason, details, status, listing: { title, seller }, buyer: { name, phone } }], total, page, totalPages }

PATCH  /api/reports/:reportId/review   Admin auth
Body: { status: "DISMISSED" | "REVIEWED", adminNote?: string }

DELETE /api/reports/:reportId/listing  Admin auth
(Soft-deletes the listing AND marks report REVIEWED in one call)
Response: { message: "Listing removed and report marked as reviewed" }
```

Add a "البلاغات" page to the admin panel sidebar:
- Table: listing title, seller, reason, buyer name, date, actions
- Per row: "تجاهل" button (→ `PATCH status: "DISMISSED"`) and "إزالة العرض" button (→ `DELETE /api/reports/:id/listing`)
- Filter tabs: Pending / Reviewed / Dismissed
- After remove: row disappears, toast "تم إزالة العرض وإغلاق البلاغ"

**Done when:** Buyer can tap a flag icon on any listing, pick a reason, submit a report. Admin panel shows the pending reports queue with dismiss and remove actions.

---

### NEW-G8 — Cancellation Block + Badge Decrement Display 🟡

**What:** Two new fields on the user profile that need to be reflected in the buyer profile screen.

**New fields in `GET /api/users/me`:**
```ts
isBlocked: boolean        // account blocked after 5 cancellations
cancellationCount: number // how many orders were cancelled
```

**File to modify:** `src/screens/buyer/ProfileScreen.tsx`

**isBlocked banner (top of profile when `isBlocked === true`):**
```
┌──────────────────────────────────────────────────┐
│  🚫 حسابك موقوف مؤقتاً                             │
│  تم إلغاء X حجوزات. تواصل مع الإدارة.             │
└──────────────────────────────────────────────────┘
```

**Cancellation warning (yellow, when count is 3–4):**
```
⚠️ تنبيه: X إلغاءات — الحد الأقصى 5 قبل التعليق
```

Rules:
- `cancellationCount < 3` → show nothing (don't discourage normal users)
- `cancellationCount >= 3 && !isBlocked` → yellow warning row in profile stats
- `isBlocked === true` → red banner at the top of the screen

**Done when:** Blocked buyers see the red banner. Users with 3–4 cancellations see the yellow warning. Normal users see nothing extra.

---

### NEW-G9 — Dual Role: Buyer → Seller UI in ProfileScreen 🟡

**What:** A buyer who also has a seller profile (or wants one) now has a path in their profile screen. Tala stores `sellerStatus` in AuthContext — you just read it and render the right UI.

**File to modify:** `src/screens/buyer/ProfileScreen.tsx`

```tsx
const { sellerStatus } = useAuth(); // Tala exposes this from AuthContext (NEW-T6)

// Add to the settings section:
{sellerStatus === null && (
  <PressableRow icon="briefcase" label="أصبح بائعاً" onPress={() => navigateTo('seller-register')} />
)}
{sellerStatus === 'PENDING' && (
  <InfoRow icon="clock" label="طلب التسجيل كبائع قيد المراجعة" color="orange" />
)}
{sellerStatus === 'REJECTED' && (
  <InfoRow icon="x-circle" label="تم رفض طلبك — تواصل مع الإدارة" color="red" />
)}
{sellerStatus === 'APPROVED' && (
  <PressableRow icon="store" label="لوحة التاجر 🏪" onPress={() => navigateTo('seller-dashboard')} color="orange" />
)}
```

- `navigateTo('seller-dashboard')` → Tala owns App.tsx routing; tell her this navigation call needs to work
- `navigateTo('seller-register')` → existing seller registration flow

**Done when:** Buyer sees the correct seller CTA. Approved sellers can jump to seller dashboard in one tap.

---

## Updated Summary (Sprint 5 Additions)

| Task | Priority | Est. |
|------|----------|------|
| NEW-G1: Monthly Winner Banner | 🔴 CRITICAL | 1h |
| NEW-G2: Dynamic Pricing Display | 🔴 CRITICAL | 1.5h |
| NEW-G3: AI Performance (public) | 🟡 HIGH | 1h |
| NEW-G4: Impact Certificate PDF | 🟡 HIGH | 1.5h |
| NEW-G5: Karam Stripe Payment | 🔴 CRITICAL | 2h |
| NEW-G6: Admin Charts + Filters | 🟡 HIGH | 2h |
| NEW-G7: Listing Report System | 🟡 HIGH | 2h |
| NEW-G8: Block + Badge Display | 🟡 HIGH | 0.5h |
| NEW-G9: Dual Role Buyer UI | 🟡 HIGH | 1h |
| **Sprint 5 subtotal** | | **~12.5h** |
| **Grand total** | | **~38h** |

---

*LeftO Tasks — Ghayda | D1 Backend (Helping Frontend) | For Palestine 🇵🇸*
