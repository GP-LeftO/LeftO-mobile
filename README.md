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
| Expo Router (file-based) | Routing via `app/` directory |
| Reanimated + FadeIn/FadeOut | Screen transition animations |
| React Native Safe Area Context | Safe area inset handling |
| Axios | HTTP client with token attach + silent 401 refresh |
| AsyncStorage | Token + onboarding + language persistence |
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
artifacts/lefto-mobile/
├── app/
│   └── index.tsx               # Root state-machine navigator (all steps wired here)
├── src/
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── LanguageSelectionScreen.tsx
│   │   │   └── OnboardingScreen.tsx
│   │   ├── auth/
│   │   │   ├── PhoneEntryScreen.tsx
│   │   │   ├── OTPVerificationScreen.tsx
│   │   │   └── SignInScreen.tsx
│   │   ├── registration/
│   │   │   ├── RoleSelectionScreen.tsx
│   │   │   ├── BasicInfoScreen.tsx
│   │   │   ├── AllergyPreferencesScreen.tsx  # buyer-only step 5/6
│   │   │   └── RoleSpecificInfoScreen.tsx
│   │   ├── buyer/
│   │   │   ├── HomeScreen.tsx          # Discovery: Surprise Bags, Parcels, Popular
│   │   │   ├── SearchScreen.tsx        # Live search with debounce
│   │   │   ├── StoreDetailsScreen.tsx  # Full listing + seller detail page
│   │   │   ├── OrdersScreen.tsx        # My orders (Reserved/Completed tabs)
│   │   │   └── ProfileScreen.tsx       # User profile
│   │   ├── seller/
│   │   │   ├── SellerDashboardScreen.tsx
│   │   │   ├── PendingScreen.tsx
│   │   │   └── RejectedScreen.tsx
│   │   └── charity/
│   │       ├── CharityDashboardScreen.tsx
│   │       └── registration/
│   │           ├── CharityInfoScreen.tsx      # Step 4/5: org name, description, region, contact phone
│   │           └── CharityDocumentScreen.tsx  # Step 5/5: document upload → register → dashboard
│   ├── components/
│   │   ├── buyer/
│   │   │   ├── ListingCard.tsx         # Card with freshness badge, price, sold-out overlay
│   │   │   └── filters/
│   │   │       ├── FilterPanel.tsx     # Slide-up Modal bottom sheet (Animated, no lib)
│   │   │       ├── CategoryPicker.tsx  # Horizontal chip row, single-select
│   │   │       ├── FreshnessPicker.tsx # Multi-select chips with emoji badges
│   │   │       ├── PriceRangeSlider.tsx# Dual-thumb slider (PanResponder, no lib)
│   │   │       ├── RadiusSelector.tsx  # Segmented 1 km / 5 km / 10 km control
│   │   │       └── SortOptions.tsx     # Distance / Price / Rating chips
│   │   ├── shared/
│   │   │   ├── Button.tsx
│   │   │   ├── Chip.tsx              # Multi-select toggle chip (allergy prefs)
│   │   │   ├── OnboardingSlide.tsx
│   │   │   ├── RoleCard.tsx
│   │   │   ├── PaginationDots.tsx
│   │   │   └── LeftOLogo.tsx
│   ├── hooks/
│   │   ├── auth/
│   │   │   └── useAuth.ts           # sendOtp, verifyOtp, register, login, logout
│   │   ├── buyer/
│   │   │   ├── useListings.ts       # Fetches all listings, derives 3 sorted arrays
│   │   │   ├── useSearch.ts         # Debounced search (500ms), empty-query short-circuit
│   │   │   ├── useSearchFilters.ts  # Filter state, activeFilterCount, buildQueryParams()
│   │   │   ├── useStoreDetails.ts   # Parallel fetch: listing + seller
│   │   │   └── useAllergyPreferences.ts  # Multi-select toggle state for allergy chips
│   │   ├── charity/
│   │   │   └── registration/
│   │   │       └── useCharityRegistration.ts  # Form state, doc upload, register call
│   │   └── shared/
│   │       └── useColors.ts
│   ├── services/
│   │   ├── shared/
│   │   │   ├── api.ts              # Axios instance: token attach + silent 401 refresh
│   │   │   └── storage.ts
│   │   ├── auth/
│   │   │   └── auth.service.ts     # RegisterParams extended with optional charity fields
│   │   ├── buyer/
│   │   │   ├── listing.service.ts  # getListingById, getSellerById
│   │   │   ├── search.service.ts   # searchListings → GET /api/listings/search
│   │   │   ├── order.service.ts
│   │   │   └── favorites.service.ts
│   │   ├── charity/
│   │   │   └── registration/
│   │   │       └── charityRegistration.service.ts  # uploadCharityDocument wrapper
│   │   └── seller/
│   │       ├── seller.service.ts
│   │       └── document.service.ts
│   ├── context/
│   │   └── AuthContext.tsx     # user, tokens, sellerStatus, charityStatus; persisted
│   ├── i18n/
│   │   ├── index.ts            # t(), isRTL(), setLanguageAsync(), restoreLanguage()
│   │   ├── en.json
│   │   └── ar.json
│   └── theme/
│       └── index.ts            # Colors, Spacing, Typography
```

---

## Navigation Model

This app uses a **state-machine pattern** — no React Navigation tab bar or stack. All screen transitions are managed via a `stepHistory` array in `app/index.tsx`. Each screen receives `onBack` / `onComplete` / `onXxx` callbacks; it never imports a navigation library directly.

```
splash
  └─► language-selection
        └─► onboarding
              └─► phone-entry ◄──── sign-in
                    └─► otp-verification
                          └─► role-selection
                                └─► basic-info
                                      └─► role-specific
                                      └─► allergy-preferences (buyer only)
                                                  └─► role-specific
                                                        ├─► buyer-home ◄──────────────────────┐
                                                        │     ├─► buyer-search                │
                                                        │     │     └─► store-details ─────────┘
                                                        │     ├─► store-details
                                                        │     └─► chatbot (Profile → Customer Support)
                                            ├─► seller-dashboard
                                            ├─► charity-info
                                            │     └─► charity-document
                                            │           └─► charity-dashboard
                                            ├─► charity-dashboard
                                            ├─► under-review
                                            └─► rejected
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

