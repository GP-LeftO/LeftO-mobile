# LeftO — Final Gap Analysis, Committee Readiness & Roadmap

> Final version | June 4, 2026
> Cross-referenced against: PRD, sprint5.md, AUDIT_AND_ROADMAP.md, CODE_REVIEW.md,
> PR_fix-code-review-fixes.md, FE_CHECKLIST.md, fe-gap-analysis.md,
> implementation-plan.md, README.md
> Dr. Haya features and code-review bug fixes are excluded — tracked separately.

---

## Section 0: Scope Changes, Modifications & Removals

A complete record of every feature that was planned, then changed or removed, and what replaced it. Critical for committee Q&A prep — you need to be able to answer "I thought you were building وجبة معلقة?" without hesitation.

### Features Removed From Backend (with replacement)

| Original Feature | Was Planned In | Current Status | Replaced By |
|-----------------|---------------|----------------|-------------|
| `SUSPENDED_MEAL` listing type | Sprint 5 + CODE_REVIEW post-fixes | ❌ Removed — backend now rejects this type with a clear error | **Karam system** — pay-it-forward meal pools at seller level |
| `TAKIYA` listing type | Sprint 5 + CODE_REVIEW post-fixes | ❌ Removed — backend now rejects this type | **Karam system** — same mechanic, cleaner UX |
| `RAMADAN_BAG` listing type | Sprint 5 + CODE_REVIEW post-fixes | ❌ Removed — backend now rejects this type | **Ramadan Mode** (AppConfig `isRamadanSeason` toggle) activates the seasonal experience without a special listing type |
| Buyer donation order (`type: "DONATION"`) | PRD §6.2 core feature | ❌ Deprecated — backend returns `410` if this type is sent | **Karam sponsor flow** on listing detail page (`POST /api/sellers/:sellerId/karam/sponsor`) |
| Dr. Haya Feature C — وجبة معلقة | Sprint 5 | ❌ Replaced | **Karam system** |
| Dr. Haya Feature D — تكية as a listing type | Sprint 5 | ❌ Replaced | **Karam system** |
| Dr. Haya Feature D — حقائب رمضان as a listing type | Sprint 5 | ❌ Replaced | **Ramadan Mode** (AppConfig toggle, no special listing type needed) |

### Features Modified (still exist, but behaviour changed)

| Feature | Original Behaviour | Current Behaviour |
|---------|--------------------|-------------------|
| Charity registration approval | Charities could be auto-approved in some flows | Now **always** goes through `PENDING → admin review`. No auto-approval. |
| Checkout screen (buyer) | Had a "Donate" path → CharitySelectorScreen → DonationConfirmedScreen | Donate path **must be removed**. Only purchase flow remains. Karam button moves to store detail page. |
| `CharitySelectorScreen` | Used in buyer checkout for donating to charity | Must be **repurposed for seller donation flow** — seller picks a charity when donating surplus. |
| `DonationCard.tsx` in profile | Showed buyer-initiated charity donations | Must be **repurposed to show Karam sponsorship history** once buyer donation flow is removed. |
| AppConfig admin endpoint | Originally `PATCH /api/admin/config` (old plan) | Correct endpoint is `PATCH /api/app/config`. Also accepts `donationEnabled` flag now. |
| Ramadan mode | Was going to be a listing-type-based feature | Is now purely **AppConfig-driven**: `isRamadanSeason`, `isIftarWindow`, `maghribTime`. |

### Backend Features Now Live (were gaps, now done)

| Feature | Was | Now |
|---------|-----|-----|
| Points expansion (+5 review, +15 first order, -5 cancel) | Pending | ✅ Done |
| Charity → seller review (`POST /api/reviews/charity`) | Pending | ✅ Done |
| Charity 24-hour proof upload enforcement cron | Pending | ✅ Done |
| AppConfig (`GET /api/app/config`, `PATCH /api/app/config`) | Pending | ✅ Done |
| Review reply (`POST /api/reviews/:reviewId/reply`) | Pending | ✅ Done |
| Rescue Score (`rescueScore`, `rescueBadge` on recommendations) | Pending | ✅ Done |
| Charity Trust Score (`trustScore` on `/api/charities/:id`) | Pending | ✅ Done |
| Seller Waste Analytics (`GET /api/stats/my-analytics`) | Pending | ✅ Done |
| Community Leaderboard (`GET /api/stats/leaderboard`) | Pending | ✅ Done |
| Neighborhood Heatmap (`GET /api/stats/heatmap`) | Pending | ✅ Done |
| Admin stats (`GET /api/admin/stats`) | Pending | ✅ Done |
| Karam system (all endpoints) | Not planned | ✅ Done |
| Forgot/Reset password (`POST /api/auth/forgot-password`, `/reset-password`) | Pending | ✅ Done |
| Seller dashboard metrics (`GET /api/sellers/me`) | Pending | ✅ Done |

---

## Part 1: Remaining Gap Analysis

### 🔴 Demo-Blocking Gaps

These make it impossible to run the scripted demo. Fix before anything else.

