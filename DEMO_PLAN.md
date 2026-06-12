  # LeftO — Frontend Demo Plan

> **Senior Frontend Engineer & Demo Director report**
> Graduation committee · 20-minute slot (3 min intro + **17 min demo**)
> Last verified against source + backend demo report: 2026-06-11

**Golden rule:** A focused demo of **5 great features** beats a rushed tour of 15 average ones.
Lead with emotion (price decay → reserve → impact celebration), peak on the technical wow (AI listing assistant), close on credibility (web platform + architecture + admin charts).

---

## PHASE 1 — Frontend Scan

### ① Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83.6 + Expo 55, TypeScript 5.9, React 19 |
| **Web platform** | **Expo Web (webpack) — same codebase, runs in any browser, full-width responsive layout** |
| Navigation | **Custom state-machine in `App.tsx`** (not React Navigation at root) + `BuyerTabNavigator` (5 tabs) |
| State | React Context (`AuthContext`, `AppConfigContext`, `FavoritesContext`) + per-feature hooks (MVVM) |
| Networking | Axios with interceptor in `src/services/shared/api.ts` — auto Bearer token + 401 refresh |
| i18n / RTL | i18next + `react-i18next`, `isRTL()` — **full Arabic RTL on every screen; language switch reloads app to apply locale** |
| Maps | `react-native-maps` (native) / **Leaflet WebView `LeafletMap.tsx`** (web) — platform-split, same component interface |
| Media / Voice | `expo-image-picker`, `expo-av`, `@react-native-voice/voice` (native) / **Web Speech API** (web) |
| Animation | `react-native-reanimated` (screen fade transitions, confetti celebration) |
| Push | **Native:** `expo-notifications` FCM token. **Web:** FCM VAPID service worker (`pushNotifications.service.web.ts`) |
| Payments | `@stripe/stripe-react-native` (native) / **Stripe.js payment sheet** (web) |

**Architecture discipline:** Strict MVVM — Screen renders, Hook holds logic, Service calls API.
**45 screens · 28 services · 29 hooks.** No `api.get()` inside any screen.
Platform-specific modules use `.web.ts` / `.native.ts` file splitting — Metro and webpack auto-select the right file. Same screen code runs on iOS, Android, and browser with zero conditional branches in components.

---

### ② Screen Inventory (grouped)

**Onboarding / Auth (12):** Splash · LanguageSelection · Onboarding · PhoneEntry · OTPVerification · SignIn / SignUp · Forgot / ResetPassword · RoleSelection · BasicInfo · RoleSpecificInfo · AllergyPreferences → `/api/auth/*`

**Buyer core (5 tabs + detail screens):**
| Screen | Backend API |
|---|---|
| HomeScreen (recommended + Karam section + stats) | `/listings/recommended`, `/sellers/karam`, `/app`, `/stats/*` |
| BrowseScreen (map + filters + search) | `/listings`, `/listings/search`, `/stats/heatmap` |
| FavoritesScreen | `/favorites/me` |
| OrdersScreen (RESERVED/COMPLETED/CANCELLED) | `/orders/me`, cancel, received |
| ProfileScreen (impact tabs, settings, dual-role, **impact certificate PDF**) | `/users/me`, `/auth/switch-role`, `/users/me/impact-certificate` |
| StoreDetailsScreen | `/listings/:id`, `/sellers/:id`, reviews, `/listings/ai/performance/:id` |
| CheckoutScreen | `POST /orders` |
| **ImpactCelebrationScreen** (confetti) | reserve response |
| OrderConfirmed / DonationConfirmed / CharitySelector | reserve + donate |
| QRScanScreen | `POST /orders/:id/scan` |

**Buyer extras:** NearMe (AI voice/text) · Chatbot (Groq text/voice) · Co2Impact / MoneySaved / DonationsImpact · Leaderboard · CharityDirectory / CharityPublicProfile (trust score) · Notifications

**Seller (8):** SellerDashboard (overview / listings / orders / donations) · **ListingFormScreen (AI title score + price suggestion + allergen detection + `isPriceDecaying` toggle + floor price)** · SellerAnalytics · DonateSurplus · DonationsHistory · Pending / Rejected

**Charity (3):** CharityDashboard (incoming / history + **proof photo upload** via camera or gallery) · CharityInfo / CharityDocument registration

**Admin (4):** AdminRedirect · **AdminDashboard (Overview charts + best-rated sellers + Sellers approval + Charities approval + Users with filter / unblock / delete)** · AdminUserDetail

