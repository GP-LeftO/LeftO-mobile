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

### Bug Fix — Seller Registration Steps Skipped (June 2026)

**Symptom:** After completing `BasicInfoScreen`, new sellers were redirected straight to `PendingScreen` and never saw the 5-step registration form.

**Root cause:** The session-restore `useEffect` in `App.tsx` listens to `ctx.isAuthenticated`. When `register()` is called (inside `handleRegisterAndProceed`) it fires `ctx.saveSession()` which sets `ctx.isAuthenticated = true`. This triggered the effect, which evaluated `resolveHomeRoute("SELLER", null, null)` → `"under-review"` and pushed it onto the step stack before the user could interact with `RoleSpecificInfoScreen`.

**Fix (`App.tsx`):** Added `isRegistrationInProgressRef` (a `useRef<boolean>`). Set to `true` synchronously before `register()` is called; cleared on success, error, or logout. The session-restore effect now returns early while this ref is `true`, so it only redirects on a real cold-start with an existing session — not during fresh registration.

**Secondary fix (`RoleSpecificInfoScreen.tsx`):** After a successful Step 5 submit (`POST /api/sellers/register`), `onPending()` is now called instead of `onComplete()`, so the seller lands on `PendingScreen` (awaiting admin approval) rather than buyer home.

---

### Seller
| Screen | Details |
|--------|---------|
| Registration | **5-step multi-step form** (see below) → `POST /api/sellers/register` |
| SellerDashboardScreen | 4 tabs: Overview / Listings / Orders / Settings. Full listing CRUD actions (see below). |
| ListingFormScreen | Unified Create + Edit form (see Listing CRUD section below) |
| PendingScreen / RejectedScreen | Status states |

#### Seller Listing CRUD

All listing management is handled by a single `ListingFormScreen` that operates in create mode (no `existing` prop) or edit mode (`existing` prop pre-populates all fields).

**Files:**

| File | Role |
|------|------|
| `src/services/seller/seller.service.ts` | `createListing`, `updateListing`, `deleteListing`, `markListingSoldOut` — all raw Axios calls, return typed `SellerListing` |
| `src/hooks/seller/useListingForm.ts` | Full form state, per-field validation, submit logic (calls create or update based on `existing`) |
| `src/screens/seller/listings/ListingFormScreen.tsx` | Render-only form screen — all logic from hook |

**Form fields:**

| Field | Type | Required? | Notes |
|-------|------|-----------|-------|
| نوع الباقة (type) | Chip selector | ✅ | `MEAL_BAG` / `SPECIFIC_PARCEL` |
| عنوان الباقة (title) | TextInput | ✅ | 2–100 chars. AI title scorer runs on blur |
| الفئة (category) | Chip selector | ✅ | `MEALS` / `BREAD_AND_PASTRIES` / `GROCERIES` / `MIXED` |
| الكمية (quantity) | Stepper (+/−) | ✅ | Min 1 |
| السعر الأصلي (originalPrice) | Numeric input | ✅ | Must be positive |
| السعر المخفض (discountedPrice) | Numeric input | ✅ | Must be < originalPrice and ≥ 0.50. AI price suggestion chip appears automatically |
| نافذة الاستلام (pickupStart/End) | Time stepper | ✅ | HH:MM → converted to smart ISO (advances to tomorrow if time has passed) |
| تاريخ الصلاحية (expiryDate) | Date stepper (D/M/Y) | ✅ only for `SPECIFIC_PARCEL` | Hidden for `MEAL_BAG`. Must be a future date |
| طازجية المنتج (freshnessBadge) | Chip selector | ✅ | `eat_today` / `fresh_tonight` / `good_1_2_days` |
| السعر المتناقص (isPriceDecaying) | Switch toggle | — | When ON → reveals floor price field |
| الحد الأدنى للسعر (floorPrice) | Numeric input | ✅ when decaying | Must be < discountedPrice |
| ملاحظة الحساسية (allergenNote) | Multiline text | — | AI auto-detect button uses title to suggest allergens |
| وصف (description) | Multiline text | — | Free text description of bag contents |
| رابط الصورة (photoUrl) | TextInput (URL) | — | Optional image URL |

**Dashboard — Listings tab actions (per card):**

| Button | Behavior |
|--------|----------|
| QR | Opens QR modal — shows `qrCodeUrl` image (220×220), 3 instruction steps, share via `Share.share()` |
| تعديل (Edit) | Navigates to `seller-edit-listing` passing `listing` object |
| نفد (Sold Out) | `Alert` confirm → `PATCH /api/listings/:id/sold-out` → optimistic status update in state |
| حذف (Delete) | `Alert` confirm (destructive) → `DELETE /api/listings/:id` → removes from local list |
| تبرع (Donate) | Navigates to `seller-donate-surplus` passing `listing` |

**Dashboard — FAB:**
- Orange `+` button (bottom-right, 56×56 px) visible only on the Listings tab
- Navigates to `seller-create-listing`