### Registration — Buyer-only step
After Basic Info (step 4/6), buyers see an **Allergy Preferences** screen (step 5/6) with 10 multi-select chips: Gluten, Dairy, Nuts, Eggs, Seafood, Soy, Sesame, Vegetarian, Vegan, Halal only. Selecting and tapping Continue sends `allergyPreferences: string[]` in the `POST /api/auth/register` body. Skip bypasses it. Sellers and charities go directly from Basic Info to role-specific registration.

> **⚠️ Pending backend fix:** `POST /api/auth/register` does not yet accept or save `allergyPreferences` — assigned to backend team. `GET /api/users/me` confirms the field exists in the DB but is always returned as `[]` after fresh registration. No `PATCH /api/users/me` endpoint exists yet to update it post-registration.

### Buyer
| Screen | Details |
|--------|---------|
| HomeScreen | 3 sections: Surprise Bags, Parcels & Groceries, Popular Today — real data from `GET /api/listings`, pull-to-refresh, skeleton loading, error + retry, per-section empty states |
| SearchScreen | Live search bar (auto-focus), 500ms debounce, `GET /api/listings/search`, 5 states: initial / loading skeleton / results / empty / error, RTL icon flip. Smart Filters panel (slide-up modal): category, freshness, price range (dual-thumb slider), radius, sort. Filter count badge on trigger button. Empty-with-filters state has Clear Filters CTA. |
| StoreDetailsScreen | Hero with freshness badge (green/orange/red), discounted price, pickup window, items left, description, allergen card, star rating, map placeholder, Reserve + Donate CTAs, sold-out state |
| OrdersScreen | Real orders from `GET /api/orders/me`; Cancel + Confirm Pickup on RESERVED tab |
| ProfileScreen | Real user data (name, phone, email, member-since) |
| ChatbotScreen | AI assistant accessible from Profile → Customer Support; orange header with 🤖 avatar; 4 Arabic suggested chips (hidden after first message); inverted FlatList with animated 3-dot typing indicator; per-message RTL via `isArabicText()`; error bubble on failure; `KeyboardAvoidingView` |

### Chatbot Screen
- Screen: `src/screens/buyer/support/ChatbotScreen.tsx`
- Hook: `src/hooks/buyer/support/useChatbot.ts`
- Service: `src/services/buyer/support/chatbotService.ts`
- Types: `src/types/chatbot.ts`
- API: POST /api/chatbot/message (shape verified from Swagger)
- Auth: JWT from AuthContext sent in Authorization header
- Message history: session-only, no persistence
- RTL: handled per message bubble, not globally

