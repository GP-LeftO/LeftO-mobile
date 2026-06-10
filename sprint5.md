# LeftO — Sprint 5 (Final)

**Tue May 12 – Fri May 15, 2026 | Second-to-Last Sprint**

D1 \= غيداء (Backend) | D2 \= Tala (Mobile/Web Frontend) Two weeks total until June 2\. Sprint 5 \= new features. Sprint 6 \= polish \+ testing only.

---

## 🌟 DR. HAYA PRIORITY FEATURES — Build These First

These four features from the May 13 supervisor meeting are the highest priority in the project. They go above everything else including council suggestions.

---

### Feature A — RAG Chatbot with Live DB Access \+ Voice (Whisper)

**What it does:** The chatbot no longer answers from a static knowledge base. It queries the live database — real listings, real stores, real user preferences — and answers questions like "ايش في مطاعم قريب مني هلق بتعمل باستا؟" with actual current data. The user can also speak: record a voice message → Whisper transcribes it → RAG answers.

**Architecture (Context-Injection RAG — right approach for structured data):**

User message (text or voice)

  → \[if voice\] OpenAI Whisper API → transcribed text

  → buildRAGContext(): query listings within 5km radius (if coords provided),

    pull user allergen prefs \+ favorite sellers from DB

  → Format as context block → inject into Groq system prompt

  → Groq (llama-3.3-70b) answers in Arabic or English

Why not vector embeddings? Listings are structured SQL data. Querying by location/category/time is more accurate than semantic similarity. Vectors make sense for unstructured text (reviews). The committee will respect this distinction.

**D1 backend tasks:**

- Upgrade `POST /api/chatbot/message` to accept optional `{ latitude, longitude }` in body. If provided → query listings within 5km that are active right now → inject as context.  
- New `buildRAGContext(userId, message, coords?)` function: pulls nearby listings, user allergens, favorite sellers, formats as readable context block.  
- New endpoint `POST /api/chatbot/voice`: accepts `multipart/form-data` with audio file \+ optional lat/lng. Pipe to OpenAI Whisper API (`whisper-1`) → transcript text → run through RAG pipeline → return `{ transcript, reply }`. Install `openai` npm package (for Whisper only — Groq stays for generation).

**D2 mobile tasks:**

- Chatbot UI: add microphone button. Tap \+ hold to record → release → sends to voice endpoint → shows transcript first then answer. Waveform animation while recording.  
- If RAG answer includes store names, render tappable store mini-cards inside the chat. Tap → store details page.

---

### Feature B — "اسألني الآن 📍" Near Me Now (Dedicated Feature)

**What it does:** A prominent button on the home screen. User is walking in Nablus, feels hungry, taps → GPS injected automatically → speaks or types → AI answers with real stores near them right now.

**Answer to your question — RAG in chat or separate feature?** **Both. One engine, two surfaces.**

|  | Chatbot (existing) | اسألني الآن (new) |
| :---- | :---- | :---- |
| Where | Settings → Support | Home screen — prominent |
| Location | Optional | Always auto-injected |
| Trigger | User opens chat | User is physically somewhere now |
| Feel | Support \+ Q\&A | Instant, contextual, location-first |
| Backend | Same endpoint | Same endpoint — always sends coords |

The committee sees a named feature AND a smarter chatbot. You build the backend once.

**D1 backend:** No extra work — Feature A already covers it.

**D2 mobile:**

- Home screen: "اسألني الآن 📍" floating button or card above listing sections.  
- Tap → get GPS → open Near Me chat screen pre-seeded with "أنا في \[area from GPS\] — ايش في قريب مني هلق؟" and coords silently attached.  
- Location pin loading animation. Results include tappable store cards.  
- This screen looks different from the regular chatbot: cleaner, faster, location-focused.

---

### Feature C — وجبة معلقة (Suspended Meal / Free Food)

**What it does:** Any user (buyer or seller) can "hang" a free meal for whoever needs it. Deeply rooted in Arab/Islamic culture — someone prepares food and makes it available for whoever comes and asks. No charity required. Both sides anonymous. Pure community giving.

**D1 backend:**