| Gap | What's Missing | Where the Demo Fails |
|-----|----------------|----------------------|
| **Charity dashboard — full functional flow** | Screen shows user name + status badge only. No donations list, no pickup button, no proof upload, no charity-to-seller review. Files to rewrite: `src/screens/charity/CharityDashboardScreen.tsx`. | Demo Step 4 fails completely. Charity role cannot be shown. |
| **Seller listing Create + Edit + Delete** | `ListingFormScreen.tsx` exists in navigation but no form is wired. No `POST /api/listings`, no `PUT /api/listings/:id`, no `DELETE`. Files to create: `CreateListingScreen.tsx`, `EditListingScreen.tsx`. | Demo Step 6 fails. Seller cannot post food. |
| **Karam UI — buyer side** | No "تبرع لكرم" button on store detail page. No balance display. Calls needed: `POST /api/sellers/:sellerId/karam/sponsor`, `GET /api/sellers/:sellerId/karam`. | Demo Step 3 has no replacement for the removed وجبة معلقة. |
| **Karam UI — seller side** | No Karam toggle in settings, no dashboard balance card, no "Sponsor a meal" / "Claim a meal" buttons. Call needed: `PATCH /api/sellers/me/karam`. | Sellers cannot participate in Karam at all. |
| **Notifications screen + FCM** | No `NotificationsScreen.tsx`, no `useNotifications.ts`, no unread badge. No `PUT /api/auth/fcm-token` on login/logout. Firebase push not set up. | "Charity gets live push" fails. Real-time feel dead. |
| **Checkout donate path removal** | `CheckoutScreen` still shows a "Donate" option. `CharitySelectorScreen` and `DonationConfirmedScreen` are still in the navigation flow. These must be removed. Backend returns `410` if `type: "DONATION"` is sent. | A user who taps Donate gets a 410 error with no clear explanation. Reveals a broken feature mid-demo. |
| **App config read on startup** | `GET /api/app/config` never called. `isRamadanSeason`, `isIftarWindow`, `maghribTime` are unknown. | Admin toggling Ramadan live in the demo produces no visual response. Step 5 fails silently. |

---

### 🟡 Important Gaps (Degrade Demo Quality)

| Gap | What's Missing |
|-----|----------------|
| **Voice recognition not wired** | `NearMeMicButton` and mic button in chatbot have full UI with pulse animations. But `@react-native-voice/voice` is **not installed**. Tapping mic currently just focuses the text input as a fallback. Install the package and wire `SpeechResultsEvent` to `sendNearMeQuery` (NearMe) and to `POST /api/chatbot/voice` (chatbot). |
| **Rescue Score display** | Backend returns `rescueBadge` ("🔴 Last chance" / "🟠 Expiring soon" / "🔴 Last one" / "🟠 Almost gone") on every recommendation. Not displayed anywhere in the UI. No "Rescue Now" section on home. |
| **Ramadan UI mode** | When `isRamadanSeason: true` → crescent accent + Arabic Ramadan greeting. When `isIftarWindow: true` → "وقت الإفطار 🌙" banner on home. `maghribTime` → countdown timer to tonight's Maghrib. None of this reacts to the config. |
| **Charity Trust Score display** | `trustScore` (0–100) + `breakdown` returned by `GET /api/charities/:id`. Not displayed on charity cards or charity detail. |
| **SPECIFIC_PARCEL expiry date on listing card** | FE_CHECKLIST §2: for `SPECIFIC_PARCEL` listings, `expiryDate` (package expiry printed on the product) must be shown on the listing card. Currently no expiry date shown anywhere on any card. |
| **Dedicated Impact detail pages** | Profile shows CO2e, Money Saved, Donations as tappable stats — but tapping does nothing. PRD §6.2 requires three full pages: (1) CO2e Avoided (tracker + "ما هو CO2؟" explainer), (2) Money Saved (monthly breakdown; note: calculate from orders as `originalPrice − discountedPrice` per order, not from a backend field), (3) Donations Impact (Karam-based: meals sponsored, history). |
| **Favorites bell toggle not wired** | Bell icon on `FavoritesScreen` exists and toggles visual state but is **local state only** — no API call is made. `PATCH /api/users/me { favoriteNotifications }` or similar needs to be called so notification preference persists. |
| **Charity Directory screen** | PRD §6.2 Settings requires a standalone charity browser accessible from buyer settings. `GET /api/charities` + `GET /api/charities/:id` are live. No dedicated FE screen. |
| **Charity public profile page** | `GET /api/charities/:id` returns org name, description, region, verified badge, `trustScore`, `breakdown`, `totalDonations`, `confirmedCount`, `avgRating`. No dedicated screen. |
| **Seller settings form** | Settings tab is a "Coming Soon" placeholder. `PATCH /api/sellers/me` is live. Fields needed: business name, description, address, contact phone, website, social media, operating hours, Karam toggle. |
| **Seller orders tab** | `GET /api/sellers/me/orders` is live. No screen. Seller cannot see who reserved their listing. |
| **Seller donation flow** | `POST /api/donations` is live. No seller-side UI. The repurposed `CharitySelectorScreen` should be used here for charity selection. |
| **Seller switch-to-buyer mode** | PRD §5.2: seller can switch to buyer mode within the same session to browse and reserve food. No toggle exists. |
| **Seller review reply display** | `sellerReply` + `repliedAt` returned in `GET /api/reviews/seller/:id`. Not rendered. Seller reply endpoint is live but invisible. |
| **Seller Waste Analytics screen** | `GET /api/stats/my-analytics` is live. No screen in seller dashboard. |
| **Seller reviews "load more"** | `GET /api/reviews/seller/:id` is paginated. Currently hard-capped at 10 results with no load-more button. |
| **Community Leaderboard screen** | `GET /api/stats/leaderboard` is live. No screen exists anywhere. |
| **Neighborhood Heatmap view** | `GET /api/stats/heatmap` is live. Not used anywhere in the map views. |
| **Admin web panel** | `GET /api/admin/stats`, approve/reject endpoints, and `PATCH /api/app/config` are all live. No React web panel exists. Admin role has no visual interface. |
| **`donationEnabled` toggle in admin panel** | `PATCH /api/app/config` accepts `{ isRamadanSeason?, donationEnabled? }`. Admin panel needs both toggles — currently the `donationEnabled` flag is undocumented in FE. |
| **Forgot / Reset password screens** | `POST /api/auth/forgot-password` and `/reset-password` are live. No FE screens exist. "Forgot password?" link in sign-in leads nowhere. |
| **QR code display to seller** | `qrCodeUrl` (base64 PNG, per-order HMAC-SHA256 signed) is returned in `GET /api/listings/:id`. No seller screen shows it. Buyer pickup via QR scan is also not wired (manual "Received" button is the fallback). |
| **Profile Donation History tab repurposing** | Buyer donation flow is deprecated. The "Donations" tab in ProfileScreen shows buyer-initiated charity donations that no longer exist. Must be repurposed to show Karam sponsorship history. `DonationCard.tsx` needs updating. |
| **Allergy preferences edit + verification** | `PATCH /api/users/me` accepts `allergyPreferences`. But README notes `GET /api/users/me` may return `[]` always. Verify backend saves and returns them correctly. If not, allergy filtering in the app is silently broken. |
| **Order cancellation from ProfileScreen** | Cancel button only exists in `OrdersScreen`. Orders shown in `ProfileScreen` (Activity tab) have no cancel action. |
| **Share button + Get Directions on store detail** | PRD §6.2 Store Details: "Back, Share, Favorite buttons" and "Get directions button." Neither is implemented. Use `Share.share()` and `Linking.openURL(mapsUrl)`. |
| **Buyer notification settings** | PRD §6.2 Settings: per-type notification toggles (push on/off, Surprise Bag alerts, Karam updates, daily reminder). No settings section for this. |
| **Chatbot topic chips + rate support** | PRD §9: topic selection chips at chat start (How to reserve, Pickup instructions, Payment questions). Rate support experience (1–5 stars) at end. Currently chatbot opens to a blank text input. |
| **Settings legal section** | PRD §6.2: Terms & Conditions, Privacy Policy, Data & Cookies. Settings footer currently shows these labels but tapping does nothing. |
| **Avatar customization** | `PATCH /api/users/me { avatarStyle, avatarColor }` works. Camera button on profile avatar is disabled. |