**Navigation entries (App.tsx):**
- `"seller-create-listing"` → `<ListingFormScreen existing={undefined} />`
- `"seller-edit-listing"` → `<ListingFormScreen existing={listingToEdit} />`
- On complete → `dashboardRefreshKey` incremented, which triggers `fetchListings()` in the dashboard

**API endpoints:**

| Method | Endpoint | Hook |
|--------|----------|------|
| POST | `/api/listings` | `useListingForm.submit()` — create mode |
| PUT | `/api/listings/:id` | `useListingForm.submit()` — edit mode |
| DELETE | `/api/listings/:id` | `handleDeleteListing` in SellerDashboardScreen |
| PATCH | `/api/listings/:id/sold-out` | `handleMarkSoldOut` in SellerDashboardScreen |

#### Seller — Karam Program

The **Karam (كرم) program** is a community pay-it-forward feature. Sellers who opt in sponsor meals from their own pool each day, and buyers can claim a sponsored meal from any participating seller. The seller-side UI lives inside `SellerDashboardScreen`.

**Architecture (MVVM):**

| File | Role |
|------|------|
| `src/services/seller/karam.service.ts` | Raw Axios calls: `getKaramBalance`, `toggleParticipation`, `sponsorMeal`, `claimMeal` |
| `src/hooks/seller/useKaram.ts` | All Karam state, optimistic updates, toast notifications — returned as `{ balance, participatesInKaram, loading, actionLoading, sponsor, claim, toggleParticipation }` |
| `src/screens/seller/SellerDashboardScreen.tsx` | Renders Karam card (overview tab) and Karam toggle (settings tab) from hook output |

**Karam balance card (overview tab):**
- Visible only when `karam.participatesInKaram === true`
- Shows today's sponsored / claimed / available counts with `---` placeholders while loading
- **"مول وجبة"** (filled green button): optimistic `sponsored + 1, available + 1`, calls `POST /api/sellers/me/karam/sponsor`, shows success toast on confirm
- **"وجبة مُستلمة"** (green outline button): optimistic `claimed + 1, available − 1`, calls `POST /api/sellers/me/karam/claim`, disabled when `available === 0`, shows `"لا توجد وجبات متاحة اليوم"` on 400
- Both buttons disabled while `actionLoading` is true; RTL-aware layout

**Karam toggle (settings tab):**
- Placed under a `"برنامج كرم"` section header, before the Save button
- `Switch` driven by `karam.participatesInKaram`; while toggling shows `ActivityIndicator` in place of the switch to prevent double-taps
- Calls `PATCH /api/sellers/me/karam` with `{ participatesInKaram: boolean }`, then re-fetches balance if newly enabled

**API endpoints:**

| Method | Endpoint | Hook |
|--------|----------|------|
| GET | `/api/sellers/:id/karam` | `karam.service.getKaramBalance` |
| PATCH | `/api/sellers/me/karam` | `karam.service.toggleParticipation` |
| POST | `/api/sellers/me/karam/sponsor` | `karam.service.sponsorMeal` |
| POST | `/api/sellers/me/karam/claim` | `karam.service.claimMeal` |

---

#### Charity Dashboard — Donations + Basket (`CharityDashboardScreen.tsx`)

Full rewrite that fixes all TypeScript errors from the previous broken implementation.

| File | Role |
|------|------|
| `src/services/charity/charity.service.ts` | Raw Axios calls: `getMyDonations`, `markPickedUp`, `confirmDonation`, `uploadProof`, `rateSellerAfterDonation`, `getMyBasket`, `setMyBasket` |
| `src/hooks/charity/useCharityDonations.ts` | All donation state, optimistic updates, pagination, proof upload pipeline |
| `src/components/charity/DonationIncomingCard.tsx` | Donation card with status badge, pickup info, inline seller rating form |
| `src/components/charity/ProofUploadModal.tsx` | Bottom-sheet modal for proof photo selection (expo-image-picker) + confirm |
| `src/screens/charity/CharityDashboardScreen.tsx` | Full screen: header, impact counter, 4-tab layout, pull-to-refresh |

**4-tab layout:**
- **القادمة (incoming)** → `status === PENDING` — "تم الاستلام" CTA calls `PATCH /api/donations/:id/pickup`
- **مستلمة (pickedUp)** → `status === PICKED_UP` — "رفع إثبات التوزيع" opens `ProofUploadModal`; confirms via `PATCH /api/donations/:id/confirm` with optional photo URL
- **مكتملة (completed)** → `status === CONFIRMED` — inline seller rating form (overall / quality / pickup); submits to `POST /api/reviews/charity`
- **احتياجاتي (basket)** → food need categories the charity publishes for sellers to see; saved via `PUT /api/charities/me/basket`

**Impact counter banner:** shows count of `CONFIRMED` donations in a green banner at the top.

---

#### Seller — Switch to Buyer Mode (Settings Tab)

