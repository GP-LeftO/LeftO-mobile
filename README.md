# LeftO Mobile

**Food rescue, built for Palestine.** LeftO connects buyers with local stores selling surplus food at discounted prices, reducing waste and supporting communities. Donations flow to verified charities with full transparency.

> *Too good to waste.*

![React Native](https://img.shields.io/badge/React_Native-0.83-61DAFB?logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-55-000020?logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-Arabic%20%2B%20English-16A34A)

---

## User Roles

| Role | Description |
|------|-------------|
| Buyer | Browses listings, reserves bags, donates to charities |
| Seller | Lists surplus food, manages stock and orders |
| Charity | Receives food donations and distributes to those in need |
| Admin | Reviews and approves seller and charity applications |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React Native + Expo (Managed) | Cross-platform mobile framework |
| TypeScript | Static typing throughout |
| State-machine router (App.tsx) | Custom `stepHistory` stack — no React Navigation |
| Reanimated + FadeIn/FadeOut | Screen transition animations |
| React Native Safe Area Context | Safe area inset handling |
| Axios | HTTP client with token attach + silent 401 refresh |
| AsyncStorage | Token, onboarding, language, reviewed-order-IDs persistence |
| expo-localization | Device language detection |
| Nunito (Google Fonts) | Brand typography (400–800 weights) |
| @expo/vector-icons (Feather) | Icon set used throughout |

---

## Design System

| Token | Value |
|-------|-------|
| Primary orange | `#DE985A` |
| Orange light | `#FFE8D6` |
| Green | `#16A34A` |
| Green light | `#D1FAE5` |
| Background | `#FAFAF8` |
| Text dark | `#404040` |
| Text medium | `#9CA3AF` |

Spacing scale: `4 / 8 / 16 / 24 / 32 / 48` — defined in `src/theme/index.ts`.

---

## Project Structure

```
LeftO-mobile/
├── App.tsx                        # Root state-machine navigator (stepHistory stack)
└── src/
    ├── screens/
    │   ├── onboarding/
    │   │   ├── SplashScreen.tsx
    │   │   ├── LanguageSelectionScreen.tsx
    │   │   └── OnboardingScreen.tsx
    │   ├── auth/
    │   │   ├── PhoneEntryScreen.tsx
    │   │   ├── OTPVerificationScreen.tsx
    │   │   ├── SignInScreen.tsx
    │   │   ├── ForgotPasswordScreen.tsx
    │   │   └── ResetPasswordScreen.tsx
    │   ├── shared/
    │   │   └── NotificationsScreen.tsx
    │   ├── registration/
    │   │   ├── RoleSelectionScreen.tsx
    │   │   ├── BasicInfoScreen.tsx
    │   │   ├── AllergyPreferencesScreen.tsx
    │   │   └── RoleSpecificInfoScreen.tsx
    │   ├── buyer/
    │   │   ├── HomeScreen.tsx          # Discovery + Community sections + post meal modal
    │   │   ├── SearchScreen.tsx        # Live search + filter panel
    │   │   ├── StoreDetailsScreen.tsx  # Listing detail + seller reviews section
    │   │   ├── CheckoutScreen.tsx      # Reserve / Donate checkout
    │   │   ├── OrderConfirmedScreen.tsx
    │   │   ├── DonationConfirmedScreen.tsx
    │   │   ├── CharitySelectorScreen.tsx
    │   │   ├── OrdersScreen.tsx        # Active/Completed/Cancelled + Leave Review + QR buttons
    │   │   ├── QRScanScreen.tsx        # QR token entry → POST /api/orders/:id/scan
    │   │   └── ProfileScreen.tsx       # Full profile: stats, badges, activity, avatar color picker
    │   ├── seller/
    │   │   ├── SellerDashboardScreen.tsx  # 4 tabs: Overview / Listings / Orders / Settings + "Donate" CTA
    │   │   ├── PendingScreen.tsx
    │   │   ├── RejectedScreen.tsx
    │   │   └── donations/
    │   │       ├── SellerDonateSurplusScreen.tsx   # Listing + charity picker + pickup window → POST /api/donations
    │   │       └── SellerDonationsHistoryScreen.tsx # Paginated history: PENDING / PICKED_UP / CONFIRMED badges
    │   └── charity/
    │       ├── CharityDashboardScreen.tsx  # Full: donations list, pickup confirm, proof upload
    │       └── registration/
    │           ├── CharityInfoScreen.tsx
    │           └── CharityDocumentScreen.tsx
    ├── components/
    │   ├── buyer/
    │   │   ├── ListingCard.tsx
    │   │   ├── filters/
    │   │   │   ├── FilterPanel.tsx
    │   │   │   ├── CategoryPicker.tsx
    │   │   │   ├── FreshnessPicker.tsx
    │   │   │   ├── PriceRangeSlider.tsx
    │   │   │   ├── RadiusSelector.tsx
    │   │   │   └── SortOptions.tsx
    │   │   └── profile/
    │   │       ├── BadgeGrid.tsx       # Icon-based badge cards, unlocked/locked states
    │   │       ├── OrderCard.tsx       # Order row + Leave Review bottom sheet modal
    │   │       ├── DonationCard.tsx    # Donation row (green accent, charity name)
    │   │       └── ReviewCard.tsx      # Individual seller review (avatar, stars, comment)
    │   └── shared/
    │       ├── Button.tsx
    │       ├── Chip.tsx
    │       ├── LeafletMap.tsx
    │       ├── OnboardingSlide.tsx
    │       ├── RoleCard.tsx
    │       ├── PaginationDots.tsx
    │       └── LeftOLogo.tsx
    ├── hooks/
    │   ├── auth/
    │   │   └── useAuth.ts
    │   ├── buyer/
    │   │   ├── useListings.ts          # Fetches ACTIVE listings only (status=ACTIVE param)
    │   │   ├── useSearch.ts
    │   │   ├── useSearchFilters.ts
    │   │   ├── useStoreDetails.ts
    │   │   ├── useSellerReviews.ts     # Fetches seller reviews for StoreDetailsScreen
    │   │   ├── useAllergyPreferences.ts
    │   │   └── profile/
    │   │       └── useProfile.ts       # Profile + orders + reviews state + AsyncStorage
    │   ├── seller/
    │   │   ├── useListingForm.ts       # Create/edit listing form state + validation
    │   │   └── useSellerDonations.ts   # Fetches seller donation history (GET /api/donations/me as SELLER)
    │   ├── charity/
    │   │   └── registration/
    │   │       └── useCharityRegistration.ts
    │   └── shared/
    │       └── useColors.ts
    ├── services/
    │   ├── shared/
    │   │   ├── api.ts
    │   │   ├── storage.ts
    │   │   ├── notifications.service.ts   # fetchNotifications, markAllRead, markOneRead
    │   │   └── community.service.ts       # fetchAppConfig, suspended meals, Ramadan bags, postSuspendedMeal
    │   ├── auth/
    │   │   └── auth.service.ts            # + forgotPassword, resetPassword
    │   ├── buyer/
    │   │   ├── listing.service.ts
    │   │   ├── search.service.ts
    │   │   ├── order.service.ts
    │   │   ├── favorites.service.ts
    │   │   └── profile/
    │   │       └── profileService.ts      # + updateUserProfile
    │   ├── charity/
    │   │   ├── charity.service.ts         # fetchCharityDonations, confirmPickup, confirmWithProof
    │   │   └── registration/
    │   │       └── charityRegistration.service.ts
    │   └── seller/
    │       ├── seller.service.ts          # + getSellerOrders, updateSellerProfile
    │       ├── donation.service.ts        # createSellerDonation, fetchSellerDonations
    │       └── document.service.ts
    ├── context/
    │   └── AuthContext.tsx
    ├── types/
    │   ├── index.ts
    │   ├── profile.ts                  # ProfileOrder, ReviewPayload, SellerReview, ToastKey
    │   ├── order.types.ts
    │   └── chatbot.ts
    ├── i18n/
    │   ├── index.ts
    │   ├── en.json
    │   └── ar.json
    └── theme/
        └── index.ts
```

---

## Navigation Model

Custom **state-machine router** — no React Navigation. `App.tsx` maintains a `stepHistory: AppStep[]` stack. Screens receive `onBack` / `onComplete` / `onXxx` callbacks and never import a navigation library.

```
splash → language-selection → onboarding → phone-entry ←→ sign-in → forgot-password → reset-password
  └─► otp → role-selection → basic-info → allergy-prefs (buyer) → role-specific
        ├─► buyer-home
        │     ├─► browse (list + map)
        │     │     └─► store-details → checkout → order-confirmed
        │     │                      └─► charity-selector → donation-confirmed
        │     ├─► search → store-details
        │     ├─► favorites
        │     ├─► orders → qr-scan
        │     ├─► notifications
        │     └─► profile → chatbot
        ├─► seller-dashboard → seller-donate-surplus
        │   pending / rejected  └─► seller-donations-history
        └─► charity-info → charity-document → charity-dashboard
```

---

## Features Built

### Shared / All Roles
- Animated splash screen with gradient background
- Language selection (AR / EN) persisted to AsyncStorage
- 4-slide swipeable onboarding with animated pagination dots
- Phone entry (970 / 972 both show 🇵🇸)
- OTP verification → `POST /api/auth/verify-otp`
- Sign in (phone + password) → role-based routing
- Full registration flow: role → basic info → role-specific info
- Session restore on app launch (existing token skips onboarding)
- Logout clears all state + AsyncStorage
- Full RTL / LTR layout switching via `isRTL()` throughout

### Buyer
| Screen | Status | Details |
|--------|--------|---------|
| HomeScreen | ✅ | 3 sections (Surprise Bags, Parcels, Popular), **ACTIVE listings only** (`status=ACTIVE`), pull-to-refresh, skeleton, error+retry |
| SearchScreen | ✅ | Live search, 500ms debounce, 5 filter types, **client-side ACTIVE filter** (search endpoint has no status param) |
| StoreDetailsScreen | ✅ | Hero, freshness badge, pricing, pickup window, allergen card, rating, **seller reviews list**, map, Reserve + Donate CTAs |
| CheckoutScreen | ✅ | Reserve or Donate flow, cash-on-pickup, quantity picker |
| CharitySelectorScreen | ✅ | List of verified charities with selection |
| OrderConfirmedScreen | ✅ | Order summary with pickup details |
| DonationConfirmedScreen | ✅ | Donation summary |
| OrdersScreen | ✅ | Real orders from `GET /api/orders/me`; Reserved / Completed tabs |
| ProfileScreen | ✅ | Full profile — see details below |
| ChatbotScreen | ✅ | AI assistant, suggested chips, animated typing indicator, per-message RTL |
| NearMeScreen | ✅ | GPS-powered AI chat — finds nearby surplus food, dark theme, store cards, mic button |
| FavoritesScreen | ✅ | Saved stores, optimistic remove, bell toggle, empty state |

---

### Profile Screen (Sprint 2)

Full buyer profile with real data from `GET /api/users/me` and `GET /api/orders/me`.

**Files:**

| File | Role |
|------|------|
| `src/screens/buyer/ProfileScreen.tsx` | FlatList shell, impact grid, badges, activity tabs, footer buttons |
| `src/hooks/buyer/profile/useProfile.ts` | All state: profile, orders, reviewedIds (AsyncStorage-persisted), toast |
| `src/services/buyer/profile/profileService.ts` | `fetchProfile()`, `fetchMyOrders()`, `submitReview()`, `fetchSellerReviews()` |
| `src/components/buyer/profile/BadgeGrid.tsx` | Icon-based badge cards — 6 standard badges, unlocked/locked visual states |
| `src/components/buyer/profile/OrderCard.tsx` | Order row + Leave Review bottom sheet (4 star ratings + comment) |
| `src/components/buyer/profile/DonationCard.tsx` | Donation row (green accent, charity/seller name fallback) |
| `src/components/buyer/profile/ReviewCard.tsx` | Individual review card used in StoreDetailsScreen |
| `src/types/profile.ts` | `ProfileOrder`, `ReviewPayload`, `SellerReview`, `ToastKey` |

**Layout (top → bottom):**

1. **Avatar** — initials from `profile.name`, `avatarColor` from API, disabled camera button
2. **Name, contact, role badge, member since**
3. **Impact grid** (2 × 2, horizontal card layout):
   - Points (`profile.points`)
   - CO₂ Saved (`profile.totalCo2SavedKg` kg)
   - Donations (count of `type=DONATION && status=COMPLETED` orders)
   - Orders (count of `status=COMPLETED && type≠DONATION` orders)
4. **My Badges** — `BadgeGrid` with 6 standard badges always shown (First Bag, Eco Hero, Kind Heart, Loyal Saver, Top Saver, Community Hero). Earned = colorful + glow ring. Unearned = gray dashed + padlock overlay. Extra backend badges auto-resolved via keyword matching.
5. **My Activity** label → segmented Orders / Donations tabs → order/donation cards
6. **Footer:**
   - **AI Assistant** button → opens chatbot
   - **Settings** button → collapses/expands settings panel (Personal Info, Notifications, Pickup Times, Rate LeftO, Terms & Privacy)
   - **Sign Out** button

**Leave Review flow:**
- Button appears on COMPLETED orders only when `sellerId` is present and order hasn't been reviewed
- Bottom sheet: 4 required star dimensions (`ratingOverall`, `ratingPickup`, `ratingQuality`, `ratingVariety`) + optional comment → `POST /api/reviews`
- HTTP 201 → success toast, button hidden
- HTTP 409 (already reviewed) → "Already reviewed" toast, button hidden
- Reviewed order IDs persisted to AsyncStorage (`@lefto_reviewed_order_ids`) — button stays hidden across app restarts

**Known backend note:** `POST /api/reviews` returns HTTP 409 (not 400) for "already reviewed". Both are handled.

---

### Seller Reviews on Store Details (Sprint 2)

Individual reviews now appear below the aggregate rating card on `StoreDetailsScreen`.

- Hook: `src/hooks/buyer/useSellerReviews.ts` — fetches `GET /api/reviews/seller/:id` (limit 10)
- Component: `src/components/buyer/profile/ReviewCard.tsx` — buyer avatar (initials), overall star rating, comment, date
- Shows spinner while loading, "No reviews yet" when empty
- Full RTL support

---

### Active Listing Filter (Sprint 2)

`SOLD_OUT` and `EXPIRED` listings no longer appear anywhere in the buyer experience.

| Screen | Fix |
|--------|-----|
| HomeScreen | `GET /api/listings` now passes `status=ACTIVE` query param |
| Browse / Map | `GET /api/listings` same fix via `useListings` |
| Search | `GET /api/listings/search` has no status param — results filtered client-side: `raw.filter(l => l.status === "ACTIVE")` |

---

### Near Me — "اسألني الآن 📍" (Sprint 3)

AI-powered GPS discovery feature. Buyer taps the entry button on Home, grants location permission, and enters an immersive dark chat interface that automatically finds nearby surplus food listings and renders them as tappable store cards inside AI reply bubbles.

**Files:**

| File | Role |
|------|------|
| `src/screens/buyer/nearMe/NearMeScreen.tsx` | Main screen — dark navy gradient, header with pulsing pin, inverted chat FlatList, input bar + mic button |
| `src/hooks/buyer/nearMe/useNearMe.ts` | All state: messages, loading, auto-send on mount, Haversine distance calc, sorts by distance |
| `src/services/buyer/nearMe/nearMeService.ts` | `getNearbyListings()` → `GET /api/listings?latitude=&longitude=&radius=&status=ACTIVE`; `getChatbotNearMeReply()` → `POST /api/chatbot/message` with location coords |
| `src/types/nearMe.ts` | `NearMeListing`, `NearMeSeller`, `NearMeMessage`, `NearMeCoords`, `NearMeQueryParams` — derived from live API |
| `src/components/buyer/nearMe/NearMeChatBubble.tsx` | User bubble (orange, RTL) + AI bubble (dark card) with embedded horizontal FlatList of store cards |
| `src/components/buyer/nearMe/StoreCardResult.tsx` | Dark card with orange left-border accent — shows store name, category, discount %, distance, pickup time, quantity, price |
| `src/components/buyer/nearMe/LocationPinLoader.tsx` | 3-phase animation: pin drops (spring), bounces (squish), ripple rings expand in loop |
| `src/components/buyer/nearMe/NearMeMicButton.tsx` | 64px circular orange button, pulse ring animation while listening, spinner while processing |
| `src/components/shared/NearMeEntryButton.tsx` | Pulsing "اسألني الآن 📍" button on Home; handles `expo-location` permission request + branded permission dialog |

**Flow:**
1. Buyer taps "اسألني الآن 📍" on Home → `NearMeEntryButton` requests GPS permission
2. If denied → branded modal explains why (LeftO never shares location)
3. If granted → get coords → navigate to `NearMeScreen` passing `{ latitude, longitude }`
4. Screen opens with `LocationPinLoader` animation (1.5 s) then auto-sends "إيش في قريب مني؟ 🗺️"
5. Hook fires two parallel requests: `GET /api/listings` (location-filtered) + `POST /api/chatbot/message` (with lat/lng)
6. Store results sorted by Haversine distance, shown as `StoreCardResult` inside the AI bubble
7. Buyer can keep chatting (text or mic) to refine results; each message re-queries both endpoints

**API endpoints used:**

| Method | Endpoint | Params |
|--------|----------|--------|
| GET | `/api/listings` | `latitude`, `longitude`, `radius=10`, `status=ACTIVE`, `limit=8` |
| POST | `/api/chatbot/message` | body: `{ message, lat, lng }` |

**Navigation:** Added `"near-me"` to `AppStep` in `App.tsx`. Accessed only from Home — back button returns to Home. No bottom tab.

**Visual identity:** Dark gradient `#1A1A2E → #16213E → #0F3460`. Accent `#FF6B35`. Full RTL, Arabic text throughout.

---

### Chatbot
- `src/screens/buyer/support/ChatbotScreen.tsx`
- `src/hooks/buyer/support/useChatbot.ts`
- `src/services/buyer/support/chatbotService.ts`
- API: `POST /api/chatbot/message` — body: `{ message, lat?, lng? }`, response: `{ reply }`
- 4 Arabic suggested-question chips, hidden after first message sent
- Inverted FlatList, animated 3-dot typing indicator
- Per-message RTL via `isArabicText()` helper

### Favorites
- `GET /api/favorites/me` — list of saved sellers with latest listing
- Bell icon toggles per-store notifications (local state only)
- Heart icon removes optimistically → `DELETE /api/favorites/:sellerId` — reverts on failure
- Skeleton, empty state with Browse CTA, full RTL

### Seller
| Screen | Details |
|--------|---------|
| Registration | Business name, type, map location, description, document upload → `POST /api/sellers/register` |
| SellerDashboardScreen | `GET /api/listings?sellerId`; Mark Sold Out per listing |
| PendingScreen / RejectedScreen | Status states |

### Charity
| Screen | Details |
|--------|---------|
| CharityInfoScreen | Org name, description, region (map pin), contact phone, registration number. Full RTL. |
| CharityDocumentScreen | JPEG/PNG/PDF upload (max 5 MB), real-time progress bar → `POST /api/auth/register` (CHARITY role) |
| CharityDashboardScreen | Real user name, status badge (Approved / Under Review / Rejected) |

---

## API Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| POST | `/api/auth/send-otp` | PhoneEntryScreen |
| POST | `/api/auth/verify-otp` | OTPVerificationScreen |
| POST | `/api/auth/login` | SignInScreen |
| POST | `/api/auth/register` | BasicInfoScreen, CharityDocumentScreen |
| POST | `/api/auth/refresh` | Axios 401 interceptor (silent) |
| POST | `/api/sellers/register` | RoleSpecificInfoScreen |
| GET | `/api/sellers/me` | seller.service |
| GET | `/api/sellers/:id` | listing.service → StoreDetailsScreen |
| POST | `/api/documents/upload` | document.service, charityRegistration.service |
| GET | `/api/listings` | useListings → Home + Browse (`status=ACTIVE`) |
| GET | `/api/listings/search` | search.service → SearchScreen (client-side ACTIVE filter) |
| GET | `/api/listings/:id` | listing.service → StoreDetailsScreen |
| PATCH | `/api/listings/:id/sold-out` | SellerDashboardScreen |
| GET | `/api/users/me` | profileService → ProfileScreen |
| GET | `/api/orders/me` | order.service → OrdersScreen; profileService → ProfileScreen |
| POST | `/api/reviews` | profileService → OrderCard. Fields: `orderId`, `sellerId`, `ratingOverall`, `ratingPickup`, `ratingQuality`, `ratingVariety` (1–5 int), `comment?` |
| GET | `/api/reviews/seller/:id` | useSellerReviews → StoreDetailsScreen (limit=10) |
| GET | `/api/favorites/me` | favorites.service → FavoritesScreen |
| DELETE | `/api/favorites/:sellerId` | favorites.service → FavoritesScreen (optimistic) |
| POST | `/api/chatbot/message` | chatbotService → ChatbotScreen |
| GET | `/api/charities` | CharitySelectorScreen |
| POST | `/api/orders` | order.service → CheckoutScreen (reserve + donate) |
| GET | `/api/listings` | nearMeService → NearMeScreen (with `latitude`, `longitude`, `radius`, `status=ACTIVE`) |
| POST | `/api/chatbot/message` | nearMeService → NearMeScreen (with `lat`, `lng` for location-aware AI reply) |
| POST | `/api/auth/forgot-password` | ForgotPasswordScreen |
| POST | `/api/auth/reset-password` | ResetPasswordScreen |
| GET | `/api/notifications/me` | NotificationsScreen |
| PATCH | `/api/notifications/me/read-all` | NotificationsScreen |
| GET | `/api/donations/me` | CharityDashboardScreen (as CHARITY) |
| PATCH | `/api/donations/:id/pickup` | CharityDashboardScreen |
| PATCH | `/api/donations/:id/confirm` | CharityDashboardScreen (multipart proof upload) |
| GET | `/api/sellers/me/orders` | SellerDashboardScreen → Orders tab |
| PATCH | `/api/sellers/me` | SellerDashboardScreen → Settings tab |
| POST | `/api/donations` | SellerDonateSurplusScreen |
| GET | `/api/donations/me` | SellerDonationsHistoryScreen (as SELLER) |
| GET | `/api/app/config` | community.service → HomeScreen (isRamadanSeason) |
| POST | `/api/orders/:id/scan` | QRScanScreen |
| PATCH | `/api/users/me` | profileService → ProfileScreen (avatarColor) |
| POST | `/api/listings` (type=SUSPENDED_MEAL) | community.service → HomeScreen post meal modal |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (Railway-hosted) |
| `EXPO_PUBLIC_REPL_ID` | Replit environment ID (injected by workflow) |

---

## Getting Started

```bash
# Install
cd LeftO-mobile && npm install

# Start dev server
npx expo start

# TypeScript check
npx tsc --noEmit
```

---

## Listing Types, Freshness & Enums

| Type | API value |
|------|-----------|
| Surprise Bag | `MEAL_BAG` |
| Specific Parcel | `SPECIFIC_PARCEL` |

| Freshness badge | API value | Color |
|----------------|-----------|-------|
| Eat Today | `eat_today` | Green |
| Fresh Tonight | `fresh_tonight` | Orange |
| Good 1–2 Days | `good_1_2_days` | Red |

| Listing status | API value |
|----------------|-----------|
| Available | `ACTIVE` |
| Sold out | `SOLD_OUT` |
| Expired | `EXPIRED` |

| Category | API value |
|----------|-----------|
| Meals | `MEALS` |
| Bread & Pastries | `BREAD_AND_PASTRIES` |
| Groceries | `GROCERIES` |
| Mixed | `MIXED` |

---

## Sprint Status

### ✅ Sprint 1 — Core Buyer Flow
- Onboarding, auth, role selection, registration
- Home, Search, Browse (list + map), StoreDetails
- Reserve/Donate checkout flow
- Favorites
- Chatbot (AI assistant)
- Seller dashboard + registration
- Charity registration + dashboard

### ✅ Sprint 2 — Profile, Reviews & Data Quality

| Feature | Status |
|---------|--------|
| Buyer Profile Screen (avatar, stats, badges, tabs) | ✅ Done |
| Leave Review (4 stars + comment → POST /api/reviews) | ✅ Done |
| 409 "already reviewed" handled correctly | ✅ Done |
| Reviewed IDs persisted to AsyncStorage | ✅ Done |
| Seller reviews list on StoreDetailsScreen | ✅ Done |
| SOLD_OUT / EXPIRED listings hidden everywhere | ✅ Done |
| Profile response unwrapping fix (was showing "?" / "—") | ✅ Done |
| Donation + Order counts show COMPLETED only | ✅ Done |
| Impact grid redesign (2×2, horizontal cards) | ✅ Done |
| BadgeGrid redesign (icon-based cards, 6 standard badges) | ✅ Done |
| Settings panel (collapsible, AI Assistant + Settings buttons) | ✅ Done |

### ✅ Sprint 3 — Near Me Feature
| Feature | Status |
|---------|--------|
| "اسألني الآن 📍" entry button on Home | ✅ Done |
| GPS permission flow with branded dialog | ✅ Done |
| NearMeScreen — dark navy gradient, immersive UI | ✅ Done |
| LocationPinLoader animation (drop + bounce + ripple) | ✅ Done |
| Auto-send opening message on screen open | ✅ Done |
| AI reply + store cards in same bubble | ✅ Done |
| Distance calculation (Haversine, sorted nearest-first) | ✅ Done |
| StoreCardResult — discount %, distance, pickup window | ✅ Done |
| Tapping store card opens StoreDetailsScreen | ✅ Done |
| Mic button UI with pulse animation | ✅ Done |
| Quick chips for common refinements | ✅ Done |
| Full RTL layout, Arabic text throughout | ✅ Done |
| TypeScript types from live API response shapes | ✅ Done |

**Note:** Voice-to-text (mic button transcription) requires `@react-native-voice/voice` which is not yet installed. The mic button is fully UI-complete; tapping it currently focuses the text input as a fallback.

### ✅ Sprint 5 — Foundation & Community Features

#### Auth
| Feature | Files | Details |
|---------|-------|---------|
| Forgot Password | `src/screens/auth/ForgotPasswordScreen.tsx` | Phone entry → `POST /api/auth/forgot-password` → go to ResetPassword |
| Reset Password | `src/screens/auth/ResetPasswordScreen.tsx` | OTP + new password + confirm → `POST /api/auth/reset-password` |
| "Forgot password?" link | `SignInScreen.tsx` | Added below password field, wired to `forgot-password` step |

New `AppStep` values: `"forgot-password"`, `"reset-password"`.
New service calls in `auth.service.ts`: `forgotPassword(phone)`, `resetPassword(phone, otp, newPassword)`.

#### Charity Dashboard (Full Rebuild)
Previous: placeholder card. Now: fully functional dashboard.

| File | Role |
|------|------|
| `src/screens/charity/CharityDashboardScreen.tsx` | Replaced placeholder — 2 tabs (Pending / History), 4 stat cards, donation list with actions |
| `src/services/charity/charity.service.ts` | `fetchCharityDonations()`, `confirmDonationPickup()`, `confirmDonationWithProof()` |

**Features:**
- `GET /api/donations/me` — loads all donations for the charity
- Pending tab: donations with status `PENDING` or `CONFIRMED`
- History tab: `PICKED_UP` or `CANCELLED`
- **Confirm Pickup** button → `PATCH /api/donations/:id/pickup`
- **Upload Proof** (image picker via `expo-image-picker`) + **Confirm with Proof** → `PATCH /api/donations/:id/confirm` (multipart)
- Pull-to-refresh, loading/error states, full RTL

#### Notifications
| File | Role |
|------|------|
| `src/screens/shared/NotificationsScreen.tsx` | Full list with type icons, unread dot, "Mark all read" |
| `src/services/shared/notifications.service.ts` | `fetchNotifications()`, `markAllRead()`, `markOneRead()` |

- Bell icon with unread badge added to `HomeScreen` header
- `onOpenNotifications` prop threaded from `App.tsx` → `BuyerTabNavigator` → `HomeScreen`
- `GET /api/notifications/me` on load + pull-to-refresh
- `PATCH /api/notifications/me/read-all` when tapping "Mark all read"
- Type-based icon colours (order, donation, system, etc.)
- Unread count polled on tab navigator mount

New `AppStep`: `"notifications"`.

#### Seller Dashboard — Orders, Settings, Donate Surplus
The seller dashboard gained a 4th **Orders** tab and real Settings form. Donate Surplus is a dedicated screen flow.

| Feature | API | Notes |
|---------|-----|-------|
| Orders tab | `GET /api/sellers/me/orders` | Shows status badge, buyer name, listing title, total price |
| Settings tab (real form) | `PATCH /api/sellers/me` | Business name, description, contact phone, website — pre-populated from profile |
| Donate Surplus flow | `POST /api/donations` | Dedicated `SellerDonateSurplusScreen` — listing picker, charity picker, quantity, pickup window |
| Donations history | `GET /api/donations/me` | Dedicated `SellerDonationsHistoryScreen` — status badges: PENDING / PICKED_UP / CONFIRMED |

New service: `seller/donation.service.ts` (`createSellerDonation()`, `fetchSellerDonations()`).
New hook: `useSellerDonations.ts`.
New `AppStep` values: `"seller-donate-surplus"`, `"seller-donations-history"`.

#### Community Sections — وجبات معلقة + Ramadan Bags

| File | Role |
|------|------|
| `src/services/shared/community.service.ts` | `fetchAppConfig()`, `fetchSuspendedMeals()`, `fetchRamadanBags()`, `postSuspendedMeal()`, `claimCommunityListing()` |

**HomeScreen additions:**
- **وجبات معلقة 💚 (Free Meals)** — horizontal scroll of community-posted free meals. Any user can claim (→ `POST /api/orders` type=PURCHASE, price=0) or share (bottom sheet modal → `POST /api/listings` type=SUSPENDED_MEAL).
- **Ramadan Bags 🌙** — shown only when `GET /api/app/config → isRamadanSeason: true`. Purple banner + horizontal scroll of Ramadan listings.
- Share Meal modal: title, quantity, pickup from/to fields.

#### QR Scanner
| File | Notes |
|------|-------|
| `src/screens/buyer/QRScanScreen.tsx` | Manual token entry (camera SDK not installed). Calls `POST /api/orders/:id/scan { token }`. |

- **Scan QR** button added alongside existing **Show QR** in `OrdersScreen` active orders.
- Frame UI with orange corner brackets ready for camera integration.
- New `AppStep`: `"qr-scan"`. Prop: `onOpenQRScan` threaded through `BuyerTabNavigator` → `OrdersScreen`.
- To activate camera scanning: install `expo-camera`, replace the token input with a `CameraView` barcode scanner.

#### Avatar Customization
- `updateUserProfile({ avatarColor })` added to `profileService.ts` → `PATCH /api/users/me`
- Tapping the camera icon on the avatar opens a 10-color swatch picker (bottom sheet modal)
- Selected color applied immediately (optimistic) + persisted to backend
- Color persists across sessions via `GET /api/users/me → profile.avatarColor`

#### Leave Review from Orders Screen
- **Leave Review** button added to Completed orders in `OrdersScreen` (was only in ProfileScreen)
- Full 4-star review bottom sheet (Overall / Pickup / Quality / Variety + optional comment)
- `POST /api/reviews` via `submitReview()` from `profileService.ts`
- Reviewed order IDs tracked in local state; button disappears after submit

### ✅ Sprint 6 — Seller Donate Surplus

| Feature | Files | Details |
|---------|-------|---------|
| Donate Surplus screen | `src/screens/seller/donations/SellerDonateSurplusScreen.tsx` | Listing picker, charity picker, quantity input, pickup window (HH:MM) → `POST /api/donations` |
| Donations history screen | `src/screens/seller/donations/SellerDonationsHistoryScreen.tsx` | Paginated list with animated status badges — PENDING / PICKED_UP / CONFIRMED. Pull-to-refresh. |
| Seller donations hook | `src/hooks/seller/useSellerDonations.ts` | Fetches `GET /api/donations/me` as SELLER, auto-load on mount |
| Seller donation service | `src/services/seller/donation.service.ts` | `createSellerDonation()`, `fetchSellerDonations()` |

New `AppStep` values: `"seller-donate-surplus"`, `"seller-donations-history"`.
"Donate Surplus" CTA on listing cards in the Listings tab navigates to `SellerDonateSurplusScreen` with the selected listing passed as prop.

---

### 🔲 Remaining / Next

| Feature | Notes |
|---------|-------|
| Voice recognition for mic button | Install `@react-native-voice/voice`, wire to `sendNearMeQuery` |
| QR camera scanning | Install `expo-camera`, replace manual token entry in `QRScanScreen` |
| FCM push notifications | Install Firebase SDK, call `PUT /api/auth/fcm-token` on login |
| Allergy preferences editing | `GET /api/users/me` returns `[]` always — backend fix needed |
| Preferred Pickup Times | No API endpoint yet |
| Rate LeftO | Needs app store link wired in |
| Terms & Privacy | Content/screen not yet built |
| Seller reviews pagination | Currently loads max 10 — add "load more" |
| Seller profile page | View seller's full public profile |
| Ramadan bags — post form | Sellers can post RAMADAN_BAG listings (currently only admins toggle season) |

---

## Known Backend Notes

| Issue | Status |
|-------|--------|
| `POST /api/reviews` returns HTTP 409 for "already reviewed" (Swagger says 400) | Handled on frontend (both 400 + 409 caught) |
| `GET /api/listings/search` has no `status` filter param | Handled client-side |
| `POST /api/auth/register` does not save `allergyPreferences` | Pending backend fix |
| `PATCH /api/users/me` — no endpoint for profile editing | Pending backend implementation |

---

## Pending Tests

### Charity Registration
Requires a valid `registrationNumber` from the backend seed data (`MOI-10002` etc.).

- [ ] Full flow with seeded registration number → `status: "APPROVED"`
- [ ] Invalid registration number → 400 error surfaced correctly
- [ ] RTL layout for Region and Registration Number fields

### Reviews
- [ ] Submit review on a COMPLETED order → 201 success, button hidden
- [ ] Submit review twice → 409 handled, "Already reviewed" toast, button still hidden
- [ ] Close app and reopen → reviewed orders still show no Leave Review button (AsyncStorage)
- [ ] Seller reviews appear on StoreDetailsScreen after at least 1 review submitted