### Favorites
- View all saved stores with their latest active listing (bag type, pickup window, distance, price)
- Bell icon toggles per-store notifications (local state — no API call required)
- Heart icon removes a store instantly with **optimistic UI** and a success toast; reverts on API failure
- Skeleton loading state while favorites are fetched
- Empty state with CTA to navigate to the Browse screen
- Full Arabic RTL + English LTR layout support

### Seller
| Screen | Details |
|--------|---------|
| Registration | Business name, type (Restaurant / Market / Bakery), map location, description, document upload with progress → `POST /api/sellers/register` |
| SellerDashboardScreen | Listings tab: real data via `GET /api/listings?sellerId`; Mark Sold Out per listing |
| PendingScreen | Under-review state |
| RejectedScreen | Rejection state |

### Charity
| Screen | Path | Details |
|--------|------|---------|
| CharityInfoScreen | `src/screens/charity/registration/CharityInfoScreen.tsx` | Step 4/5 — Collects organization name, description, region (map picker), and contact phone. Validates all fields before allowing Next. Full RTL support. |
| CharityDocumentScreen | `src/screens/charity/registration/CharityDocumentScreen.tsx` | Step 5/5 — Document upload (JPEG/PNG, max 5 MB) with real-time progress bar. On upload success calls `POST /api/auth/register` with role `CHARITY` and all collected form data. Shows success message then navigates to CharityDashboardScreen. On upload failure shows inline error and stays on screen — register is never called. |
| CharityDashboardScreen | `src/screens/charity/CharityDashboardScreen.tsx` | Real user name; status badge (Approved / Under Review / Rejected); quick action cards (coming soon). |
| PendingScreen / RejectedScreen | Shared with seller flow | — |

---

## API Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| POST | `/api/auth/send-otp` | PhoneEntryScreen |
| POST | `/api/auth/verify-otp` | OTPVerificationScreen |
| POST | `/api/auth/login` | SignInScreen |
| POST | `/api/auth/register` | BasicInfoScreen |
| POST | `/api/auth/refresh` | Axios 401 interceptor |
| POST | `/api/sellers/register` | RoleSpecificInfoScreen |
| GET | `/api/sellers/me` | seller.service |
| GET | `/api/sellers/:id` | listing.service → StoreDetailsScreen |
| POST | `/api/documents/upload` | document.service, charityRegistration.service (type: `charity_registration`) |
| GET | `/api/listings` | useListings → HomeScreen |
| GET | `/api/listings/search` | search.service → SearchScreen. Filter params: `category`, `freshnessBadge`, `minPrice`, `maxPrice`, `radius` (km), `sortBy`, `excludeAllergens` (comma-separated) |
| GET | `/api/listings/:id` | listing.service → StoreDetailsScreen |
| PATCH | `/api/listings/:id/sold-out` | SellerDashboardScreen |
| GET | `/api/orders/me` | order.service → OrdersScreen |
| GET | `/api/favorites/me` | favorites.service → FavoritesScreen |
| DELETE | `/api/favorites/:sellerId` | favorites.service → FavoritesScreen (optimistic remove) |
| POST | `/api/chatbot/message` | chatbotService → ChatbotScreen. Body: `{ message, lat?, lng? }`. Response: `{ reply }` |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL (Railway-hosted) |
| `EXPO_PUBLIC_REPL_ID` | Replit environment ID (injected by workflow) |

---

## Getting Started

### Prerequisites
- Node.js 24+
- pnpm 9+
- Expo Go app on your phone

### Installation
```bash
git clone https://github.com/LeftO-Org/LeftO-mobile.git
cd LeftO-mobile
pnpm install
```

### Running the app (Replit)
```bash
pnpm --filter @workspace/lefto-mobile run dev
```

### Running the API server
```bash
pnpm --filter @workspace/api-server run dev
```

### Running the full workspace typecheck
```bash
pnpm run typecheck
```

---

## Listing Types, Freshness Badges & Enums

| Type | API value |
|------|-----------|
| Surprise Bag | `MEAL_BAG` |
| Specific Parcel | `SPECIFIC_PARCEL` |

| Badge | API value | Colour | Meaning |
|-------|-----------|--------|---------|
| Eat Today | `eat_today` | Green | Prepared today, consume same day |
| Fresh Tonight | `fresh_tonight` | Orange | Best consumed tonight |
| Good 1–2 Days | `good_1_2_days` | Red/Amber | Near expiry |

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

AllergyOption values (lowercase, as returned by `GET /api/users/me`):
`gluten` · `dairy` · `nuts` · `eggs` · `seafood` · `soy` · `sesame` · `vegetarian` · `vegan` · `halal_only`