Sellers can browse the app as a buyer without logging out. A **"تصفح كمشتري 🛍️"** button in the Settings tab calls `switchToBuyerMode()` from `AuthContext`.

- `AuthContext.switchToBuyerMode()` sets `viewMode = "buyer"`
- `App.tsx` detects `viewMode === "buyer" && step === "seller-dashboard"` and pushes `"buyer-home"`
- `BuyerTabNavigator` shows a banner indicating the seller is in buyer-browse mode
- Seller navigates back to their dashboard via `switchToSellerMode()` in the banner

---

#### Checkout — Blocked Account Gate (`CheckoutScreen.tsx`)

If the authenticated user has `isBlocked === true`, `CheckoutScreen` renders a full-page blocked state instead of the normal reservation flow.

- `AuthUser.isBlocked` is populated from the login/session API response and stored in `AuthContext`
- Blocked UI: Feather `"slash"` icon, title "حسابك موقوف مؤقتاً", descriptive body text
- **"تواصل مع الدعم"** button → navigates to `ChatbotScreen` via `onOpenChatbot` prop
- **"رجوع"** button → calls `onBack()`

---

#### Seller Registration — 5-Step Flow (`RoleSpecificInfoScreen.tsx`)

A fully stepped form with a custom 5-dot progress indicator. Buyer and charity paths in the same screen are completely unchanged.

| Step | Label | Fields | Validation |
|------|-------|--------|------------|
| 1 | Business Info | Business type (RESTAURANT / MARKET / BAKERY, required), description (optional), contact phone & website (optional) | Business type required |
| 2 | Location | Map picker **or** manual address toggle | Location required |
| 3 | Registration Number | `registrationNumber` in format `NE-XXXXXX` (required) | `/^NE-\d{6}$/` regex |
| 4 | Documents | Trade License + Health/Food-Safety Certificate (both optional) — uploaded immediately via `POST /api/documents/upload`; "Skip this step" link | None (optional) |
| 5 | Review & Submit | Summary card of all entered info | Submits on tap |

**Registration number behaviour:**
- `400` from backend → navigates back to Step 3, shows Arabic inline error: "رقم التسجيل غير معتمد في قائمتنا"
- `409` → account already exists for this phone
- `200` → `onPending()` called → PendingScreen (under-review until admin approves)

**Document upload:**
- Each file is uploaded to `POST /api/documents/upload` immediately when picked (separate Trade License and Health Certificate uploads)
- Resulting URLs are collected into `documentUrls?: string[]` and sent in the final `POST /api/sellers/register` body
- If documents are skipped, `documentUrls` is omitted from the request body

**API fields sent:**
```ts
{
  businessName: string,        // from registration name
  businessType: "RESTAURANT" | "MARKET" | "BAKERY",
  location: { latitude, longitude, address? },
  description?: string,
  registrationNumber: string,  // NE-XXXXXX
  contactInfo?: { phone?, website? },
  documentUrls?: string[]      // omitted when no documents uploaded
}
```

### Charity
| Screen | Details |
|--------|---------|
| CharityInfoScreen | Org name, description, region (map pin), contact phone, registration number. Full RTL. |
| CharityDocumentScreen | JPEG/PNG/PDF upload (max 5 MB), real-time progress bar → `POST /api/auth/register` (CHARITY role) |
| CharityDashboardScreen | Full MVVM rewrite — 3-tab layout (Incoming / Picked Up / Completed), impact counter, inline seller rating, proof upload modal. See changelog below. |

---

## API Endpoints Used

| Method | Endpoint | Used by |
|--------|----------|---------|
| POST | `/api/auth/send-otp` | PhoneEntryScreen |
| POST | `/api/auth/verify-otp` | OTPVerificationScreen |
| POST | `/api/auth/login` | SignInScreen; PhoneEntryScreen (pre-OTP existence check) |
| POST | `/api/auth/register` | BasicInfoScreen, CharityDocumentScreen |
| POST | `/api/auth/refresh` | Axios 401 interceptor (silent) |
| POST | `/api/sellers/register` | RoleSpecificInfoScreen |
| GET | `/api/sellers/me` | seller.service |
| GET | `/api/sellers/:id` | listing.service → StoreDetailsScreen |
| POST | `/api/documents/upload` | document.service, charityRegistration.service |
| GET | `/api/listings` | useListings → Home + Browse (`status=ACTIVE`) |
| GET | `/api/listings/search` | search.service → SearchScreen (client-side ACTIVE filter) |
| GET | `/api/listings/:id` | listing.service → StoreDetailsScreen |
| POST | `/api/listings` | useListingForm → ListingFormScreen (create) |
| PUT | `/api/listings/:id` | useListingForm → ListingFormScreen (edit) |
| DELETE | `/api/listings/:id` | seller.service → SellerDashboardScreen |
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

#### Charity Dashboard (Full MVVM Rewrite — T0-1)

Complete rewrite. Separate service, hook, and two new components. Screen is now a pure view.

