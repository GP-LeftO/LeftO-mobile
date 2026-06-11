  # LeftO — Frontend Demo Plan

> **Senior Frontend Engineer & Demo Director report**
> Graduation committee · 20-minute slot (3 min intro + **17 min demo**)
> Last verified against source: 2026-06-11

**Golden rule:** A focused demo of **5 great features** beats a rushed tour of 15 average ones.
Lead with emotion (price decay → reserve → impact celebration), peak on the technical wow (AI listing assistant), close on credibility (architecture + admin charts).

---

## PHASE 1 — Frontend Scan

### ① Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.83.6 + Expo 55, TypeScript 5.9, React 19 |
| Navigation | **Custom state-machine in `App.tsx`** (not React Navigation at root) + `BuyerTabNavigator` (5 tabs) |
| State | React Context (`AuthContext`, `AppConfigContext`, `FavoritesContext`) + per-feature hooks (MVVM) |
| Networking | Axios with interceptor in `src/services/shared/api.ts` — auto Bearer token + 401 refresh |
| i18n / RTL | i18next + `react-i18next`, `isRTL()` — **full Arabic RTL on every screen** |
| Maps | `react-native-maps` + Leaflet WebView (`LeafletMap.tsx`) |
| Media / Voice | `expo-image-picker`, `expo-av`, `@react-native-voice/voice` (voice chatbot + Near Me) |
| Animation | `react-native-reanimated` (screen fade transitions, confetti celebration) |
| Push | `expo-notifications` — FCM token register/clear on auth, tap → deep-link routing |

**Architecture discipline:** Strict MVVM — Screen renders, Hook holds logic, Service calls API.
**45 screens · 28 services · 29 hooks.** No `api.get()` inside any screen. Unusually clean for a student project.

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
| ProfileScreen (impact tabs, settings, dual-role) | `/users/me`, `/auth/switch-role` |
| StoreDetailsScreen | `/listings/:id`, `/sellers/:id`, reviews, **`/listings/ai/performance/:id`** |
| CheckoutScreen | `POST /orders` |
| **ImpactCelebrationScreen** (confetti) | reserve response |
| OrderConfirmed / DonationConfirmed / CharitySelector | reserve + donate |
| QRScanScreen | `POST /orders/:id/scan` |

**Buyer extras:** NearMe (AI voice/text) · Chatbot (Groq text/voice) · Co2Impact / MoneySaved / DonationsImpact · Leaderboard · CharityDirectory / CharityPublicProfile (trust score) · Notifications

**Seller (8):** SellerDashboard (overview / listings / orders / donations) · **ListingFormScreen (AI title score + price suggestion + allergen detection)** · SellerAnalytics · DonateSurplus · DonationsHistory · Pending / Rejected

**Charity (3):** CharityDashboard (incoming / history + proof photo upload) · CharityInfo / CharityDocument registration

**Admin (4):** AdminRedirect · **AdminDashboard (Overview charts + Sellers + Charities + Users)** · AdminUserDetail

---

### ③ Key User Flows

1. **Buyer rescue flow (the core loop):** Home → tap a listing card *(live decaying price + countdown + rescue badge)* → StoreDetails → Checkout → reserve → **ImpactCelebration (confetti)** → OrderConfirmed (QR) → later QRScan = pickup.
2. **Seller AI listing flow:** SellerDashboard → Create Listing → type Arabic title → **AI scores title (0–100) + suggests a better title + detects allergens + suggests price** → publish.
3. **Donation flow:** Seller surplus → DonateSurplus → pick charity → Charity confirms with proof photo.
4. **Dual-role:** Buyer Profile → "Become a seller" / one-tap switch to seller dashboard (no re-login, new JWT).
5. **Admin moderation:** AdminDashboard Overview (charts) → approve pending seller/charity → manage / unblock / delete users.

---

### ④ Feature Table