- Add `SUSPENDED_MEAL` to `ListingType` enum (migration).  
- Allow BUYER role on `POST /api/listings` when `type=SUSPENDED_MEAL`. Price forced \= 0, quantity required, pickup \= today.  
- `GET /api/listings` returns a `suspendedMeals: []` array in the response.  
- Order creation for SUSPENDED\_MEAL: price=0, no payment logic needed.

**D2 mobile:**

- New "وجبات معلقة 💚" section on home screen (green card style, "مجاناً" badge).  
- Claim button → order at 0 NIS.  
- Post suspended meal flow: any user can post — simple form (description, quantity, pickup time window today only). No business docs required.

---

###                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       Feature D — تكية \+ حقائب رمضان (Takiya \+ Ramadan Bags)

**تكية — Year-round:** A traditional community food spot that runs continuously. A person, household, or business opens a تكية and regularly offers free or very cheap food (0–2 NIS max — symbolic price). Unlike a suspended meal (one-off), a تكية is a recurring daily presence.

- New listing type: `TAKIYA`. Price: 0 to 2 NIS max (validated).  
- Any authenticated user can post.  
- `repeatDaily: Boolean` field — if true, listing auto-recreates each day (lazy recreation on first `GET /api/listings` call of the day).  
- Special "🕌 التكية" section on home with distinct visual identity.

**حقائب رمضان — Seasonal:** During Ramadan, anyone can post leftover food from iftars and gatherings as free or cheap bags.

- New listing type: `RAMADAN_BAG`. Any user can post.  
- New `AppConfig` table (single row): `isRamadanSeason: Boolean default false`, toggled by admin.  
- When `isRamadanSeason=false` → RAMADAN\_BAG listings hidden from discovery.  
- When `isRamadanSeason=true` → "حقائب رمضان 🌙" section appears on home screen with special banner.  
- For the demo: admin toggles it ON live. Tell the committee: "this activates automatically during Ramadan."

**D1 backend:** Migration (add TAKIYA, RAMADAN\_BAG, repeatDaily, AppConfig table) \+ business logic for each \+ `PATCH /api/admin/config` to toggle.

**D2 mobile:** تكية section \+ Ramadan banner (toggled) \+ post flow for both types (simpler than seller listing — no docs).

---

## 🏛️ Council Recommendations (Integrated Below DR. Haya Items)

| Recommendation | Status |
| :---- | :---- |
| QR/barcode generation on listing creation | ✅ Day 1 |
| Full-screen impact celebration after order received | ✅ Day 1 |
| Live impact counter on landing page | 🔜 Sprint 6 Day 1 (quick D2 task) |
| Polish onboarding screens | 🔜 Sprint 6 Day 1 |
| Seed realistic full week of activity | ✅ Day 4 |

---

## Day 1 — Tuesday, May 12

**Goal: Foundation features — forgot PW, profile endpoint, QR. DR. Haya features start Day 2\.**

| Task | Dev | Hrs | Definition of Done |
| :---- | :---- | :---- | :---- |
| **Forgot password flow.** `POST /api/auth/forgot-password` (phone → OTP) \+ `POST /api/auth/reset-password` (OTP \+ newPassword → bcrypt hash \+ invalidate all refresh tokens). Reuse existing OTP service. | D1 | 1.5h | Full flow works. Old sessions rejected after reset. Wrong OTP → 400\. Postman tested. |
| **GET /api/users/me.** One call returns: user fields, points, totalCo2SavedG \+ kg, badges array (id \+ earnedAt), activeOrdersCount, donationCount, role-specific seller/charity data. No N+1. | D1 | 1.5h | Correct shape all 3 roles. CO2 in grams \+ kg. Postman tested. |
| **QR code generation on listing creation.** `npm install qrcode`. `POST /api/listings` auto-generates QR with HMAC-SHA256 signed token (24h expiry). Saved as `qrCodeUrl` (base64 data URL). `GET /api/listings/:id` includes it. `POST /api/orders/:id/scan` verifies token \+ marks received. | D1 | 2h | QR on every new listing. Scan validates expiry. Expired → 400\. Postman tested. |
| **Full Profile page (mobile).** Avatar, name, points, CO2 kg, badge grid (earned \= colored, locked \= gray). Tabs: Orders (Leave Review on eligible) / Donations. Loads from `GET /api/users/me`. Pull-to-refresh. RTL. | D2 | 3h | One API call. Badge grid renders. RTL correct. |
| **Impact celebration screen (mobile).** Full-screen after order received. CO2 counter animates, equivalence line, badge (if earned), points, confetti. | D2 | 2h | Fires after received. Animates. RTL correct. |