---

### 🟢 Backend Gaps (Still Open)

| Gap | Status |
|-----|--------|
| **Real SMS OTP** | OTP prints to server terminal. Not integrated with any SMS provider. Exposed immediately if a committee member tries to register on their own phone. |
| **Listing expiry cron** | `expiryDate` field exists on listings. Not confirmed that a cron job auto-sets `status: EXPIRED` when the pickup window passes. Stale listings may stay `ACTIVE` indefinitely. |
| **Missing notification types** | PRD §8 requires these types that are NOT in the backend notification table: "Favorite store has new listing" (buyer), "Listing about to expire" (seller), "Order reminders" (buyer), "Pickup window reminder" (charity), "Donation confirmation required reminder" (charity). These need backend implementation before FE can display them. |
| **Charity Basket Match cron** | Not in FE_CHECKLIST. Backend not built. Needs new `CharityBasket` model + greedy matching cron. |
| **"Will It Sell?" prediction endpoint** | `GET /api/listings/predict?category=&pickupHour=&dayOfWeek=` not built. Pure SQL aggregation needed. |
| **`GET /api/stats/recent-activity`** | For Public Impact Wall on landing page. Not in FE_CHECKLIST — not built yet. |
| **Money Saved calculation** | No `moneySaved` backend field exists. FE must calculate this as `sum(originalPrice − discountedPrice)` across completed orders. Need to ensure `originalPrice` is returned in order history. |
| **Ramadan Bag buyer donation flow** | Explicitly listed in FE_CHECKLIST §20 as "Architecture pending (waiting on Dr. Haya's decision)." |

---

## Part 2: Committee Readiness Review

### Demo Steps — Honest Assessment

| Step | Script | Status |
|------|--------|--------|
| 1 | Buyer → Near Me Now → speaks in Arabic → Whisper transcribes → RAG answers with real Nablus stores → taps store card → reserves → impact celebration (CO2 + badge + confetti) | ✅ Works — strongest flow |
| 2 | Text chatbot → "في إشي حلو رخيص قريب مني؟" → RAG answers with allergen exclusion applied | ✅ Works |
| 3 | Buyer browses home → sees Karam section → taps أبو العبد → views listing → taps "تبرع لكرم" → sponsors a meal → balance updates live | Needs T0-3, T0-4, T1-4 |
| 4 | Seller posts listing → QR generates → buyer reserves → charity gets live push → confirms pickup → uploads proof | Needs T0-1, T0-2, T0-5 |
| 5 | Admin toggles `isRamadanSeason ON` live in admin panel → home switches to Ramadan mode: crescent, greeting, iftar countdown | Needs T0-6, T1-2, T1-9 |
| 6 | Seller dashboard → Waste Analytics → "خبزك يروح كل خميس مساء — جرب تنزل الكمية" insight visible | Needs T0-2, T1-7 |
| 7 | Admin web panel → live stats: bags saved, CO2, donations, Karam meals, pending approvals | Needs T1-9 |