| File | Role |
|------|------|
| `src/screens/charity/CharityDashboardScreen.tsx` | Pure view — no API calls. 3-tab layout, impact banner, modal wiring |
| `src/hooks/charity/useCharityDonations.ts` | All state: pagination, optimistic updates, rated-set tracking |
| `src/services/charity/charity.service.ts` | `getMyDonations()`, `markPickedUp()`, `confirmDonation()`, `uploadProof()`, `rateSellerAfterDonation()` |
| `src/components/charity/DonationIncomingCard.tsx` | Presentational card — adapts CTA and rating UI per tab mode |
| `src/components/charity/ProofUploadModal.tsx` | Bottom-sheet modal with optional photo selection via `expo-image-picker` |

**3-tab layout:**

| Tab | Status filter | CTA |
|-----|--------------|-----|
| قادم (Incoming) | `PENDING` | "تم الاستلام" → `PATCH /api/donations/:id/pickup` (optimistic) |
| مستلمة (Picked Up) | `PICKED_UP` | "رفع إثبات التوزيع" → opens `ProofUploadModal` → upload + `PATCH /api/donations/:id/confirm` |
| مكتملة (Completed) | `CONFIRMED` | Inline star-rating form (3 rows + comment) → `POST /api/reviews/charity`; shows "تم التقييم ✓" once submitted |

**Additional features:**
- Impact banner: large green count of `CONFIRMED` donations + "وجبة استلمتموها حتى الآن 🤝"
- Paginated load (`page` + `limit=10`) with `loadMore()` on scroll
- Pull-to-refresh resets to page 1
- Optimistic status update for mark-picked-up (reverts on error)
- Rated donation IDs tracked in local `Set<string>` — persists within session
- Full RTL on every flex container and text alignment
- Proof photo upload: `POST /api/documents/upload` (multipart) → `fileUrl` → confirm body

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

### ✅ Sprint 7 — UX Guards & Auth Polish

#### Early Phone Existence Check

Prevents users from reaching step 5 of registration only to discover their phone is already registered.

| File | Change |
|------|--------|
| `src/screens/auth/PhoneEntryScreen.tsx` | Pre-OTP probe on Continue tap; `checking` state; inline error + "Sign in instead" link |
| `src/services/auth/auth.service.ts` | `checkPhoneExists(phone): Promise<boolean>` — login probe with sentinel password |

**Flow:**
1. User taps **Send Code** → button shows spinner immediately
2. `checkPhoneExists` calls `POST /api/auth/login` with `password: "____probe____"`
3. `401 "Invalid credentials"` → user found (wrong password) → phone **exists** → inline error shown, `send-otp` never called
4. `404` → user not found → phone is free → proceed to `POST /api/auth/send-otp` → navigate to OTP screen
5. `200` → somehow authenticated → phone exists → inline error shown
6. `5xx` / network error → fail open, proceed to OTP (registration endpoint is the real server-side guard)

**Error UI:** Inline below phone input — `"This number is already registered."` + tappable `"Sign in instead →"` that calls `onSignIn`. No modal, no automatic navigation. Continue button loading covers both the probe and OTP call.

**⚠️ Pending backend fix:** The backend currently returns `401 "Invalid credentials"` for both unknown and wrong-password cases (security measure). The probe requires the backend to return `404 NotFoundException` when the phone is not found, keeping `401` only for wrong-password. Until that change is deployed, the probe fails open and does not block registration.

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

---

## Bug Fixes — Seller Dashboard (June 2026)

Four interconnected bugs in the seller dashboard and registration flow were identified and fixed. All changes are surgical — no rewrites, no new dependencies.

---

### BUG 1 — Map in Seller Registration (Step 2) Lacked GPS Pre-centering

**Symptom:** Tapping "Choose on map" in seller step 2 opened the map at the default Palestine-wide zoom with no indication of the user's location. On devices where location permission had not yet been granted, nothing happened when pressing the "My Location" button inside the map.

**Root cause:** The map modal was opened with `setShowMap(true)` directly, without first requesting location permission or pre-loading the user's GPS position.

**Fix (`RoleSpecificInfoScreen.tsx`):**
- Added `expo-location` and `Linking` imports.
- Added `openSellerMap()` async function that: (1) requests `foregroundPermissionsAsync`, (2) if denied — sets `locationPermDenied` state and shows an inline error banner with a **Settings** deep-link button, (3) if granted — calls `getCurrentPositionAsync` and passes the result as `mapInitLocation` to `MapLocationPicker` so the map opens centered on the user.
- Both the "Choose on map" button and the "Tap to change" card now call `openSellerMap()` instead of `setShowMap(true)`.
- The `Modal`-wrapped `MapLocationPicker` now receives `initialLocation={mapInitLocation ?? pickedLocation ?? undefined}`, prioritizing the live GPS fix over any previously picked location.

---

### BUG 2 — Orders Tab Loaded Infinitely (Never Showed Orders or Empty State)