---

## Day 2 — Wednesday, May 13

**Goal: RAG upgrade \+ Whisper \+ "اسألني الآن" — the biggest technical day.**

| Task | Dev | Hrs | Definition of Done |
| :---- | :---- | :---- | :---- |
| **RAG chatbot upgrade.** Upgrade `POST /api/chatbot/message` to accept optional `lat/lng`. Add `buildRAGContext()`: if coords → query active listings within 5km. Pull user allergens \+ favorites. Format as context block → inject into Groq system prompt. Test with Nablus coordinates \+ "ايش في قريب مني هلق؟" → should return real listing names. | D1 | 2h | With coords → real listings in answer. User allergens excluded. Groq answers in Arabic. Postman tested. |
| **Whisper voice endpoint.** `POST /api/chatbot/voice` — multipart: `audio` file \+ optional `lat/lng`. Call OpenAI Whisper (`whisper-1`) → transcript → run through RAG pipeline → return `{ transcript, reply }`. `npm install openai`. | D1 | 2h | Audio → transcript → RAG → answer. Returns both transcript \+ reply. Postman multipart tested with real voice recording. |
| **"اسألني الآن 📍" feature (mobile).** Prominent button on home screen. Tap → get GPS → open Near Me chat screen pre-seeded with message \+ coords. Mic button prominent. Location pin loading animation. Results with tappable store cards. Distinct look from regular chatbot. | D2 | 3h | GPS captured on tap. Pre-seeded message. Voice works. Store cards in answer tappable. RTL correct. |
| **Chatbot UI upgrade (mobile).** Add mic button to existing chatbot. Hold to record → release → voice endpoint → show transcript then answer. Waveform animation. Tappable store mini-cards in answers when stores mentioned. | D2 | 2h | Mic records. Transcript shown. Cards render. RTL correct. |

---

## Day 3 — Thursday, May 14

**Goal: وجبة معلقة \+ تكية \+ Ramadan bags \+ seller/charity dashboards.**

| Task | Dev | Hrs | Definition of Done |
| :---- | :---- | :---- | :---- |
| **DB migration: community listing types.** Add `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG` to `ListingType` enum. Add `repeatDaily Boolean default false` to Listing. Add `AppConfig` table (id, isRamadanSeason, updatedAt). Seed AppConfig with one row. | D1 | 0.5h | Migration runs clean. Types available. AppConfig seeded. |
| **وجبة معلقة backend.** Allow BUYER role on `POST /api/listings` for SUSPENDED\_MEAL. Force price=0. `GET /api/listings` returns `suspendedMeals: []`. Order at 0 NIS works. | D1 | 1h | Buyer can post. Price locked at 0\. Discovery returns them. Claim order works. Postman tested. |
| **تكية backend.** Price 0–2 NIS max validated. repeatDaily auto-recreates listing daily (lazy, same pattern as expiry). Any user can post. | D1 | 1h | تكية created by any user. Price \> 2 → 400\. Daily repeat works. Postman tested. |
| **Ramadan bags backend.** RAMADAN\_BAG type \+ AppConfig toggle. `GET /api/app/config` returns `{ isRamadanSeason }`. `PATCH /api/admin/config` (admin) toggles it. Listings filtered based on flag. | D1 | 1h | Admin toggles season. When off → Ramadan bags hidden. When on → appear in discovery. Postman tested. |
| **Community sections mobile (وجبة معلقة \+ تكية \+ Ramadan).** Home screen: "وجبات معلقة 💚" section (green cards, مجاناً badge) \+ "🕌 التكية" section. Ramadan banner \+ section when isRamadanSeason=true. Post suspended meal flow (simple form, any user). Claim button → 0 NIS order. | D2 | 3h | All 3 sections appear correctly. Claim works. Post form works. Ramadan appears/disappears with toggle. RTL correct. |
| **Seller dashboard endpoints \+ screen.** `GET /api/sellers/me/dashboard` (metrics) \+ `GET /api/sellers/me/orders` (paginated). Screen: 4 metric cards \+ orders list \+ QR per listing (full-screen on tap). | D1+D2 | D1: 1.5h, D2: 1.5h | Metrics correct. QR full-screen. RTL correct. |
| **Charity dashboard (mobile).** Screen 1: donations feed (Pending/History tabs). Screen 2: confirm \+ proof upload \+ success screen. | D2 | 1.5h | Full flow works. RTL correct. |