| Feature | Screen(s) | Backend API | Visual quality | Demo-worthy |
|---|---|---|---|---|
| **Live price decay + rescue badge + countdown** | **ListingCard** (Home, Browse) | computed client-side from `/listings` | Strong | **Yes — wow** |
| **AI listing assistant** (title score + price + allergens) | ListingForm | `/listings/ai/score-title`, `/price-suggestion`, `/suggest-allergens` | Strong | **Yes — centerpiece** |
| **Impact celebration** (confetti animation) | ImpactCelebration | reserve response | Strong | **Yes — wow** |
| **AI seller performance score** (public) | StoreDetails | `/listings/ai/performance/:id` | Strong | **Yes** |
| **Karam community meals** | Home, StoreDetails | `/sellers/karam`, `/sellers/:id/karam`, `POST /sellers/:id/karam/sponsor { listingId }` | Strong | **Yes — unique** |
| AI chatbot (text) | ChatbotScreen | `/chatbot/message` | Strong | Yes |
| Browse + map + filters | BrowseScreen | `/listings`, `/heatmap` | Strong | Yes |
| Buyer Home (recommended + stats) | HomeScreen | `/listings/recommended` | Strong | **Yes — opener** |
| Admin dashboard charts | AdminDashboard | `/admin/stats/charts` | Average–Strong | Yes |
| Seller analytics | SellerAnalytics | `/stats/my-analytics` | Average | Yes |
| Dual-role switch | Profile | `/auth/switch-role` | Average | Yes (quick) |
| Charity trust score | CharityPublicProfile | `/charities/:id/trust` | Average | Yes |
| Leaderboard / impact screens | Leaderboard, impact | `/stats/*`, `/users/me` | Average | Optional |
| Voice chatbot / Near Me voice | Chatbot, NearMe | `/chatbot/voice` | Average | **Risk** |
| OTP registration | PhoneEntry, OTP | `/auth/send-otp` | Average | **Risk (Twilio)** |
| Karam Stripe payment | StoreDetails sponsor | `/sellers/:id/karam/sponsor` | Average | **Risk (Stripe)** |
| Impact certificate PDF | Profile | `/users/me/impact-certificate` | Unknown | **Risk** |

---

## PHASE 2 — Demo Assessment

### ⑤ Most impressive screens (lead with these)

1. **Listing cards with live price decay (Home / Browse).** The card computes the decayed price client-side and shows a **countdown to expiry** + a **color-coded rescue badge** (`🔴 آخر فرصة` / `🟠 ينتهي قريباً` / `✅ صفقة جيدة`). The price visibly falling as the deadline nears is the single clearest expression of the food-waste mission — and it needs zero explanation.
2. **ListingFormScreen AI assistant.** Type an Arabic food title → AI scores it 0–100, suggests a better title, auto-detects allergens, recommends a price. **Three real AI calls in one screen.** This is what makes professors lean forward.
3. **ImpactCelebrationScreen.** Confetti animation revealing CO₂ saved + money saved + points after a reserve. Emotional payoff that makes the app feel finished and polished.
4. **StoreDetailsScreen.** Clean product page with a **public AI seller performance score**, reviews, and the reserve/donate CTAs — proof the platform rates sellers, not just lists food.

### ⑥ Risky screens — avoid live

| Screen / feature | Why risky | Do instead |
|---|---|---|
| OTP registration (Twilio) | SMS may not deliver to demo numbers | Use **seeded login accounts** |
| Voice chatbot / Near Me voice | Mic perms + Groq Whisper + room noise = unpredictable | Show **text** chatbot; mention voice exists |
| Karam Stripe sponsor | Needs Stripe test flow + reachable webhook; body must include `{ listingId }` and amount = listing's discounted price | Show Karam UI (the two buttons + availability count), don't trigger payment live |
| Impact certificate PDF | May not render inline on device | Skip, or mention as a feature |
| Anything on cold Railway backend | First request after idle is slow | **Warm up with a login 5 min before** |

---

## PHASE 3 — 17-Minute Demo Script

> **Setup:** one driver (phone mirrored to projector), one narrator. Keep the demo-accounts card handy. Warm up the backend with a login ~5 min before starting.

### ⑦ Demo flow (narrative order: problem → solution → wow → tech)

**▸ OPENING — set the scene · ~2 min**
- Open **Splash → HomeScreen**, already logged in as Buyer (ليلى, `0591111111`).
- Show recommended rescue listings, the Karam section, the CO₂ impact stat. Scroll slowly once.
- *Speaking line ⑧-1.* Don't tap yet — let them read the Arabic UI.