**Current state: 2 of 7 demo steps work.**

---

### Questions the Committee Will Ask

**Technical:**
- *"How does the AI rank what to show first?"* — `rescueBadge` and `rescueScore` are live on backend. Without a "Rescue Now" section in the UI, no evidence of AI ranking is visible.
- *"What prevents fake charities?"* — Charity Trust Score is live. If not displayed on charity cards, the accountability system is invisible.
- *"How does the Karam system work?"* — Prepare one sentence: *"A buyer sponsors a meal at Abu Al-Abd's restaurant — any walk-in who needs it claims it face-to-face. No approval, no admin. Pure community trust."*
- *"Is the OTP SMS real?"* — No. It prints to a server terminal. If anyone registers live on their own phone, this is exposed.
- *"The mic button — does it actually work?"* — Currently falls back to text input. `@react-native-voice/voice` must be installed and wired before the demo.
- *"What happens when a seller doesn't show up?"* — Rating system exists. Prepare verbal answer: "Three no-shows trigger a delisting flag — roadmap item, not MVP."

**Business:**
- *"What's your differentiation from Too Good To Go?"* — The answer is no longer وجبة معلقة or تكية (removed). It is now: **Karam** (pay-it-forward, culturally Palestinian), **Ramadan Mode** (no other food app does iftar-time surfacing), **Charity Trust Score** (accountability layer), **AI RAG chatbot in Arabic with voice**. Rehearse this.
- *"Why would a seller stay on the platform?"* — Seller Waste Analytics answers this. "We show you which days your bread goes unsold — and what to change." Must be a visible screen.
- *"Who are your target charities?"* — Charity Directory screen + public profile page need to show real Nablus organizations with trust scores.

**Gotcha moments:**
- Committee tries to register on their own phone → OTP goes to terminal
- They tap "Donate" in checkout → hits a deprecated 410 error (checkout cleanup critical)
- They tap the mic button → nothing happens (voice not wired)
- They ask to see the charity experience → Coming Soon card
- They ask "can you add a listing?" → no create button in seller dashboard

---

## Part 3: Standout Features

Backend is already live for Rescue Score, Trust Score, Waste Analytics, Leaderboard, Heatmap. These just need FE screens. The below are FE-only or new.

---

### 1. Karam Discovery Section on Home
**What:** `GET /api/sellers/karam?lat=&lng=&radius=` section on home screen: "كرم — مطاعم بتستضيف وجبات مجانية". Cards show restaurant name, today's available balance (`available: 3`), distance. Tap → store detail → Karam button.

**Why it matters:** This is the entire cultural differentiation pitch. The committee has never seen this mechanic in a food app.

| Impact | Effort |
|--------|--------|
| High — key differentiation | D2: 1.5h |

---

### 2. Shareable Impact Cards
**What:** After a buyer's order is completed, a "شارك تأثيرك" button on the impact celebration screen. React Native `Share.share()` with a formatted Arabic string:
> *"أنقذت 2.4 كغ من CO₂ هاليوم مع LeftO 🇵🇸"*

No backend change needed. FE-only.

**Why it matters:** Too Good To Go's entire European growth was driven by user-generated social posts. This is LeftO's word-of-mouth engine.

| Impact | Effort |
|--------|--------|
| High — virality | D2: 1h |

---

### 3. "Will It Sell?" Pre-Post Prediction for Sellers
**What:** Confidence chip on listing creation form after category + pickup time are selected:
> *"الوجبات في هاد التوقيت عندها نسبة مبيع 84% — توقيت ممتاز ✅"*

Backend endpoint needed: `GET /api/listings/predict?category=MEALS&pickupHour=18&dayOfWeek=5`. Pure SQL aggregation on historical claimed/unclaimed ratios.

**Why it matters:** Gives sellers a data-backed reason to stay. Labeled as AI — it's a statistical model from historical data.

| Impact | Effort |
|--------|--------|
| High — seller retention | D1: 1h + D2: 0.5h |

---

### 4. Story-Driven Monthly Impact Report
**What:** "تأثيري هذا الشهر" screen accessible from profile. Personalized monthly summary:
> *"في مايو، أنقذت 8 وجبات، وفّرت 3.1 كغ CO₂ (= عدم قيادة 15 كم). مرتبتك في نابلس: الأوائل 12٪."*

"Top X%" = user CO2 vs platform average. One extra SQL query.

**Why it matters:** Transforms a one-time buyer into someone emotionally attached to their impact number.

| Impact | Effort |
|--------|--------|
| High — retention | D1: 1h + D2: 0.5h |

---

### 5. Offline-First Listing Cache
**What:** Cache last-fetched home listings in AsyncStorage with timestamp. When app opens with no connection, show cached listings with "غير متصل — آخر تحديث منذ X دقائق" banner.

**Why it matters:** Palestine has inconsistent mobile connectivity around Nablus. Building for real network conditions is the detail that makes a committee say "these developers thought about their users."

| Impact | Effort |
|--------|--------|
| High — Palestine-specific | D2: 2h |

---

### 6. Public Impact Wall on Landing Page
**What:** Live-feed ticker on landing page — last 20 completed orders + donations, anonymized. Auto-refreshes every 30 seconds. Backend: `GET /api/stats/recent-activity` (needs to be built).

**Why it matters:** Committee sees community activity before the demo even starts.