**Symptom:** Switching to the Orders tab showed a loading spinner that never resolved.

**Root cause (two-part):**
1. **`useSellerOrders.ts`** — `fetchOrders` was wrapped in `useCallback([page])`. Every time `page` incremented (on each successful fetch), `fetchOrders` was recreated as a new function reference.
2. **`SellerDashboardScreen.tsx`** — A `useEffect` had `fetchOrders` in its dependency array: `useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [activeTab, fetchOrders])`. This meant: each page increment → new `fetchOrders` reference → effect fired → `fetchOrders` ran → page incremented → new reference → **infinite loop**. Additionally, **identical effect blocks were registered twice** (lines ~266–281 and ~348–351), both firing simultaneously.

**Fix:**
- `useSellerOrders.ts`: replaced `page` state in `useCallback` with `pageRef = useRef(1)`. `fetchOrders` is now a stable function reference (`useCallback([], [])`). Also removed `pickupStart`/`pickupEnd` from `SellerOrder` (backend does not return these on the orders endpoint).
- `SellerDashboardScreen.tsx`: removed the four duplicate `useEffect` blocks at lines 348–351. Fixed the orders effect to `useEffect(() => { if (activeTab === "orders") fetchOrders(true); }, [activeTab])` — reset=true on tab switch, `fetchOrders` omitted from deps.

---

### BUG 3 — Settings "Save" Toast Fired but Changes Were Never Persisted

**Symptom:** Tapping "Save Changes" showed the success banner, but phone, website, social media, and other fields reverted to their old values on the next profile load.

**Root cause:** The Swagger schema for `PATCH /api/sellers/me` expects **flat top-level fields** (`phone`, `website`, `socialMedia`, `description`). The frontend was sending them **nested** under a `contactInfo` object, which the backend silently ignored. Additionally, `businessName` and `location` were included in the body but are not accepted by this endpoint.

**Fix:**
- `seller.service.ts`: updated `UpdateSellerParams` interface to match the actual backend schema (flat fields, no `contactInfo` nesting).
- `SellerDashboardScreen.tsx`: rewrote `handleSaveSettings` to send `{ description, phone, website, socialMedia }` as flat root-level fields. Removed `businessName` and `location` (not updatable via this endpoint). Removed the unsupported `address` field from both `SettingsForm` and the settings tab UI.
- Updated `fetchProfile` and the settings pre-population `useEffect` to read from `p.phone`, `p.website`, `p.socialMedia` directly (with `p.contactInfo?.phone` fallback for backwards compat).
- Updated `SellerProfile` interface to include flat fields alongside legacy nested fields.
- Fixed overview tab to read `profile?.phone ?? profile?.contactInfo?.phone` (flat first).

---

### BUG 4 — Seller Listing Card Was Poorly Formed

**Symptom:** Listing cards in the seller dashboard showed a plain horizontal row with a package icon, title, quantity, and a small price — no photo, no status context, and action buttons were inaccessible on narrow devices. TypeScript also reported `styles.listingCardInner` (non-existent style key).

**Fix (`SellerDashboardScreen.tsx`):**
- Added `Image` to React Native imports.
- Replaced the inline listing row with a new `SellerListingCard` sub-component (defined in the same file). Layout:
  - **110px image block** — shows `listing.photoUrl` if set, otherwise a category-colored background with a contextual emoji (🍱 / 🥖 / 🛒 / 🎁).
  - **Status badge overlay** (top-left) — green Active / red Sold Out / gray Expired.
  - **Freshness badge overlay** (top-right) — amber Eat Today / blue Fresh Tonight / green 1-2 Days.
  - **Title row** with type chip (Bag / Parcel).
  - **Pickup time** and **quantity** meta rows.
  - **Price row** — original price with strikethrough, discounted price in orange, green discount-% pill.
  - **5-button action strip** separated by hairline dividers: QR (placeholder), Edit, Sold Out, Delete, Donate (shown only if `onDonateFromListing` prop is provided).
- Fixed `profile?.activeListings` → `profile?.activeListingsCount` (TS typo).
- Removed two duplicate style definitions (`saveBtn`, `saveBtnText`, `settingsField`, `settingsInput`) that caused TS `TS1117` errors.
- Removed the second duplicate ORDERS JSX block (lines ~681–756) and the dead DONATIONS JSX block (`activeTab === "donations"` — unreachable since no such tab exists) which both referenced non-existent styles and wrong config field names (`cfg.bg`, `cfg.ar`, `cfg.en`).
- Added missing `stateText` style definition.

---

## Bug Fixes & Features — Seller Listing Flow (June 2026)

Four fixes across the seller listing and donation screens. No new dependencies installed. Zero buyer/charity/backend changes.

---

### FIX 1 — "X" Button on Listing Card Now Marks as Sold Out (with Confirmation)

**Before:** Tapping the "X" button on a listing card silently called `PATCH /api/listings/:id/sold-out` with no confirmation and then re-fetched the full listings list from the network.