---

## Day 4 — Friday, May 15

**Goal: Admin backend \+ seed \+ E2E test \+ RTL QA \+ bugs.**

| Task | Dev | Hrs | Definition of Done |
| :---- | :---- | :---- | :---- |
| **Admin backend.** `GET /api/admin/stats` (includes community listing counts). `PATCH /api/admin/config`. `PATCH /api/admin/sellers/:id/status` \+ `PATCH /api/admin/charities/:id/status`. Admin role gate on all. | D1 | 1.5h | Stats complete. Config toggle works. Overrides fire notifications. Postman tested. |
| **Seed — full demo week.** Demo buyer: completed orders, badges, 150 pts, 1 suspended meal posted. Demo seller: 5 listings with QR \+ a تكية (repeatDaily). Demo charity: 8 confirmed donations. Demo admin. 2 suspended meals from community. Nablus Arabic content. Idempotent. | D1 | 1.5h | No empty states. QR on listings. Community sections populated. All demo accounts ready. |
| **Full E2E demo flow test.** (1) Buyer → Near Me Now → voice → impact screen. (2) Text chatbot with allergen filter. (3) Post وجبة معلقة → claim. (4) Donate → charity confirms. (5) Seller registers → QR generates. (6) Admin toggles Ramadan ON → section appears. Document bugs. | D1 | 2h | All flows work. Voice works. RAG returns real data. Ramadan toggle works live. Bugs documented. |
| **Reviews UI (mobile).** "اترك تقييم" → bottom sheet (4 star categories \+ comment) → success toast. Button → "✓ تم التقييم" after submit. | D2 | 1h | Review submits. Stars work. RTL. |
| **RTL full QA \+ bug fixing.** All new screens: Near Me, voice chat, community sections, impact screen, profile. Fix all demo-blocking bugs. | D2 | 2.5h | All new screens pass RTL. No demo blockers remain. |

---

## Hours Summary

| Day | Date | D1 | D2 | Focus |
| :---- | :---- | :---- | :---- | :---- |
| Day 1 | Tue May 12 | 5h | 5h | Foundation: forgot PW \+ profile \+ QR // Profile page \+ Impact screen |
| Day 2 | Wed May 13 | 4h | 5h | RAG \+ Whisper voice // Near Me Now \+ chatbot UI |
| Day 3 | Thu May 14 | 6h | 6h | وجبة معلقة \+ تكية \+ Ramadan // Community UI \+ dashboards |
| Day 4 | Fri May 15 | 5h | 3.5h | Admin \+ Seed \+ E2E // Reviews UI \+ RTL QA \+ bugs |
| **Total** |  | **\~20h** | **\~19.5h** |  |

---

## New Endpoints — Sprint 5

| Method | Path | Auth | Day |
| :---- | :---- | :---- | :---- |
| POST | /api/auth/forgot-password | None | D1 |
| POST | /api/auth/reset-password | None | D1 |
| GET | /api/users/me | Bearer | D1 |
| POST | /api/orders/:id/scan | Bearer (BUYER) | D1 |
| POST | /api/chatbot/message *(upgraded)* | Bearer | D2 |
| POST | /api/chatbot/voice | Bearer | D2 |
| POST | /api/listings/suspended | Bearer (ANY) | D3 |
| GET | /api/app/config | None | D3 |
| PATCH | /api/admin/config | Bearer (ADMIN) | D4 |
| GET | /api/sellers/me/dashboard | Bearer (SELLER) | D3 |
| GET | /api/sellers/me/orders | Bearer (SELLER) | D3 |
| GET | /api/admin/stats | Bearer (ADMIN) | D4 |
| PATCH | /api/admin/sellers/:id/status | Bearer (ADMIN) | D4 |
| PATCH | /api/admin/charities/:id/status | Bearer (ADMIN) | D4 |