| Impact | Effort |
|--------|--------|
| High — first impression | D1: 0.5h + D2: 1h |

---

## Part 4: Consolidated Prioritized Roadmap

### 🔴 Tier 0 — Demo-Blocking (Ship First)

| # | Item | Files | Why | Effort |
|---|------|-------|-----|--------|
| T0-1 | **Charity dashboard — full rewrite** — donations list (`GET /api/donations/me` as CHARITY), pickup button (`PATCH /api/donations/:id/pickup`), proof upload + confirm (`PATCH /api/donations/:id/confirm`), rate seller (`POST /api/reviews/charity`), impact counter (meals received) | `CharityDashboardScreen.tsx` full rewrite + new `useCharityDonations.ts` + `DonationIncomingCard.tsx` + `ProofUploadModal.tsx` | Entire charity role non-functional. 1 of 4 roles absent. | D2: 3–4h |
| T0-2 | **Seller listing Create + Edit + Delete** — wire `POST /api/listings`, `PUT /api/listings/:id`, `DELETE /api/listings/:id`. MEAL_BAG vs SPECIFIC_PARCEL expiry rules. For SPECIFIC_PARCEL: `expiryDate` is required. | New `CreateListingScreen.tsx`, `EditListingScreen.tsx` + `useListingForm.ts`. Modify `SellerDashboardScreen.tsx` to add FAB + edit/delete per card. | Core seller flow broken. Cannot demo. | D2: 2–3h |
| T0-3 | **Karam UI — buyer side** — "تبرع لكرم" button on store detail when `seller.participatesInKaram === true`. Call `POST /api/sellers/:sellerId/karam/sponsor`. Show balance chip. Success toast. | `StoreDetailsScreen.tsx` + new `KaramSponsorButton.tsx` | Community giving demo step has no UI. | D2: 1.5h |
| T0-4 | **Karam UI — seller side** — Karam toggle in settings (`PATCH /api/sellers/me/karam`), dashboard card (sponsored/claimed/available), "Sponsor a meal" + "Claim a meal" buttons | `SellerDashboardScreen.tsx` + settings tab | Sellers cannot participate in Karam. | D2: 1.5h |
| T0-5 | **Notifications screen + FCM** — screen (`GET /api/notifications/me`), mark-all-read (`PATCH /api/notifications/me/read-all`), unread badge in tab header, `PUT /api/auth/fcm-token` on login + `null` on logout, handle all types from FE_CHECKLIST §8 | New `NotificationsScreen.tsx` + `useNotifications.ts` + `notifications.service.ts`. Modify `AuthContext.tsx` for FCM token. | "Live push" fails. Real-time feel dead. | D2: 2–3h |
| T0-6 | **App config on startup** — call `GET /api/app/config` once on app launch, store in context. Act on `isRamadanSeason`, `isIftarWindow`, `maghribTime`. | `AuthContext.tsx` or new `AppConfigContext.tsx` | Ramadan UI cannot activate. Step 5 fails silently. | D2: 1h |
| T0-7 | **Checkout donate path removal** — remove the Donate option from `CheckoutScreen`, remove `"charity-selector"` and `"donation-confirmed"` steps from buyer checkout navigation. Repurpose `CharitySelectorScreen` for seller donation flow only. | `CheckoutScreen.tsx`, `App.tsx` (remove steps), keep `CharitySelectorScreen.tsx` for seller reuse | Deprecated flow still exposed. 410 error mid-demo. | D2: 0.5h |

---

### 🟡 Tier 1 — Committee Confidence (Build After Tier 0)

