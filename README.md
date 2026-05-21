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
    │   │   └── SignInScreen.tsx
    │   ├── registration/
    │   │   ├── RoleSelectionScreen.tsx
    │   │   ├── BasicInfoScreen.tsx
    │   │   ├── AllergyPreferencesScreen.tsx
    │   │   └── RoleSpecificInfoScreen.tsx
    │   ├── buyer/
    │   │   ├── HomeScreen.tsx          # Discovery: Surprise Bags, Parcels, Popular
    │   │   ├── SearchScreen.tsx        # Live search + filter panel
    │   │   ├── StoreDetailsScreen.tsx  # Listing detail + seller reviews section
    │   │   ├── CheckoutScreen.tsx      # Reserve / Donate checkout
    │   │   ├── OrderConfirmedScreen.tsx
    │   │   ├── DonationConfirmedScreen.tsx
    │   │   ├── CharitySelectorScreen.tsx
    │   │   ├── OrdersScreen.tsx
    │   │   └── ProfileScreen.tsx       # Full profile: stats, badges, activity, settings
    │   ├── seller/
    │   │   ├── SellerDashboardScreen.tsx
    │   │   ├── PendingScreen.tsx
    │   │   └── RejectedScreen.tsx
    │   └── charity/
    │       ├── CharityDashboardScreen.tsx
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
    │   ├── charity/
    │   │   └── registration/
    │   │       └── useCharityRegistration.ts
    │   └── shared/
    │       └── useColors.ts
    ├── services/
    │   ├── shared/
    │   │   ├── api.ts
    │   │   └── storage.ts
    │   ├── auth/
    │   │   └── auth.service.ts
    │   ├── buyer/
    │   │   ├── listing.service.ts
    │   │   ├── search.service.ts       # Client-side ACTIVE filter for search results
    │   │   ├── order.service.ts
    │   │   ├── favorites.service.ts
    │   │   └── profile/
    │   │       └── profileService.ts   # fetchProfile, fetchMyOrders, submitReview, fetchSellerReviews
    │   ├── charity/
    │   │   └── registration/
    │   │       └── charityRegistration.service.ts
    │   └── seller/
    │       ├── seller.service.ts
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
splash → language-selection → onboarding → phone-entry ←→ sign-in
  └─► otp → role-selection → basic-info → allergy-prefs (buyer) → role-specific
        ├─► buyer-home
        │     ├─► browse (list + map)
        │     │     └─► store-details → checkout → order-confirmed
        │     │                      └─► charity-selector → donation-confirmed
        │     ├─► search → store-details
        │     ├─► favorites
        │     ├─► orders
        │     └─► profile → chatbot
        ├─► seller-dashboard / pending / rejected
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

### 🔲 Sprint 3 — Pending / Next

| Feature | Notes |
|---------|-------|
| Personal Information editing | Needs `PATCH /api/users/me` from backend (endpoint unconfirmed) |
| Avatar photo upload | Same — needs `PATCH /api/users/me` with avatar fields |
| Allergy preferences editing | `GET /api/users/me` returns `[]` always — backend fix needed |
| Notification settings | No push notification API yet — backend to implement |
| Preferred Pickup Times | No API endpoint yet |
| Rate LeftO | Needs app store link wired in |
| Terms & Privacy | Content/screen not yet built |
| Seller reviews pagination | Currently loads max 10 — add "load more" |
| Money Saved stat | `AuthUser.moneySaved` field may not be populated by backend |
| Seller profile page | View seller's full profile + all listings |
| Order cancellation from ProfileScreen | Currently only in OrdersScreen |
| Push notifications | Backend needed |
| Charity receiving flow | Charities accepting / managing incoming donations |

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