**After:**
- Tapping "X" shows a confirmation alert: *"تحديد كنفد؟ — سيتم تحديد هذا الإدراج كنافد الكمية..."*
- On confirm: API is called, listing state is updated **locally** (no re-fetch), a floating success toast appears: *"تم تحديد الإدراج كنافد"*.
- `SOLD_OUT` cards dim to `opacity: 0.7`, their status badge changes to gray *"نفد ●"*, and the "X" button is hidden (no point marking sold-out again).
- The "X" button color changed from red to gray `#6B7280` to match its non-destructive nature (it doesn't delete data).

**Files changed:** `SellerDashboardScreen.tsx`

---

### FIX 2 — QR Code Button Opens a Proper Explanation Modal

**Before:** The "QR" button on every listing card showed a placeholder `Alert.alert("Coming soon")`.

**After:** Opens a full modal with:
- The listing's QR code image rendered from `listing.qrCodeUrl` (base64 data URL — displayed directly via React Native `Image`).
- If `qrCodeUrl` is null/undefined: a placeholder message with a re-publish hint.
- A 3-step instruction block explaining the pickup flow (display in shop → buyer scans → confirmed automatically).
- A 24-hour expiry warning banner.
- **Share** button via React Native `Share.share()` API.
- **Close** button.

**New field:** `qrCodeUrl?: string` added to `SellerListing` interface in `seller.service.ts`.

**Files changed:** `SellerDashboardScreen.tsx`, `src/services/seller/seller.service.ts`

---

### FIX 3 — Pickup Time Picker: Arrow Incrementer Replaces Free-Text Input

**Before:** The donate surplus screen had two free-text inputs for pickup start/end times (expecting `HH:MM` format). Error-prone and gave no visual feedback.

**After:** Both fields are replaced with a new `TimeArrowPicker` component — up/down chevron arrows for hour (0–23) and minute (snaps to 0, 15, 30, 45 increments), plus an ص/م (AM/PM) toggle. The `Confirm Donation` button is disabled when end time ≤ start time, and an inline Arabic error explains why.

**New component:** `src/components/shared/TimeArrowPicker.tsx`

```
Props:
  value: Date | null      — controlled value
  onChange: (date: Date) → void
  label: string
  minTime?: Date          — optional lower bound for validation display
```

Internal state: 24-hour `hours` + `minutes` snapped to 15-min steps. Calls `onChange` on every arrow press with a `new Date()` with the selected time. Defaults to current hour + 1 (start) / current hour + 2 (end) when no `value` prop is supplied.

**Files changed:** `src/components/shared/TimeArrowPicker.tsx` (new), `src/screens/seller/donations/SellerDonateSurplusScreen.tsx`

---

### FIX 4 — Total Donations Counter Stays Current

**Before:** The "إجمالي التبرعات" stat in the seller dashboard overview was read from `profile?.totalDonations` (a single field in `GET /api/sellers/me`). If that field was absent or stale, it showed 0 even after donations were confirmed.

**After (two-part fix):**
1. **Fallback count:** `confirmedDonationsCount` is computed from the already-fetched `donations` array (`donations.filter(d => d.status === "CONFIRMED").length`). The stat now displays `profile?.totalDonations ?? confirmedDonationsCount` — so even if the profile field is missing, confirmed donations from the history list are counted.
2. **Pull-to-refresh also refreshes donations:** The overview tab's `RefreshControl.onRefresh` now calls both `fetchProfile(true)` and `fetchDonations()` together. Pulling down on the overview tab brings both stats and the history list up to date in one gesture.

**Files changed:** `SellerDashboardScreen.tsx`

---

## Fix — Seller Document Upload Rules + Approval Messaging (June 2026)

Two product-driven corrections to the seller registration flow. Zero API changes. Zero buyer/charity screen changes.

---

### FIX A — Health Certificate Hidden for MARKET Sellers

**Rule:** RESTAURANT and BAKERY sellers prepare food and require a health/food-safety certificate. MARKET sellers sell packaged goods and do not.

**Before:** Health certificate upload was always shown on step 4 regardless of business type.

**After (`RoleSpecificInfoScreen.tsx`):**
- Health certificate upload section is wrapped in `(businessType === "RESTAURANT" || businessType === "BAKERY") && (...)` — hidden entirely for MARKET.
- MARKET sellers see an informational card instead: *"السوبرماركت لا يحتاج شهادة سلامة غذائية — تكفي رخصة التجارة فقط"*
- `businessType` is already stored in the shared component state set in step 1 — no prop threading needed.

---

### FIX B — All "Document Review" Messaging Corrected

**Truth:** Documents are stored for reference only. The approval gate is the NE-XXXXXX registration number — if it's in the whitelist, the seller is instantly APPROVED. Documents are never reviewed for approval; admins check them manually only when a seller receives food-quality complaints.

**All text changes made:**

| Location | Old (wrong) | New (correct) |
|----------|-------------|---------------|
| Step 4 subtitle | "ارفع وثائق ترخيص منشأتك — هذه الخطوة اختيارية" | "الوثائق اختيارية وتُستخدم للمرجعية فقط — لا تؤثر على قبول حسابك" |
| Step 4 info note | "لكنها تساعد في تسريع مراجعة طلبك" | "نحتفظ بها كمرجع في حال وجود شكاوى تتعلق بجودة الطعام. لن تؤثر على قبول حسابك." |
| Step 4 skip button | "تخطي هذه الخطوة" | "تخطي — الوثائق اختيارية" |
| Step 3 info card | (missing demo hint) | Added: "للتجربة: استخدم أي رقم من NE-200001 إلى NE-200020" |

---

### FIX C — PendingScreen Shows Correct State After Registration

**Before:** `PendingScreen` always showed a single "under review" message with "Document review" as a step, in English, regardless of whether the seller was actually approved.

**After (`PendingScreen.tsx`):**
On mount, fetches `GET /api/sellers/me` to get the live `status` field. Then renders one of two states:

**Case A — `status === "APPROVED"` (registration number in whitelist):**
- Green pulse animation + ✅ emoji
- Title: *"تم تفعيل حسابك! ✅"*
- Body: *"رقم تسجيلك معتمد. يمكنك الآن نشر إدراجاتك..."*
- Button: *"ابدأ الآن ←"* → navigates directly to seller dashboard

**Case B — `status === "PENDING"` (registration number not in whitelist):**
- Orange pulse animation + ⏳ emoji
- Title: *"طلبك قيد المراجعة"*
- Body: *"رقم تسجيلك غير موجود في قائمتنا المعتمدة..."*
- Note: *"لا علاقة لهذا بالوثائق التي رفعتها"* — explicitly tells seller their documents are not the issue
- Steps: "تم استلام طلبك" ✅ → "التحقق من رقم التسجيل" → "تفعيل الحساب"
- Buttons: "تواصل مع الدعم" + *"العودة للرئيسية"*

**Loading state:** `ActivityIndicator` shown inside the icon circle while the status fetch is in flight.

**`App.tsx` (1-line change):** Added `onApproved={() => goTo("seller-dashboard")}` prop to the `PendingScreen` render — wires the APPROVED "ابدأ الآن ←" button to navigate directly to the seller dashboard.

**Files changed:** `RoleSpecificInfoScreen.tsx`, `PendingScreen.tsx`, `App.tsx`

---

## UI Improvement — Seller Location Display (June 2026)

**Before:** The seller overview tab showed the store address only when a text address was explicitly saved. Stores that only had GPS coordinates showed nothing in the location section.

**After:** The location section is always rendered, with three intelligent display tiers:

| Scenario | What shows |
|----------|-----------|
| `location.address` is set | Address text shown directly |
| Coordinates-only (no address) | `expo-location.reverseGeocodeAsync` resolves to street, district, city, region |
| Reverse geocode fails / returns nothing | Graceful fallback: *"نابلس، فلسطين"* + coordinate line in `32.2211° ش، 35.2544° ط` format |
| `location` is entirely null | Muted text: *"الموقع غير محدد"* |

**New component:** `SellerLocationDisplay` (inline in `SellerDashboardScreen.tsx`)
- White card with 1px border and subtle shadow, RTL-native layout
- Orange pin icon + *"الموقع"* label row
- Spinner + *"جاري تحديد الموقع..."* while reverse geocoding
- *"افتح في الخريطة"* pill button — opens Apple Maps (iOS) / Google Maps (Android) native app, falls back to `maps.google.com` if no maps app is installed
- Coordinates shown only when no readable address is available; raw decimal pairs never displayed alone

**New imports added to `SellerDashboardScreen.tsx`:** `Linking` (react-native), `* as Location` (expo-location — already installed, used in registration flow).

**No new libraries installed. No API calls added. No buyer or charity screen changes.**

**Files changed:** `SellerDashboardScreen.tsx`

---

## Fix — Black Map in Seller Registration Step 2 (June 2026)

**Symptom:** When a seller opens the "Choose on map" modal during registration step 2, the map renders completely black (no tiles). The Google Maps watermark is visible, but no tile data loads.

**Root cause (confirmed by audit):** `MapLocationPicker` used `react-native-maps MapView` with `PROVIDER_DEFAULT`. On Android, this uses the Google Maps SDK which **requires a Google Maps API key**. No API key exists anywhere in the project — not in `app.json`, `AndroidManifest.xml`, or any `.env` file.

The "working buyer map" (`LeafletBrowseMap`) does NOT use `react-native-maps` at all — it is a WebView embedding Leaflet.js with OpenStreetMap tiles, which require no API key. That is why the buyer map works while the seller map was black.

**Fix (`src/components/buyer/MapLocationPicker.tsx`):**
Replaced `react-native-maps MapView` with a `WebView`-based Leaflet map, matching the same rendering approach used by `LeafletBrowseMap`. No new library was installed — `react-native-webview` was already a project dependency.

| Before | After |
|--------|-------|
| `react-native-maps` `MapView` + `Marker` | `WebView` + Leaflet.js + OpenStreetMap |
| Required Google Maps API key | No API key needed |
| Tiles rendered black on Android | Tiles load immediately |

**How it works:**
- `buildMapHtml(centerLat, centerLng, hasPin)` generates inline Leaflet HTML — same CDN approach as `LeafletBrowseMap`
- WebView posts `{ type: 'pin', lat, lng }` messages to React Native when the user taps the map or drags the marker
- GPS button injects `window.moveTo(lat, lng)` via `webviewRef.current?.injectJavaScript(...)` to re-center the map
- All UI chrome (top bar, bottom card, GPS button, address display) is unchanged — only the map renderer changed
- Map opens centered on Nablus (32.2211°N, 35.2544°E) at zoom 15 if no `initialLocation` is provided
- If `initialLocation` is passed (seller previously picked a point), the map opens with that pin pre-placed

**Files changed:** `src/components/buyer/MapLocationPicker.tsx`

---

## Fix — Seller Document Upload Required + Remove Demo Hint (June 2026)

Two corrections to seller registration step 4 (documents) and step 3 (registration number).

---

### FIX 1 — Trade License is Now Required

**Before:** Step 4 said documents were optional, showed a skip button, and the Continue button was always enabled.

**After (`RoleSpecificInfoScreen.tsx`):**
- Step 4 subtitle changed to: *"يرجى رفع وثائق ترخيص منشأتك للمتابعة"* / *"Please upload your business documents to continue"*
- The "تخطي — الوثائق اختيارية" skip button has been removed entirely
- The approval note card ("رفع الوثائق اختياري...") has been removed
- Continue button is disabled (grayed, 0.5 opacity) until `tradeDocUrl !== null` — trade license upload is the gate
- `validateSellerStep()` step 4 block added: if no trade license uploaded, sets `errors.tradeLicense` and shows inline error below the upload button
- Health certificate (RESTAURANT/BAKERY) and MARKET info card are unchanged

---

### FIX 2 — Demo Registration Number Hint Removed

**Before:** Step 3 info card showed: *"للتجربة: استخدم أي رقم من NE-200001 إلى NE-200020"*

**After:** That `<Text>` block and its `regNumDemoHint` style entry have been removed. The only text below the input field is the format instruction already in the subtitle (*"أدخل رقم تسجيل منشأتك بالصيغة NE-XXXXXX"*) and the on-demand validation error.

**Files changed:** `src/screens/registration/RoleSpecificInfoScreen.tsx`

---

## Feature — Seller Location Editor in Settings Tab (June 2026)

Sellers can now update their store location directly from the settings tab, without going through registration again.

---

### What was added

**`src/screens/seller/SellerDashboardScreen.tsx`:**

A collapsible location editor card is added to the settings tab, between the social media field and the "Save Changes" button.

**Collapsed state:** Shows a "📍 الموقع" / "Location" label, the current address (or lat/lng if no address), and an "Edit →" / "تعديل ←" toggle.

**Expanded state:** Shows:
1. A 260px Leaflet/OpenStreetMap map (same WebView approach used in registration) centered on the seller's current location with a draggable marker
2. Tapping the map or dragging the marker updates `editLatitude` / `editLongitude` via `postMessage`
3. An address `TextInput` pre-filled from the profile
4. A "Use My Current Location" GPS button — requests permission then calls `window.moveTo(lat, lng)` via `injectJavaScript`
5. A "حفظ الموقع" / "Save Location" orange full-width button — separate from the main "Save Changes" button

**API call:** `PATCH /api/sellers/me` with `{ location: { latitude, longitude, address? } }` — the same nested structure used in seller registration.

**On save success:**
- Local `profile` state updated with new coordinates and address
- The overview tab's `SellerLocationDisplay` immediately reflects the new location (reads from `profile`)
- Editor collapses
- Toast: "تم حفظ الموقع بنجاح 📍"

**State added:**
| Variable | Purpose |
|---|---|
| `locationExpanded` | Controls collapsed/expanded card |
| `editLatitude`, `editLongitude` | Current pin position |
| `editAddress` | Address text field value |
| `savingLocation` | Disables save button while request is in flight |
| `locationMapRef` | `useRef<WebView>` — for `injectJavaScript` |
| `locationMapHtml` | `useRef<string>` — HTML captured once when editor opens, so map doesn't reload on state change |

**Initialization:** All location state is populated from `profile` in the existing profile `useEffect` (`[!!profile]` dep). Defaults to Nablus (32.2211, 35.2544) if profile has no location.

**No new library installed.** `react-native-webview` was already a dependency.

**Files changed:** `src/screens/seller/SellerDashboardScreen.tsx`