| # | Item | Files | Why | Effort |
|---|------|-------|-----|--------|
| T1-1 | **Rescue Score display** — `rescueBadge` chip on listing cards. "Rescue Now" section on home (top 5 from `GET /api/listings/recommended`). | `ListingCard.tsx` + `HomeScreen.tsx` | Backend live. Without visible ranking, "how does your AI work?" has no answer. | D2: 1h |
| T1-2 | **Ramadan UI mode** — `isRamadanSeason: true` → crescent accent + greeting. `isIftarWindow: true` → banner on home. `maghribTime` → countdown timer. | `HomeScreen.tsx` + theme | Admin toggles live in demo. FE must react visibly. | D2: 1.5h |
| T1-3 | **Charity Trust Score display** — `trustScore` badge on charity cards in directory + selector. `breakdown` on charity detail page. | `CharitySelectorScreen.tsx` + charity profile screen | Backend live. Without display, accountability system invisible. | D2: 1h |
| T1-4 | **Karam discovery section on home** — "كرم" section using `GET /api/sellers/karam?lat=&lng=&radius=`. Cards show balance + distance. | `HomeScreen.tsx` + new `KaramSellerCard.tsx` | Makes Karam discoverable on home, not buried in store details. | D2: 1.5h |
| T1-5 | **Seller settings form** — replace "Coming Soon" tab. Fields: business name, description, address, contact phone, website, social media, operating hours, Karam toggle. `PATCH /api/sellers/me`. | `SellerDashboardScreen.tsx` settings tab rewrite | Placeholder tab undermines credibility. | D2: 1.5h |
| T1-6 | **Seller orders tab** — `GET /api/sellers/me/orders?page=&limit=`. Show: buyer name (or anonymous), listing title, status, pickup time. Pull-to-refresh. | New `SellerOrdersScreen.tsx` + `useSellerOrders.ts` | Seller can't see who reserved their listing. | D2: 1h |
| T1-7 | **Seller Waste Analytics screen** — `GET /api/stats/my-analytics`. Display: `sellThroughRate` gauge, `co2SavedKg`, `peakHours` bar chart, `topListing` card. | New analytics tab in `SellerDashboardScreen.tsx` | Backend live. Answers "why would sellers stay?" Mirrors Cornell 2024 hackathon winner. | D2: 2h |
| T1-8 | **Seller donation flow** — donate surplus to charity. Use repurposed `CharitySelectorScreen` for charity selection. `POST /api/donations { listingId, charityId, quantity, pickupStart, pickupEnd }`. History: `GET /api/donations/me` as SELLER. | New `SellerDonateSurplusScreen.tsx` + `SellerDonationsHistoryScreen.tsx` + `useSellerDonations.ts` | PRD core feature completely absent from seller side. | D2: 1.5h |
| T1-9 | **Admin web panel** — basic React app: `GET /api/admin/stats` dashboard, approve/reject sellers + charities, `PATCH /api/app/config` with **both** `isRamadanSeason` and `donationEnabled` toggles. | New React web app (separate from mobile) | No admin interface = no demo Steps 5 and 7. | D2: 2–3h |
| T1-10 | **Voice recognition wiring** — install `@react-native-voice/voice`. Wire `SpeechResultsEvent` → `sendNearMeQuery` in `NearMeScreen`. Wire to `POST /api/chatbot/voice` (form-data: audio + lat + lng) in `ChatbotScreen`. Mic button UI is already complete. | `NearMeScreen.tsx`, `ChatbotScreen.tsx`, `useNearMe.ts`, `useVoiceRecognition.ts` (hook exists), `useChatbot.ts` | Mic button currently does nothing. Voice is a headlining demo feature. | D2: 1.5h |
| T1-11 | **Dedicated Impact detail pages** — CO2e Avoided page (tracker + "ما هو CO2؟" explainer), Money Saved page (monthly breakdown; calculate as `sum(originalPrice − discountedPrice)` from completed orders — no backend field), Donations Impact page (Karam sponsorships). Wire from tappable stats on profile. | New `Co2ImpactScreen.tsx`, `MoneySavedScreen.tsx`, `DonationsImpactScreen.tsx` | Profile stats tap into nothing. PRD §6.2 requires these pages explicitly. | D2: 2h |
| T1-12 | **Charity Directory + public charity profile** — standalone screen from buyer settings. Lists all approved charities (`GET /api/charities`) with trust score badge. Tap → full profile (org info, mission, region, verified badge, `trustScore` breakdown, `totalDonations`, `avgRating`). | New `CharityDirectoryScreen.tsx` + `CharityPublicProfileScreen.tsx` | PRD §6.2 Settings + §6.4 require these. Backend done. | D2: 1.5h |
| T1-13 | **Seller review reply display** — render `sellerReply` + `repliedAt` below each review. Already returned in `GET /api/reviews/seller/:id`. | `ReviewCard.tsx` | Reply endpoint is live but completely invisible. | D2: 0.5h |
| T1-14 | **Forgot / Reset password screens** — `ForgotPasswordScreen` (phone → `POST /api/auth/forgot-password`) + `ResetPasswordScreen` (OTP + new password → `POST /api/auth/reset-password`). Add "Forgot password?" link to `SignInScreen`. | New `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`. Modify `SignInScreen.tsx` + `App.tsx`. | Backend done. Any user with a forgotten password is permanently blocked. | D2: 1h |
| T1-15 | **Real SMS OTP** via Twilio or regional provider | Backend: `D1: 0.5h` | OTP to terminal exposed immediately if anyone registers live. | D1: 0.5h |

---

### 🟢 Tier 2 — Standout and Differentiation