**▸ CORE FLOW — problem → solution · ~8 min**
1. **Live price decay (2 min).** On Home/Browse, point at a listing **card**: the price has dropped below the original, there's a **countdown** and a **rescue badge** (`🔴 آخر فرصة`). *Speaking line ⑧-2.* This is the heart of the product — give it a beat.
2. **Browse + map (1 min).** Tap Browse → map with seller pins + filters. "A buyer near closing time finds surplus food around them."
3. **Store details + reserve (2 min).** Tap the listing → StoreDetailsScreen. Note the **AI seller performance score** and reviews. Tap Reserve → CheckoutScreen → confirm.
4. **Impact celebration (1 min).** **ImpactCelebrationScreen** confetti → CO₂ + money + points. *Speaking line ⑧-3.* → OrderConfirmed shows the QR.
5. **Pickup integrity (1 min).** Orders tab → open order → QR scan screen. "At the shop the seller scans this — it's cryptographically signed, so it can't be faked." (Show the scanner UI; no live scan needed.)
6. **Two-sided loop (1 min).** Switch to seller account (`0551234567`) → SellerDashboard → the reservation just made appears in orders.

**▸ HIGHLIGHT FEATURES — wow moments · ~5 min**
7. **AI listing assistant (3 min — centerpiece).** Seller → Create Listing → type an Arabic title → trigger **title score + suggested title**, **allergen detection**, **price suggestion**. *Speaking line ⑧-4.* Let it breathe; this is the peak.
8. **Karam community (1 min).** Back to buyer Home → Karam section → tap a Karam-enabled seller → StoreDetails shows two buttons: **"احجز"** (reserve for yourself) and **"الكرم"** (sponsor this listing for someone in need). Explain: the seller toggles Karam once at account level and all their listings inherit the badge — availability = sponsored meals − claimed meals. Unique social-impact angle.
9. **AI chatbot (1 min).** Open Chatbot → type an Arabic question (`ما هي العروض القريبة؟`) → contextual reply. Mention voice is supported too.

**▸ TECHNICAL CALLOUT — for the professors · ~2 min**
- *"One codebase, four roles, full Arabic RTL on every screen."* Toggle language on one screen to prove RTL flips live.
- State the engineering: **strict MVVM** (screen / hook / service separation), Axios auto-refresh interceptor, custom navigation state machine, **real AI (Groq) — not mocked**, JWT dual-role switching with no re-login.
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
> "A seller is busy at closing time, so we built an AI assistant into the listing form. It scores the title, suggests a better one in Arabic, detects allergens automatically, and recommends a fair price from real category data. These are live AI calls — not mockups."

---

### ⑨ Live vs recorded

| Run **LIVE** (stable) | **Pre-record as insurance** |
|---|---|
| Home, Browse + map, listing-card price decay, StoreDetails, Checkout, ImpactCelebration, Orders, QR screen, Seller dashboard, Admin charts, dual-role switch, text chatbot, RTL toggle | **AI listing assistant** (Groq can be slow/rate-limited) · **AI chatbot** answer · anything OTP / Stripe / voice |

**Recommendation:** Run the **core flow live** — it's stable and far more convincing. Pre-record **only the two AI moments** and cut to the recording only if the live call stalls past ~4 seconds. Warm up Railway with a login 5 minutes before you start.

---

### ⑩ The question the committee will definitely ask

**"Your AI and payment features depend on external APIs (Groq, Gemini, Stripe, Twilio). What happens when those fail, hit rate limits, or there's no internet — is this actually production-ready?"**

**Honest answer:**
> "We designed for exactly that. Every AI and notification call is non-blocking with a graceful fallback: if Groq is down, the listing form still works and the seller fills the fields manually; if push fails, the in-app notification still saves. The **core rescue loop — browse, reserve, pickup — has zero AI dependency** and runs entirely against our own backend. The three features we deliberately scoped out of this demo — Gemini image recognition, live Stripe, and Twilio OTP for Palestinian numbers — are integrated in code but gated on paid API tiers and regional carrier approval. Those are procurement steps, not engineering gaps: the platform is production-ready, and those three are one billing/approval step away."

---

## Quick reference — demo accounts

| Role | Phone | Password |
|---|---|---|
| Admin | 0598262751 | Admin123! |
| Buyer (ليلى) | 0591111111 | Buyer123! |
| Seller / Karam (أبو العبد) | 0551234567 | Seller123! |
| Charity | 0597777777 | Charity123! |
| Seller (PENDING — for admin approval demo) | 0556789012 | Seller123! |
| Charity (PENDING — for admin approval demo) | 0597999999 | Charity123! |

---

**Bottom line:** price decay → reserve → impact celebration (emotional core) · AI listing assistant (technical peak) · architecture + admin charts (credibility close). Five strong features, well demoed, in 17 minutes. Skip OTP, Stripe, voice, and PDF live.