> **Standalone admin panel:** a separate React + Vite app (`Admin/`) runs on port 3001 (or Vercel). It covers the same backend data as the in-app admin dashboard. Neither can create users — users self-register. Admin actions: approve/reject sellers & charities, block/unblock/delete accounts.

---

### ③ Key User Flows

1. **Buyer rescue flow (the core loop):** Home → tap a listing card *(live decaying price + countdown + rescue badge)* → StoreDetails → Checkout → reserve → **ImpactCelebration (confetti)** → OrderConfirmed (QR) → later QRScan = pickup.
2. **Seller AI listing flow:** SellerDashboard → Create Listing → type Arabic title → **AI scores title (0–100) + suggests a better title + detects allergens + suggests price** → toggle `isPriceDecaying` + set floor price → publish.
3. **Donation flow:** Seller surplus → DonateSurplus → pick charity → Charity confirms with **proof photo upload** (camera or gallery).
4. **Dual-role:** Buyer Profile → "Become a seller" / one-tap switch to seller dashboard (no re-login, new JWT from `/auth/switch-role`).
5. **Admin moderation:** AdminDashboard Overview (charts + best-rated sellers) → approve pending seller/charity → Users tab → filter / unblock / delete accounts.
6. **Karam flow:** Seller toggles Karam **once at account level** in dashboard settings → all their listings inherit the Karam badge automatically. Buyer sees Karam listings on Home → taps seller → StoreDetails shows **two CTAs**: **"احجز"** (reserve for yourself, normal price) + **"الكرم"** (sponsor this meal — `POST /sellers/:id/karam/sponsor { listingId }`, amount = listing's `discountedPrice`).

---

### ④ Feature Table

| Feature | Screen(s) | Backend API | Status | Demo-worthy |
|---|---|---|---|---|
| **Live price decay + rescue badge + countdown** | ListingCard (Home, Browse) | computed client-side from `/listings` | ✅ Strong | **Yes — wow** |
| **AI listing assistant** (title score + price + allergens) | ListingForm | `/listings/ai/score-title`, `/price-suggestion`, `/suggest-allergens` | ✅ Strong | **Yes — centerpiece** |
| **Impact celebration** (confetti animation) | ImpactCelebration | reserve response | ✅ Strong | **Yes — wow** |
| **AI seller performance score** (public) | StoreDetails | `/listings/ai/performance/:id` | ✅ Confirmed working | **Yes** |
| **Karam community meals** (account-level toggle) | Home, StoreDetails | `/sellers/karam`, `POST /sellers/:id/karam/sponsor { listingId }` | ✅ Strong | **Yes — unique** |
| **Price-decay seller controls** (`isPriceDecaying` + `floorPrice`) | ListingForm | fields on `POST /listings` | ✅ Implemented | Yes |
| **Impact certificate PDF** (Arabic, Cairo font) | ProfileScreen | `/users/me/impact-certificate` | ✅ Confirmed working | Yes (show, don't demo live) |
| **Admin dashboard** (charts + best-rated + user management) | AdminDashboard | `/admin/stats/charts`, `/admin/users` | ✅ Confirmed working | **Yes — credibility close** |
| **Dual-role switch** | Profile | `/auth/switch-role` | ✅ Confirmed working | Yes (quick) |
| **Proof photo upload** (charity) | CharityDashboard | `POST /donations/:id/proof` | ✅ Implemented | Optional |
| **Web platform** (full-width browser build) | All screens | same backend | ✅ Working (Near Me AI call has open bug on web) | **Yes — wow moment** |
| **Language switch** (reloads app, RTL flips) | Settings modal | client-side | ✅ Confirmed working | Yes (30 sec) |
| AI chatbot (text) | ChatbotScreen | `/chatbot/message` | ✅ Strong | Yes |
| Browse + map + filters | BrowseScreen | `/listings`, `/heatmap` | ✅ Strong | **Yes — opener context** |
| Buyer Home (recommended + stats) | HomeScreen | `/listings/recommended` | ✅ Strong | **Yes — opener** |
| Seller analytics | SellerAnalytics | `/stats/my-analytics` | ✅ Working | Yes (brief) |
| Charity trust score | CharityPublicProfile | `/charities/:id/trust` | ✅ Working | Optional |
| Leaderboard / impact screens | Leaderboard, impact | `/stats/*`, `/users/me` | ✅ Working | Optional |
| Voice chatbot / Near Me voice | Chatbot, NearMe | `/chatbot/voice` | ⚠️ Average; Near Me has open web bug | **Risk** |
| OTP registration (Twilio) | PhoneEntry, OTP | `/auth/send-otp` | ⚠️ Twilio dependency | **Risk — skip live** |
| Karam Stripe sponsor payment | StoreDetails | `/sellers/:id/karam/sponsor` | ⚠️ Stripe test flow | **Risk — show UI only** |
| Monthly winner banner | HomeScreen | `/stats/monthly-winner` | ⚠️ Backend ready, UI placeholder | Optional |

---

## PHASE 2 — Demo Assessment

### ⑤ Most impressive screens (lead with these)

1. **Listing cards with live price decay (Home / Browse).** The card computes the decayed price client-side and shows a **countdown to expiry** + a **color-coded rescue badge** (`🔴 آخر فرصة` / `🟠 ينتهي قريباً` / `✅ صفقة جيدة`). The price visibly falling as the deadline nears is the single clearest expression of the food-waste mission — and it needs zero explanation.
2. **ListingFormScreen AI assistant.** Type an Arabic food title → AI scores it 0–100, suggests a better title, auto-detects allergens, recommends a price. Toggle `isPriceDecaying` + set a floor price. **Three real AI calls + a business-logic field in one screen.** This is what makes professors lean forward.
3. **ImpactCelebrationScreen.** Confetti animation revealing CO₂ saved + money saved + points after a reserve. Emotional payoff that makes the app feel finished and polished.
4. **StoreDetailsScreen.** Clean product page with a **public AI seller performance score**, reviews, and two distinct Karam CTAs (reserve vs. sponsor for someone in need) — proof the platform rates sellers and embeds a social-impact mission at the product level.
5. **Web platform moment.** Open `https://lefto-mobil.vercel.app` or the Vercel URL in a browser — same login, same data, full-width responsive layout, Leaflet map, Arabic RTL. 30 seconds that reads as serious cross-platform engineering.

### ⑥ Risky screens — avoid live

| Screen / feature | Why risky | Do instead |
|---|---|---|
| OTP registration (Twilio) | SMS may not deliver to demo numbers in Palestine | Use **seeded login accounts** — never register live |
| Voice chatbot / Near Me voice | Mic perms + Groq Whisper + room noise = unpredictable | Show **text** chatbot; mention voice exists |
| Near Me screen on web | `POST /chatbot/nearme` returns error on web (CORS or Groq rate limit) | Demo Near Me on native/mobile mirror only, or skip entirely |
| Karam Stripe sponsor payment | Needs Stripe test flow + webhook; body must include `{ listingId }`, amount = listing's `discountedPrice` | Show the **two-button Karam UI + availability counter** — don't trigger the payment |
| AI listing assistant (live) | Groq can stall under load; 3 calls in sequence | **Pre-record as insurance** — play recording if any call stalls past 4 s |
| Anything on cold Railway backend | First request after idle can be up to 5 s | **Warm up with a login 5 min before starting** |
| Ramadan mode / AppConfig | `isRamadanSeason` flag gates Ramadan-specific sections; unreliable outside season | Use always-visible sections: recommended + Karam + stats |
| Weekly sentiment insight (seller) | Backend may return empty if data is insufficient | Skip; show static analytics chart instead |

---

## PHASE 3 — 17-Minute Demo Script

> **Setup:** One driver (phone or browser mirrored to projector), one narrator. Keep the demo-accounts card handy. Warm up the backend with a login ~5 min before starting. Have the AI listing assistant segment pre-recorded as backup.

### ⑦ Demo flow (narrative order: problem → solution → wow → tech)

**▸ OPENING — set the scene · ~2 min**
- Open **Splash → HomeScreen**, already logged in as Buyer (ليلى, `0591111111`).
- Show recommended rescue listings, the Karam section, the CO₂ impact stat. Scroll slowly once.
- *Speaking line ⑧-1.* Don't tap yet — let them read the Arabic UI.

**▸ CORE FLOW — problem → solution · ~8 min**
1. **Live price decay (2 min).** On Home/Browse, point at a listing card: the price has dropped below the original, there's a **countdown** and a **rescue badge** (`🔴 آخر فرصة`). *Speaking line ⑧-2.* This is the heart of the product — give it a beat.
2. **Browse + map (1 min).** Tap Browse → map with seller pins + filters. "A buyer near closing time finds surplus food around them."
3. **Store details + reserve (2 min).** Tap the listing → StoreDetailsScreen. Note the **AI seller performance score** and reviews. Tap Reserve → CheckoutScreen → confirm.
4. **Impact celebration (1 min).** **ImpactCelebrationScreen** confetti → CO₂ + money + points. *Speaking line ⑧-3.* → OrderConfirmed shows the QR.
5. **Pickup integrity (1 min).** Orders tab → open order → QR scan screen. "At the shop the seller scans this — it can't be faked." Show scanner UI; no live scan needed.
6. **Two-sided loop (1 min).** Switch to seller account (`0551234567`) → SellerDashboard → the reservation just made appears in orders.

**▸ HIGHLIGHT FEATURES — wow moments · ~5 min**
7. **AI listing assistant (3 min — centerpiece).** Seller → Create Listing → type an Arabic title → trigger **title score + suggested title**, **allergen detection**, **price suggestion**. Toggle `isPriceDecaying` + enter floor price. *Speaking line ⑧-4.* Let it breathe; this is the peak. *(Cut to pre-recording if live call stalls.)*
8. **Karam community (1 min).** Back to buyer Home → Karam section → tap a Karam-enabled seller → StoreDetails shows **two buttons**: **"احجز"** (reserve for yourself) and **"الكرم"** (sponsor this meal for someone in need). Explain: the seller toggles Karam **once at account level** from their dashboard — every listing they have inherits the badge automatically. Availability = sponsored meals − claimed meals. **A social-impact mechanic built into the product, not added as an afterthought.**
9. **AI chatbot (1 min).** Open Chatbot → type an Arabic question (`ما هي العروض القريبة؟`) → contextual reply. Mention voice is supported too.

**▸ TECHNICAL CALLOUT — for the professors · ~2 min**
- *"One codebase, four roles, full Arabic RTL on every screen — and it runs in a browser."* Open the web build (Vercel URL or `https://lefto-mobil.vercel.app`) — same login, same data, full-width layout. Toggle language in settings to show the RTL flip live.
- State the engineering: **strict MVVM** (screen / hook / service separation), Axios auto-refresh interceptor, custom navigation state machine, **real AI (Groq + Gemini) — not mocked**, JWT dual-role switching with no re-login, platform-split `.web.ts` files so native and web share 100% of business logic.
- Close on the **Admin dashboard charts** as proof of a complete, multi-role platform.

---

### ⑧ Speaking script — the 4 key moments

**1 — Opening (Home):**
> "In Palestine, restaurants and bakeries throw away good food every night while families look for affordable meals. LeftO connects the two. This is the buyer's home — every listing here is surplus food being rescued right now, and the app already shows how much CO₂ this user has personally saved."

**2 — Live price decay (listing card):**
> "Here's what makes LeftO different. This price isn't fixed — it drops automatically as the pickup deadline approaches, and you can see the countdown right on the card. The closer to closing time, the cheaper the food, so almost nothing goes to waste."

**3 — Impact celebration (after reserve):**
> "When you rescue a meal we don't just show a receipt — we celebrate your impact: the CO₂ you saved, the money you saved, the points you earned. We're turning fighting food waste into something that actually feels rewarding."

**4 — AI listing assistant (ListingForm):**
> "A seller is busy at closing time, so we built an AI assistant into the listing form. It scores the title, suggests a better one in Arabic, detects allergens automatically, and recommends a fair price from real category data. The seller can also mark a listing as price-decaying and set a floor price so the algorithm never drops below cost. These are live AI calls — not mockups."

---

### ⑨ Live vs recorded

| Run **LIVE** (stable) | **Pre-record as insurance** |
|---|---|
| Home, Browse + map, listing-card price decay, StoreDetails, Checkout, ImpactCelebration, Orders, QR screen, Seller dashboard, Admin charts, dual-role switch, text chatbot, RTL toggle, web build moment, Karam two-button UI, language switch | **AI listing assistant** (Groq can be slow/rate-limited) · AI chatbot answer · anything OTP / Stripe / voice · Near Me on web |

**Web demo option:** If running on a laptop, mirror the browser (Vercel URL or `https://lefto-mobil.vercel.app`) instead of a phone. Full-width layout, no USB cable, larger projector area. Same risk profile — Railway backend is the bottleneck, not the platform.

**Recommendation:** Run the **core flow live** — it's stable and far more convincing. Pre-record **the AI listing assistant segment** and cut to the recording only if the live call stalls past ~4 seconds. Warm up Railway with a login 5 minutes before you start.

---

### ⑩ Questions the committee will definitely ask

**"Your AI and payment features depend on external APIs (Groq, Gemini, Stripe, Twilio). What happens when those fail?"**

> "We designed for exactly that. Every AI and notification call is non-blocking with a graceful fallback: if Groq is down, the listing form still works and the seller fills the fields manually; if push fails, the in-app notification still saves. The **core rescue loop — browse, reserve, pickup — has zero AI dependency** and runs entirely against our own backend. The three features we gated out of the live demo — Gemini image recognition, live Stripe, and Twilio OTP for Palestinian numbers — are integrated in code but depend on paid API tiers and regional carrier approval. Those are procurement steps, not engineering gaps."

**"Does this work on the web, or only mobile?"**

> "Both. We ship one TypeScript codebase. On native it compiles to iOS and Android via Expo. On the web it runs as a full-width React app — same screens, same hooks, same services — with platform-split files for native-only modules. The camera, push notifications (we switch to FCM VAPID on web), maps (we switch to Leaflet), and voice (we switch to the browser's Speech Recognition API) all have web equivalents. You can open it right now at [Vercel URL]."

**"What stops a buyer from cancelling indefinitely?"**

> "The backend enforces a cancellation policy: three or more cancellations blocks the account from making new reservations. Our frontend shows the cancellation count in the buyer's profile and surfaces a 403 error with a clear Arabic message at checkout if they're blocked."

---

## Quick reference — demo accounts

| Role | Phone | Password | Notes |
|---|---|---|---|
| Admin | 0598262751 | Admin123! | Full admin dashboard — charts, approvals, user management |
| Buyer (ليلى) | 0591111111 | Buyer123! | Primary buyer demo account |
| Seller / Karam (أبو العبد) | 0551234567 | Seller123! | Karam toggle ON, listings seeded, analytics populated |
| Charity | 0597777777 | Charity123! | Charity dashboard with incoming donations |
| Seller (PENDING) | 0556789012 | Seller123! | Awaiting approval — use for admin approval demo |
| Charity (PENDING) | 0597999999 | Charity123! | Awaiting approval — use for admin approval demo |

> **Backend warm-up:** Log in as Buyer 5 minutes before the demo starts. This wakes the Railway server and prevents the cold-start lag from hitting during the presentation.

---

## Confirmed working — backend-verified features (safe to demo live)

| Feature | Endpoint |
|---|---|
| Recommended listings | `GET /listings/recommended` |
| Listing detail | `GET /listings/:id` |
| Reserve (order) | `POST /orders` |
| Orders list | `GET /orders/me` |
| QR scan / pickup | `POST /orders/:id/scan` |
| Seller listings CRUD | `GET/POST/PUT/DELETE /listings` |
| AI title scorer | `POST /listings/ai/score-title` |
| AI allergen detection | `POST /listings/ai/suggest-allergens` |
| AI price suggestion | `POST /listings/ai/price-suggestion` |
| AI seller performance | `GET /listings/ai/performance/:id` |
| Text chatbot | `POST /chatbot/message` |
| Near Me (native only) | `GET /listings/nearby` + `POST /chatbot/nearme` |
| Favorites | `GET/POST/DELETE /favorites/me` |
| Notifications | `GET /notifications`, `PUT /notifications/:id/read` |
| Karam listings | `GET /sellers/karam` |
| Karam toggle (seller) | `PUT /sellers/:id/karam` |
| Karam sponsor (buyer) | `POST /sellers/:id/karam/sponsor { listingId }` |
| Impact certificate PDF | `GET /users/me/impact-certificate` (Arabic Cairo font, downloads as PDF) |
| Admin charts | `GET /admin/stats/charts` |
| Admin user list + filters | `GET /admin/users` |
| Admin block / unblock / delete | `PUT /admin/users/:id/block`, `DELETE /admin/users/:id` |
| Seller approval | `PUT /admin/sellers/:id/approve` |
| Charity approval | `PUT /admin/charities/:id/approve` |
| Dual-role switch | `POST /auth/switch-role` |
| Proof photo upload (charity) | `POST /donations/:id/proof` |
| Donation surplus | `POST /donations` |

---

**Bottom line:** price decay → reserve → impact celebration (emotional core) · AI listing assistant (technical peak) · web build moment + architecture + admin charts (credibility close). Five strong features, well demoed, in 17 minutes. Skip OTP, Stripe, voice, and Near Me on web live.