| # | Item | Why | Effort |
|---|------|-----|--------|
| T2-1 | **Community Leaderboard screen** — `GET /api/stats/leaderboard`. Buyers ranked by CO2 saved + badges, sellers by meals rescued + rating. Weekly reset. Tab in Browse or Profile. | Backend live. Creates community competition. Shareable. | D2: 1.5h |
| T2-2 | **Neighborhood Heatmap view** — `GET /api/stats/heatmap`. Map layer in Browse screen: sized markers per seller (`activeListings` = marker size). | Backend live. Committee sees Nablus on screen. | D2: 1.5h |
| T2-3 | **Shareable Impact Card** — "شارك تأثيرك" on impact celebration + profile. `Share.share()` with Arabic CO2 string. FE-only. | Virality mechanism. Committees reward growth thinking. | D2: 1h |
| T2-4 | **"Will It Sell?" Pre-Post Prediction** — confidence chip on listing creation. Calls `GET /api/listings/predict`. Backend needs to be built (D1 work). | Gives sellers data-backed reason to stay. AI-labeled. | D1: 1h + D2: 0.5h |
| T2-5 | **Story-Driven Monthly Impact screen** — "تأثيري هذا الشهر" from profile. Monthly summary + Top-X% rank. Backend: one SQL aggregation. | Retention mechanism. Emotional. Long-term thinking visible. | D1: 1h + D2: 0.5h |
| T2-6 | **Public Impact Wall on landing page** — live-feed ticker. Backend needs `GET /api/stats/recent-activity`. | Committee sees activity before demo starts. | D1: 0.5h + D2: 1h |
| T2-7 | **Offline-first listing cache** — AsyncStorage fallback with timestamp + "غير متصل" banner. | Palestine-specific. Real user environment thinking. | D2: 2h |
| T2-8 | **Charity Basket Match** — cron matches charities to best-fit listings. New `CharityBasket` model + greedy algorithm. | Research-backed — Springer 2024 AI-FEED. Cite by name. | D1: 2.5h |
| T2-9 | **Favorites bell toggle wired to backend** — bell icon UI exists on `FavoritesScreen` but is local state only. Wire to `PATCH /api/users/me` to persist per-store notification preference. | PRD §6.2 Favorites requires this. Currently a UI that does nothing on restart. | D2: 1h |
| T2-10 | **SPECIFIC_PARCEL expiry date on listing card** — show `expiryDate` on the card when listing type is `SPECIFIC_PARCEL`. `ListingCard.tsx` update only. | FE_CHECKLIST §2 requires this. Small change, visible trust signal. | D2: 0.5h |
| T2-11 | **Seller reviews "load more"** — paginate reviews on store detail page. Currently hard-capped at 10 with no load-more. | Small but visible. Sellers with many reviews look cut off. | D2: 0.5h |
| T2-12 | **Share + Get Directions on store detail** — Share: `Share.share()` with store name. Directions: `Linking.openURL(mapsUrl)` using `seller.latitude/longitude`. | PRD §6.2 Store Details lists both. Small effort, visible polish. | D2: 0.5h |
| T2-13 | **Seller switch-to-buyer mode** — toggle in seller settings. Locally switches role context to show buyer tabs. PRD §5.2 requires this. | Sellers who can't browse as buyers have a degraded experience. | D2: 1h |
| T2-14 | **Seller operating hours** — field in seller settings form (store hours per day). Display on store detail page under store info. | PRD §6.3 Store Settings. Buyers need to know when the store is open. | D2: 0.5h |
| T2-15 | **Order cancellation from ProfileScreen** — cancel button on RESERVED orders in the ProfileScreen Activity tab (currently only in OrdersScreen). | README identifies this gap. Consistent UX across both order views. | D2: 0.5h |
| T2-16 | **Chatbot topic chips + rate support** — 4 Arabic topic chips at chat start. 1–5 star rating prompt at end of conversation. | PRD §9 requires both. Chat opens to blank input currently. | D2: 1h |
| T2-17 | **Buyer notification settings** — per-type toggles in settings: push on/off, Surprise Bag alerts, Karam updates, daily reminder (select days). Persist via `PATCH /api/users/me`. | PRD §6.2 Settings requires these. | D2: 1h |

---

### ⚫ Tier 3 — Post-Demo / Future

| Item | Reason Deferred |
|------|-----------------|
| Dynamic expiry-based pricing | Complicates checkout UX; little demo payoff given time cost |
| Bilingual Arabic NLP search | High effort. Search works reasonably today. |
| Expiry photo verification + OCR | Committee will not specifically evaluate this |
| Points redemption | Dr. Haya has not confirmed the formula. Do not implement blind. |
| Online card payment (Stripe) | Explicitly deferred post-graduation per FE_CHECKLIST §20 |
| Ramadan Bag buyer donation flow | Architecture pending on Dr. Haya's decision |
| Avatar customization | Cosmetic only. Backend endpoint is live whenever needed. |
| Profile Donation History → Karam history | Replace `DonationCard.tsx` history with Karam sponsorship data. Low demo priority. |
| Settings legal section | Terms, Privacy, Data & Cookies. PRD requires them; committee will not evaluate. Build last. |
| "Check again at [time]" on sold-out state | One line of code after seller listing CRUD is done. |
| Terms & conditions link in checkout | One line in CheckoutScreen after cleanup. |
| Rate LeftO (app store link) | Settings footer item. Wire to store URL when app is published. |
| Allergy preferences verification | Verify `PATCH /api/users/me { allergyPreferences }` saves and `GET /api/users/me` returns them. Fix if not. |

---

## Demo Script — Final

| Step | Script | Needs |
|------|--------|-------|
| 1 | Buyer → Near Me Now → speaks Arabic → Whisper transcribes → RAG answers with real Nablus stores → taps store card → reserves → impact celebration (CO2 + badge + confetti) | ✅ Works now |
| 2 | Text chatbot → "في إشي حلو رخيص قريب مني؟" → allergen filter applied in RAG response | ✅ Works now |
| 3 | Home → Karam section → "أبو العبد - 3 وجبات متاحة" → view listing → tap "تبرع لكرم" → balance: 3→4 → toast "شكراً! ساعدت في تمويل وجبة لمحتاج 💚" | T0-3, T0-4, T1-4 |
| 4 | Seller creates listing → QR generates → buyer reserves → charity gets push notification → goes to dashboard → marks picked up → uploads proof photo → seller notified | T0-1, T0-2, T0-5 |
| 5 | Admin opens web panel → toggles `isRamadanSeason ON` → buyer's home screen shows crescent banner + "رمضان كريم" + iftar countdown | T0-6, T1-2, T1-9 |
| 6 | Seller dashboard → Waste Analytics tab → sell-through gauge 78% → peak hours bar chart → insight: "خبزك يروح كل خميس مساء" | T0-2, T1-7 |
| 7 | Admin web panel → live stats: X bags saved, Y kg CO2, Z donations, W Karam meals, pending approvals count | T1-9 |

---

## The Five Things That Win the Committee