**Modified:**

- `POST /api/listings` — QR auto-generation \+ BUYER role allowed for community types  
- `GET /api/listings/:id` — includes `qrCodeUrl`  
- `GET /api/listings` — includes `suspendedMeals[]`, `takiyaListings[]`, conditional `ramadanBags[]`

---

## Sprint 6 — Final (May 18 – June 2\)

| Item | Est. |
| :---- | :---- |
| Live impact counter on landing page | 2h D2 |
| Onboarding screen polish | 3h D2 |
| Points redemption (once DR.Haya confirms formula) | 3h D1 \+ 2h D2 |
| Admin web panel (React — basic) | 3h D2 |
| Review reply (seller responds to buyer) | 1h D1 |
| Final UI animations \+ micro-interactions | — |
| Demo video recording (backup) | — |
| Presentation slides | — |
| Stress test | — |
| Full RTL final pass | — |
| Seed data final review | — |

---

## Updated Demo Order — June 2

1. **Buyer registers** → sets nut allergy → home → taps **"اسألني الآن 📍"** → **speaks** into phone → Whisper transcribes → RAG answers with real Nablus stores → taps store card → reserves → marks received → **impact celebration fires** (CO2 \+ badge \+ confetti)  
2. **Text chatbot** → "في إشي حلو رخيص قريب مني؟" → RAG answers with allergen filter applied  
3. **وجبة معلقة** → buyer posts a free meal → second account claims it immediately — emotional moment  
4. **Donate flow** → charity gets live push → confirms → uploads proof → donor notified  
5. **تكية \+ Ramadan** → show التكية section → admin toggles Ramadan ON live → section appears on screen  
6. **Seller registers** → Chamber number → instant approval → posts listing → **QR auto-generates**  
7. **Admin panel** → live stats (bags, CO2, donations, community meals) — end on the big numbers

**Under 10 minutes. Practice until it runs clean.**

---

## Committee Q\&A (Updated)

| Question | Answer |
| :---- | :---- |
| "How does the AI know what's near me?" | It queries the live database in real time — active listings, GPS radius, availability right now, user allergen profile. Not a static knowledge base. |
| "How does voice work?" | Audio → OpenAI Whisper API → transcript → same RAG pipeline as text. Returns transcript \+ answer. |
| "What's a وجبة معلقة?" | Traditional Arab concept — someone prepares food and makes it available for whoever needs it. We digitized it. Any user posts one, any user claims it. No charity approval needed. |
| "Why تكية and not just charity?" | Charities require approval and formal processes. A تكية is informal and immediate — a family has extra food tonight. Different mechanism for different moments. |
| "How does Ramadan bags work?" | Any user posts leftover iftar food as cheap bags. The feature activates during Ramadan and disappears after — toggled by the admin. |
| "How does payment work?" | Cash on pickup for MVP — deliberate trust-building decision. Roadmap: Reflect \+ PalPay in Phase 2\. |
| "What if a seller doesn't show up?" | Ratings create reputational cost. Roadmap: 3 no-shows \= automatic delisting. |

---

*LeftO Sprint 5 Final | D1: غيداء | D2: Tala | For Palestine 🇵🇸*

# Impeding, rag system, on top بوخد كلشي من السيستم ويقرأ منه فيكتور ويسبر فويس”

# حسب موقعي شفلي مين بقدر يبيع هسا

# ويسبر للفويس

# هيك ما بحتاج جروك

# When is the final submission

# اي حد يشتري \-

# تكيات، رمضان اي حد بزيد عنده اكل سبيشل سكتور- free meals maybe

# 

