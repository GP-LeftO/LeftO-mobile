# LeftO Mobile

LeftO is a platform that connects customers with surplus good-quality food from local restaurants, markets, and bakeries at reduced prices. Customers can also donate to verified charity organisations, who distribute food to people in need — with full transparency and trust. Built for Palestine, with full Arabic (RTL) and English support.

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
│   │       └── CharityDashboardScreen.tsx
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
│   │   ├── Button.tsx
│   │   ├── OnboardingSlide.tsx
│   │   ├── RoleCard.tsx
│   │   ├── PaginationDots.tsx
│   │   └── LeftOLogo.tsx
│   ├── hooks/
│   │   ├── useAuth.ts           # sendOtp, verifyOtp, register, login, logout
│   │   ├── useSeller.ts         # uploadDocument, registerSeller
│   │   ├── useListings.ts       # Fetches all listings, derives 3 sorted arrays
│   │   ├── useSearch.ts         # Debounced search (500ms), empty-query short-circuit
│   │   ├── useSearchFilters.ts  # Filter state, activeFilterCount, buildQueryParams()
│   │   ├── useStoreDetails.ts   # Parallel fetch: listing + seller
│   │   └── useColors.ts
│   ├── services/
│   │   ├── api.ts              # Axios instance: token attach + silent 401 refresh
│   │   ├── auth.service.ts
│   │   ├── seller.service.ts
│   │   ├── listing.service.ts  # getListingById, getSellerById
│   │   ├── search.service.ts   # searchListings → GET /api/listings/search
│   │   ├── order.service.ts
│   │   ├── document.service.ts
│   │   └── storage.ts
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
                                            ├─► buyer-home ◄──────────────────────┐
                                            │     ├─► buyer-search                │
                                            │     │     └─► store-details ─────────┘
                                            │     └─► store-details
                                            ├─► seller-dashboard
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

### Buyer
| Screen | Details |
|--------|---------|
| HomeScreen | 3 sections: Surprise Bags, Parcels & Groceries, Popular Today — real data from `GET /api/listings`, pull-to-refresh, skeleton loading, error + retry, per-section empty states |
| SearchScreen | Live search bar (auto-focus), 500ms debounce, `GET /api/listings/search`, 5 states: initial / loading skeleton / results / empty / error, RTL icon flip. Smart Filters panel (slide-up modal): category, freshness, price range (dual-thumb slider), radius, sort. Filter count badge on trigger button. Empty-with-filters state has Clear Filters CTA. |
| StoreDetailsScreen | Hero with freshness badge (green/orange/red), discounted price, pickup window, items left, description, allergen card, star rating, map placeholder, Reserve + Donate CTAs, sold-out state |
| OrdersScreen | Real orders from `GET /api/orders/me`; Cancel + Confirm Pickup on RESERVED tab |
| ProfileScreen | Real user data (name, phone, email, member-since) |

### Seller
| Screen | Details |
|--------|---------|
| Registration | Business name, type (Restaurant / Market / Bakery), map location, description, document upload with progress → `POST /api/sellers/register` |
| SellerDashboardScreen | Listings tab: real data via `GET /api/listings?sellerId`; Mark Sold Out per listing |
| PendingScreen | Under-review state |
| RejectedScreen | Rejection state |

### Charity
| Screen | Details |
|--------|---------|
| Registration | Organisation name, reg number, certificate upload, map location → `POST /api/sellers/register` with CHARITY role |
| CharityDashboardScreen | Real user name; quick action cards (coming soon) |
| PendingScreen / RejectedScreen | Shared with seller flow |

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
| POST | `/api/documents/upload` | document.service |
| GET | `/api/listings` | useListings → HomeScreen |
| GET | `/api/listings/search` | search.service → SearchScreen. Filter params: `category` (UPPERCASE enum), `freshness[]`, `minPrice`, `maxPrice`, `radius` (metres), `sortBy` |
| GET | `/api/listings/:id` | listing.service → StoreDetailsScreen |
| PATCH | `/api/listings/:id/sold-out` | SellerDashboardScreen |
| GET | `/api/orders/me` | order.service → OrdersScreen |

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

## Listing Types & Freshness Badges

| Type | API value |
|------|-----------|
| Surprise Bag | `SURPRISE_BAG` |
| Specific Parcel | `SPECIFIC_PARCEL` |

| Badge | Colour | Meaning |
|-------|--------|---------|
| Fresh Today | Green | Prepared today |
| Eat Soon | Orange | Best consumed soon |
| Last Chance | Red | Near expiry |