| # | Feature | Why It Wins |
|---|---------|-------------|
| 1 | **Rescue Score + rescueBadge on cards** | Explainable AI — write `rescueScore = (urgency × 0.40) + (proximity × 0.30) + (sellerRating × 0.20) + (discountDepth × 0.10)` on the whiteboard. Backend is done. |
| 2 | **Karam system with live demo** | Uniquely Palestinian pay-it-forward. No other food app in the world has this mechanic. Deeply cultural. |
| 3 | **Ramadan Mode toggle live** | Admin toggles it in the room. Iftar countdown appears on screen. Zero other food apps globally do this. |
| 4 | **Seller Waste Analytics screen** | Proves platform has business value beyond altruism. Mirrors Cornell 2024 Food Waste Hackathon winner. Backend done. |
| 5 | **Neighborhood Heatmap of Nablus** | Committee sees their city on screen. Makes it unmistakably a Nablus app, not a generic food demo. Backend done. |

---

## Recommended Build Order

```
Day 1 — Make all roles functional
  T0-1  Charity dashboard (full flow)
  T0-2  Seller listing Create + Edit + Delete
  T0-6  App config on startup
  T0-7  Checkout donate path removal + CharitySelectorScreen repurposing
  Goal: charity role functional, seller can post food, no broken flows

Day 2 — Make the demo steps run
  T0-3  Karam buyer UI (store detail button)
  T0-4  Karam seller UI (dashboard + settings)
  T0-5  Notifications screen + FCM setup
  T1-4  Karam home section
  Goal: all 7 demo steps are runnable end-to-end

Day 3 — Make it smart
  T1-1  Rescue Score + rescueBadge on listing cards
  T1-2  Ramadan UI mode (banner + countdown)
  T1-3  Charity Trust Score on charity cards
  T1-5  Seller settings form (operating hours + Karam toggle)
  T1-6  Seller orders tab
  T1-10 Voice recognition wiring (install + wire mic button)
  Goal: "it works" becomes "it's intelligent and complete"

Day 4 — Fill every role and gap
  T1-7  Seller Waste Analytics screen
  T1-8  Seller donation flow (repurpose CharitySelectorScreen)
  T1-9  Admin web panel (stats + approve/reject + Ramadan/donationEnabled toggles)
  T1-11 Impact detail pages (CO2e, Money Saved, Karam history)
  T1-12 Charity Directory + public charity profile
  T1-13 Seller review reply display
  T1-14 Forgot / Reset password screens
  T1-15 Real SMS OTP
  Goal: every role fully functional, no placeholder screens, PRD core complete

Day 5 — Differentiation and polish
  T2-1  Community Leaderboard screen
  T2-2  Neighborhood Heatmap in Browse
  T2-3  Shareable Impact Card
  T2-9  Wire favorites bell toggle to backend
  T2-10 SPECIFIC_PARCEL expiry date on listing card
  T2-12 Share + Get Directions on store detail
  T2-13 Seller switch-to-buyer mode
  T2-16 Chatbot topic chips + rate support
  Goal: differentiation visible, UX polished, PRD items closed

Final days — QA and presentation
  → RTL QA on every new screen
  → Full demo run — clock it under 10 minutes, three times
  → Seed data review (see credentials below)
  → Tier 3 polish (legal, donation history tab, check-again message)
  → Verify allergy preferences save/return correctly
  → Presentation slides
  → Demo video backup recording
```

---

## Demo Credentials (from backend seed)

| Role | Phone | Password | Notes |
|------|-------|----------|-------|
| Admin | 0598262751 | Admin123! | Use for Ramadan toggle demo |
| Buyer (يوسف) | 0591111111 | Buyer123! | Primary demo buyer |
| Buyer (مريم) | 0592222222 | Buyer123! | Second account for cross-demo |
| Charity (إطعام نابلس) | 0597777777 | Charity123! | Primary demo charity |
| Charity (رعاية الأسرة) | 0597888888 | Charity123! | |
| Seller — أبو العبد (Karam ✓) | 0551234567 | Seller123! | Use for Karam demo step |
| Seller — حلويات قناعة | 0552345678 | Seller123! | |
| Seller — مخبز خليل (Karam ✓) | 0553456789 | Seller123! | |
| Seller — سوق الطازج | 0554567890 | Seller123! | |
| Seller — الزيتونة (Karam ✓) | 0555678901 | Seller123! | |
| Seller — PENDING (admin demo) | 0556789012 | Seller123! | Use to show admin approve flow |

---

## Sources

- [412 Food Rescue ML Recommender System — ACM 2021](https://dl.acm.org/doi/fullHtml/10.1145/3442381.3449787)
- [AI-FEED: AI-Powered Platform for Food Charity Ecosystem — Springer 2024](https://link.springer.com/article/10.1007/s44196-024-00656-9)
- [Waste Watcher AI — Cornell Hackathon Winner 2024](https://news.cornell.edu/stories/2024/11/food-waste-solution-wins-top-prize-hackathon)
- [Too Good To Go 2024–2025 growth analysis](https://packagingspeaksgreen.com/en/end-life-and-recovery/too-good-go-grows-double-digits)
- [Three Ways AI Is Driving Reductions in Food Loss and Waste — ReFED](https://refed.org/articles/three-ways-ai-is-driving-reductions-in-food-loss-and-waste/)

---

*LeftO Final Roadmap v3 | D1: غيداء | D2: Tala | For Palestine 🇵🇸*
