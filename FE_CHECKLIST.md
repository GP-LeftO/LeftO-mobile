# LeftO — Frontend Integration Guide for Tala

> This document explains every feature built in the latest backend sprint.
> Read this alongside the main `README.md` (which has all existing endpoints).
> Everything here is **new or changed** — if it's not in this file, check `README.md`.

Base URL (prod): `https://lefto-backend-production.up.railway.app`
Base URL (local): `http://localhost:3000`

Auth header (for all protected routes): `Authorization: Bearer <accessToken>`

---

## Table of Contents

1. [Dual Role — One Phone, Buyer + Seller](#1-dual-role)
2. [Cancellation Block System](#2-cancellation-block-system)
3. [Badge Decrement on Cancel](#3-badge-decrement-on-cancel)
4. [Monthly Winner Seller Banner](#4-monthly-winner-seller-banner)
5. [Admin Dashboard Upgrade](#5-admin-dashboard-upgrade)
6. [Admin Smart Filters + Delete](#6-admin-smart-filters--delete)
7. [AI — Allergen Detection](#7-ai--allergen-detection)
8. [AI — Title Scorer](#8-ai--title-scorer)
9. [AI — Price Suggestion](#9-ai--price-suggestion)
10. [AI — Seller Performance Score](#10-ai--seller-performance-score)
11. [AI — Food Image Recognition](#11-ai--food-image-recognition)
12. [AI — Proactive Push Notifications](#12-ai--proactive-push-notifications)
13. [AI — Smart Expiry Alerts](#13-ai--smart-expiry-alerts)
14. [AI — Predictive Waste Alerts (Seller)](#14-ai--predictive-waste-alerts-seller)
15. [AI — Weekly Sentiment Insight (Seller)](#15-ai--weekly-sentiment-insight-seller)
16. [Impact Certificate PDF](#16-impact-certificate-pdf)
17. [Karam (Suspended Meal) with Stripe Payment](#17-karam-suspended-meal-with-stripe-payment)
18. [Dynamic Expiry Pricing](#18-dynamic-expiry-pricing)
19. [SMS OTP via Twilio](#19-sms-otp-via-twilio)
20. [New Fields on Existing Responses](#20-new-fields-on-existing-responses)
21. [Listing Report / Flag System](#21-listing-report--flag-system)

---

## 1. Dual Role

**What changed:** A user can now register as both a buyer AND a seller (same phone number). Previously the backend enforced that only a SELLER-role user could register a seller profile. That guard is removed.

**Flow:**
- User registers with `role: "BUYER"` (normal)
- Later they can call `POST /api/sellers/register` with their buyer token and create a seller profile
- Login response already returns `sellerStatus` + `charityStatus` — use those to know what profiles exist

**What you need to do (FE):**
- On login, check the response:
  ```json
  {
    "user": { "id": "...", "role": "BUYER" },
    "sellerStatus": "APPROVED",
    "charityStatus": null,
    "accessToken": "..."
  }
  ```
- If `sellerStatus` is `"APPROVED"` even though `role` is `"BUYER"` → show seller dashboard option
- Add a "Become a Seller" button somewhere in the buyer profile settings that leads to `POST /api/sellers/register`
- The user doesn't change role — they just gain access to both dashboards
- **Tab pattern (recommended):** After login, if user has both a buyer profile and an approved seller profile, show a tab switcher: `[Buyer Mode] [Seller Mode]`. Store the active mode in local state.

---

## 2. Cancellation Block System

**What it is:** If a buyer cancels 5 or more orders, their account gets blocked. A blocked buyer cannot place any new orders.

**How it appears in API responses:**

When a blocked buyer tries to place an order (`POST /api/orders`):
```json
{
  "success": false,
  "message": "حسابك محظور بسبب إلغاء الحجوزات بشكل متكرر."
}
```
Status code: `403`

**What you need to show (FE):**
- When the buyer tries to place an order and gets a 403 with that Arabic message → show a **red banner or modal**: "تم تعليق حسابك بسبب إلغاء الحجوزات بشكل متكرر. تواصل مع الإدارة لإلغاء التعليق."
- To detect upfront: the user profile response includes `isBlocked: true`. You can fetch the profile on login and hide the "Order Now" button entirely if blocked.
- Intercept all `POST /api/orders` 403 errors globally and show the block message.

**Admin unblock endpoint:**
```
PATCH /api/admin/users/:userId/unblock
Auth: Admin token
```
Response:
```json
{
  "id": "...",
  "name": "Ahmad",
  "isBlocked": false,
  "cancellationCount": 0
}
```

**What to show in Admin Dashboard:**
- In the user list, show a red "محظور" badge next to blocked users
- Add an "Unblock" button that calls the unblock endpoint
- Filter: `GET /api/admin/users?isBlocked=true` to see all blocked users

---

## 3. Badge Decrement on Cancel

**What it is:** When a buyer cancels an order, the backend recalculates their "effective score" (`completedOrders - cancellationCount`). If this drops them below the badge threshold, the badge is automatically removed.

Affected badges:
- `loyal_buyer_5` — requires effective score ≥ 5
- `loyal_buyer_10` — requires effective score ≥ 10

**What you need to show (FE):**
- After a successful cancellation call, re-fetch the user's profile to get the updated badge list
- Compare badges before and after. If a badge disappeared → show a toast: "تم سحب شارة المشتري الوفي بسبب الإلغاء"
- The badges array in the user profile will simply not include the revoked badge anymore — no special field

---

## 4. Monthly Winner Seller Banner

**What it is:** At the end of every month, the backend automatically picks the seller with the highest average rating that month and stores them as the "monthly winner." This winner should appear as a **banner visible to ALL users** (buyers, sellers, charities, even guests).

**Endpoint:**
```
GET /api/stats/monthly-winner
Auth: NOT required — fully public
```

**Response (when a winner exists):**
```json
{
  "success": true,
  "data": {
    "winner": {
      "sellerId": "uuid",
      "name": "مطعم أبو العبد",
      "rating": 4.9,
      "month": "2026-05"
    }
  }
}
```

**Response (no winner yet — start of month):**
```json
{
  "success": true,
  "data": { "winner": null }
}
```

**What to show (FE):**

Show a highlighted banner at the top of the home/discovery screen whenever `winner !== null`:

```
┌─────────────────────────────────────────────┐
│  🏆 بائع الشهر — مايو 2026                   │
│  مطعم أبو العبد  ⭐ 4.9                       │
│             [ زيارة المتجر ]                  │
└─────────────────────────────────────────────┘
```

- Gold/yellow color scheme to make it stand out
- Tapping "زيارة المتجر" → navigate to `GET /api/sellers/:sellerId` profile page
- Show to ALL roles including unauthenticated users (guests)
- If `winner === null`, hide the banner completely (don't show a placeholder)
- Call this endpoint once on app launch and cache for the session

---

## 5. Admin Dashboard Upgrade

Two new endpoints for the admin dashboard.

### 5a. Charts — 6-Month Overview

```
GET /api/admin/stats/charts
Auth: Admin token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "charts": [
      { "month": "2025-12", "completedOrders": 45, "listingsCreated": 120, "newUsers": 18 },
      { "month": "2026-01", "completedOrders": 67, "listingsCreated": 180, "newUsers": 34 },
      { "month": "2026-02", "completedOrders": 89, "listingsCreated": 210, "newUsers": 41 },
      { "month": "2026-03", "completedOrders": 102, "listingsCreated": 240, "newUsers": 29 },
      { "month": "2026-04", "completedOrders": 134, "listingsCreated": 310, "newUsers": 56 },
      { "month": "2026-05", "completedOrders": 98,  "listingsCreated": 190, "newUsers": 37 }
    ]
  }
}
```

**What to show (FE):**
- Line chart or bar chart with 3 lines/bars per month
- X-axis: month labels (convert `"2026-05"` → `"مايو 2026"`)
- Y-axis: count
- Recommended library: `recharts` or `chart.js`

### 5b. Best-Rated Spotlight

```
GET /api/admin/stats/best-rated
Auth: Admin token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bestSeller": {
      "id": "...",
      "businessName": "مطعم أبو العبد",
      "rating": 4.9,
      "logoUrl": "https://...",
      "address": "نابلس"
    },
    "bestCharity": {
      "id": "...",
      "orgName": "جمعية إطعام نابلس",
      "region": "نابلس",
      "_count": { "donations": 47 }
    }
  }
}
```

**What to show (FE) — Admin Dashboard:**
```
┌──────────────────────┐  ┌──────────────────────┐
│  🏅 أفضل بائع         │  │  🤝 أنشط جمعية        │
│  مطعم أبو العبد       │  │  جمعية إطعام نابلس   │
│  ⭐ 4.9               │  │  47 تبرع مؤكد         │
└──────────────────────┘  └──────────────────────┘
```

---

## 6. Admin Smart Filters + Delete

### Users List with Filters

```
GET /api/admin/users
Auth: Admin token
Query params (all optional):
  ?page=1&limit=10
  &role=BUYER          (BUYER | SELLER | CHARITY | ADMIN)
  &isBlocked=true      (true | false)
  &search=Ahmad        (searches name, phone, email — case-insensitive)
```

**What to show (FE):**

Filter bar above the users table:
```
[ 🔍 Search name/phone/email ]  [ Role ▼ ]  [ Status ▼ ]  [ Apply ]
```

- Role dropdown: All / Buyer / Seller / Charity
- Status dropdown: All / Active / Blocked
- Search input with 300ms debounce before API call

### Delete User (Soft Delete)

```
DELETE /api/admin/users/:id
Auth: Admin token
```
Response: `{ "id": "...", "name": "...", "deletedAt": "2026-06-05T..." }`

Show a confirm dialog before calling: "هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع."

### Delete Listing

```
DELETE /api/admin/listings/:id
Auth: Admin token
```
Response: `{ "id": "...", "title": "...", "status": "EXPIRED", "deletedAt": "..." }`

Use this for admin moderation — removing inappropriate listings.

---

## 7. AI — Allergen Detection

**What it is:** Seller types in the listing title and description in Arabic, and the AI reads it and returns which allergens are present. Helps buyers with food allergies make safe choices.

```
POST /api/listings/ai/suggest-allergens
Auth: Seller token
Body:
{
  "title": "كنافة بالجبن والقشطة",
  "description": "محضرة بالسمن والجوز والعسل"
}
```

**Response:**
```json
{
  "allergens": ["gluten", "dairy", "nuts"],
  "arabicLabel": "جلوتين، منتجات الألبان، مكسرات"
}
```

**What to show (FE) — Create Listing screen:**

After seller fills in title + description, show a button:
```
[ 🧪 اكتشاف المواد المسببة للحساسية تلقائياً ]
```
On click → call the endpoint → pre-fill the `allergenNote` field with `arabicLabel`.

Seller can still edit it before submitting. This is a suggestion, not forced.

---

## 8. AI — Title Scorer

**What it is:** Seller writes a listing title and the AI scores it 0–100 and gives Arabic feedback on how to improve it (clarity, appeal, specificity).

```
POST /api/listings/ai/score-title
Auth: Seller token
Body:
{
  "title": "أكل",
  "category": "MEALS"
}
```

**Response:**
```json
{
  "score": 22,
  "feedback": "العنوان قصير جداً ولا يعطي المشتري أي فكرة عن المحتوى. أضف اسم الطبق وعدد الحصص أو الوزن. مثال: 'وجبة منسف دجاج 2 حصص — توفير 60%'"
}
```

**What to show (FE) — Create Listing screen:**

Live score indicator shown after seller finishes typing the title (call on blur):
```
[ اسم العرض: كنافة بالجبن من الفرن ... ] ✅

  تقييم العنوان:  ████████████░░░░░░░░   78/100  (ممتاز)
  💡 أضف وزن أو عدد الحصص لزيادة الجاذبية
```

Color coding:
- 0–40 → red / "ضعيف"
- 41–69 → orange / "مقبول"
- 70–100 → green / "ممتاز"

Call on `onBlur` of the title input, not on every keystroke.

---

## 9. AI — Price Suggestion

**What it is:** Based on similar listings in the same category (from the real database), the AI recommends an optimal discounted price. Helps sellers price competitively.

```
GET /api/listings/ai/price-suggestion?category=MEALS&originalPrice=30
Auth: Seller token
```

**Response:**
```json
{
  "suggestedPrice": 9,
  "discountPct": 69,
  "categoryAvgDiscount": 59,
  "sellerSellThrough": 0,
  "reasoning": "معدل بيعك (0%) أقل من المتوسط — جرّب خصماً أعمق لزيادة فرص البيع"
}
```

| Field | Description |
|-------|-------------|
| `suggestedPrice` | Recommended discounted price in NIS |
| `discountPct` | Suggested discount percentage applied |
| `categoryAvgDiscount` | Market average discount for this category |
| `sellerSellThrough` | This seller's sell-through rate (null if first listing) |
| `reasoning` | Arabic sentence explaining the recommendation |

**What to show (FE) — Create Listing screen:**

Next to the "Discounted Price" input field, show a hint chip:
```
[ السعر الأصلي: 30 ₪ ]   [ السعر بعد الخصم: ___ ₪ ]
                           💡 الأنسب: 9 ₪ (خصم 69%)
                           اضغط لتطبيق السعر المقترح
```

Use `suggestedPrice` to pre-fill. Seller can override it.

---

## 10. AI — Seller Performance Score

**What it is:** A composite AI score from 0–100 for each seller, calculated from their sell-through rate, rating, posting frequency, and verification status.

**Two endpoints:**

Personal (seller sees their own detailed breakdown):
```
GET /api/listings/ai/my-performance
Auth: Seller token
```

Public (anyone can see any seller's score — shown on public profile):
```
GET /api/listings/ai/performance/:sellerId
Auth: NOT required
```

**Response:**
```json
{
  "sellerId": "...",
  "performanceScore": 84,
  "breakdown": {
    "sellThroughRate": 0.87,
    "avgRating": 4.7,
    "weeklyListingCount": 12,
    "isVerified": true
  },
  "weeklyInsight": "💪 أقوى نقطة: سرعة الاستجابة | ⚠️ أكثر شكوى: التأخر في الاستلام"
}
```

**What to show (FE) — Public seller profile page:**
```
┌────────────────────────────────────┐
│  أداء البائع                        │
│  ████████████████░░░░   84/100      │
│  💪 سرعة الاستجابة                  │
│  ⚠️ التأخر في الاستلام              │
└────────────────────────────────────┘
```

**What to show on seller's own dashboard:**
- Same card + the breakdown: sell-through %, avg rating, weekly listings, verified badge
- `weeklyInsight` is generated by AI every Monday — can be `null` if seller has fewer than 5 reviews. If null, hide that section.

---

## 11. AI — Food Image Recognition

**What it is:** Seller takes a photo of their food and uploads it. Gemini AI analyzes the image and auto-suggests: category, Arabic title, allergens, and description. Dramatically speeds up listing creation.

```
POST /api/listings/ai/analyze-image
Auth: Seller token
Content-Type: multipart/form-data
Field name: photo   (JPEG or PNG, max 5MB)
```

**Response:**
```json
{
  "suggestedCategory": "MEALS",
  "suggestedTitle": "وجبة مشاوي مشكلة مع الخبز والسلطة",
  "suggestedAllergens": ["gluten"],
  "description": "طبق مشاوي متنوع يشمل شيش طاووق ولحم مشوي مع خبز عربي وسلطة طازجة",
  "confidence": 0.91
}
```

**What to show (FE) — Create Listing screen:**

Make the photo upload step the FIRST step, and add a magic auto-fill button:
```
[ 📸 أضف صورة الطعام ]
        ↓
[ ✨ تحليل الصورة وملء التفاصيل تلقائياً ]
```

After upload → show spinner (~2–3 seconds for Gemini) → pre-fill:
- Category dropdown
- Title field
- Description field
- Allergen note field

Show a soft blue info banner: "تم تعبئة التفاصيل بواسطة الذكاء الاصطناعي — يمكنك التعديل قبل النشر ✏️"

If `confidence < 0.5` → add a yellow warning: "الصورة غير واضحة — يرجى مراجعة التفاصيل بعناية"

---

## 12. AI — Proactive Push Notifications

**What it is:** When a seller posts a new listing, buyers who have favorited that seller OR bought from them in the last 30 days automatically receive a push notification. This is fully automatic — no endpoint to call.

**Notification received by buyer (via Firebase FCM):**
```json
{
  "title": "مطعم أبو العبد أضاف عرضاً جديداً!",
  "body": "وجبة منسف دجاج 2 حصص — 12 شيكل، باقي 5 فقط"
}
```

**What you need to do (FE):**
- Make sure FCM device token is registered: `PUT /api/auth/fcm-token` after login with `{ "fcmToken": "..." }` body
- Tapping the notification → navigate to the specific listing's detail screen
- Standard FCM push — no special UI needed beyond normal notification handling

---

## 13. AI — Smart Expiry Alerts

**What it is:** 2 hours before a listing expires, buyers who favorited that seller get a push notification. Runs automatically every hour. Fully automatic — no endpoint needed.

**Notification received:**
```json
{
  "title": "🕐 عرض ينتهي خلال ساعتين!",
  "body": "كنافة بالجبن من مخبز الحاج خليل — باقي 2 فقط"
}
```

Tapping → navigate to the listing detail screen.

---

## 14. AI — Predictive Waste Alerts (Seller)

**What it is:** Every Sunday at 8am, the backend analyzes each seller's historical listing patterns. If a specific day+time slot has a >70% unsold rate over 3+ attempts, the seller gets a warning push. Fully automatic.

**Notification received by seller:**
```json
{
  "title": "⚠️ تحذير من هدر الطعام",
  "body": "الثلاثاء بين 7م–9م يُسجّل نسبة بيع أقل من 30% في آخر 4 أسابيع. فكّر في تخفيض السعر أو تغيير وقت النشر."
}
```

Tapping → navigate to the seller's own analytics/dashboard.

---

## 15. AI — Weekly Sentiment Insight (Seller)

**What it is:** Every Monday at 8am, the AI reads all reviews a seller received in the past month, classifies positive vs negative patterns, and generates one Arabic insight line. Stored on the seller profile as `weeklyInsight`. Fully automatic.

Example output: `"💪 أقوى نقطة: طعام لذيذ وطازج | ⚠️ أكثر شكوى: الانتظار الطويل"`

**Where it appears:** In the performance score response (`GET /api/listings/ai/my-performance`) under `weeklyInsight`.

**What to show (FE) — Seller dashboard:**
```
┌─────────────────────────────────────────┐
│  ملخص آراء العملاء هذا الأسبوع           │
│  💪 طعام لذيذ وطازج                      │
│  ⚠️ الانتظار الطويل                      │
└─────────────────────────────────────────┘
```

- Green row for the strength (starts with 💪)
- Orange/red row for the complaint (starts with ⚠️)
- If `weeklyInsight` is `null` → hide this card entirely (don't show empty)
- Title: "ملخص آراء العملاء هذا الأسبوع"

---

## 16. Impact Certificate PDF

**What it is:** Any authenticated user can download a PDF certificate showing their environmental impact for a specific month — meals saved and CO2 prevented.

```
GET /api/users/me/impact-certificate?month=2026-05
Auth: Any user token (buyer, seller, or charity)
```

**Response:** Binary PDF file (not JSON). Content-Type: `application/pdf`

The PDF contains:
- Green gradient header: "شهادة أثر بيئي — LeftO"
- User's name
- Month in Arabic
- Number of meals saved
- CO2 saved in kg
- Arabic equivalent (e.g., "يعادل 12 رحلة بالسيارة")
- Total all-time stats

**What to show (FE):**

A download button on the buyer profile or order history screen:
```
[ 📄 تحميل شهادتي البيئية — مايو 2026 ]
```

Month picker: let user select any past month (format: `YYYY-MM`).

**How to download (JavaScript):**
```javascript
const response = await fetch(
  `/api/users/me/impact-certificate?month=2026-05`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const blob = await response.blob();
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href     = url;
a.download = 'lefto-impact-2026-05.pdf';
a.click();
```

For React Native:
- Use `expo-file-system` + `expo-sharing` to download and share the blob

---

## 17. Karam (Suspended Meal) with Stripe Payment

**What it is:** Sellers can participate in Karam — buyers pay online to sponsor a free meal for someone in need. The seller tracks how many sponsored meals are in their counter.

---

### Buyer Flow

**Step 1 — See Karam sellers:**
```
GET /api/sellers/karam
Auth: NOT required
```
Returns list of sellers with `participatesInKaram: true` and their `karamMealPrice` (NIS).

Show these sellers with a special "كرم" badge on their card.

**Step 2 — Initiate payment:**
```
POST /api/sellers/:sellerId/karam/sponsor
Auth: Buyer token
Body: {} (empty)
```

Response:
```json
{
  "clientSecret": "pi_xxxxx_secret_xxxxx",
  "amountNIS": 15,
  "sellerName": "مطعم أبو العبد"
}
```

**Step 3 — Complete payment with Stripe:**

Use `clientSecret` with Stripe's frontend SDK:

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

// Show Stripe payment sheet using clientSecret
const { error } = await stripe.confirmPayment({
  elements,         // Stripe Elements mounted to a div
  clientSecret,
  confirmParams: {
    return_url: 'https://yourapp.com/karam/success'
  }
});
```

For React Native → use `@stripe/stripe-react-native` and `initPaymentSheet` + `presentPaymentSheet`.

**After successful payment:**
Show confirmation screen: "شكراً! دعمت وجبة مجانية لشخص محتاج 💚 — جزاك الله خيراً"

> Note: The backend increments the Karam counter automatically via Stripe webhook. You don't need to call anything after payment success — just show the confirmation.

---

### Seller Flow

**Toggle Karam on/off + set price:**
```
PATCH /api/sellers/me/karam
Auth: Seller token
Body:
{
  "participatesInKaram": true,
  "karamMealPrice": 15
}
```

- `karamMealPrice` is required when enabling Karam (how much buyers pay per meal)
- Set `participatesInKaram: false` to opt out (karamMealPrice not needed)

**Check Karam balance:**
```
GET /api/sellers/:id/karam
Auth: NOT required
```
Response: `{ "karamBalance": 5 }` — sponsored meals waiting to be claimed

**Claim a meal (when serving a needy person):**
```
POST /api/sellers/me/karam/claim
Auth: Seller token
Body: {} (empty)
```
Decrements the counter by 1. Show in the seller dashboard as "وجبة كرم مستخدمة".

**What to show on seller dashboard:**
```
┌────────────────────────────────────┐
│  كرم الوجبة المعلقة                 │
│  رصيد الوجبات: 5 وجبات              │
│  السعر للوجبة: 15 ₪                 │
│  [تفعيل/إيقاف]   [استخدام وجبة]    │
└────────────────────────────────────┘
```

---

## 18. Dynamic Expiry Pricing

**What it is:** Sellers can enable automatic price decay on a listing. The price decreases linearly from `discountedPrice` down to `floorPrice` as the listing approaches its expiry time. Buyers see the live `currentPrice` — updated every time they fetch listings.

**Creating a decaying listing (`POST /api/listings` — new fields):**
```json
{
  "title": "كنافة بالجبن",
  "originalPrice": 30,
  "discountedPrice": 20,
  "expiryDate": "2026-06-06T18:00:00Z",
  "isPriceDecaying": true,
  "floorPrice": 5,
  ...other fields
}
```

Validation rules:
- `isPriceDecaying: true` → `floorPrice` is required
- `floorPrice` must be less than `discountedPrice`
- `expiryDate` is required for price decay to work

**Every listing in `GET /api/listings` and `GET /api/listings/search` now includes:**
```json
{
  "discountedPrice": 20,
  "floorPrice": 5,
  "isPriceDecaying": true,
  "currentPrice": 13.50,
  "expiryDate": "2026-06-06T18:00:00Z"
}
```

`currentPrice` = the live price right now. Always between `discountedPrice` and `floorPrice`.

**What to show (FE) — Listing card:**

For non-decaying listings: show `currentPrice` (same as `discountedPrice`).

For decaying listings (`isPriceDecaying: true`):
```
┌──────────────────────────────────────────┐
│  كنافة بالجبن                             │
│  ~~30 ₪~~  →  13.50 ₪  🔥                │
│  ينخفض تلقائياً | الحد الأدنى 5 ₪        │
│  ⏰ ينتهي خلال 3 ساعات                   │
└──────────────────────────────────────────┘
```

- Always display `currentPrice` as the main visible price
- Strikethrough: `originalPrice` (the full price before any discount)
- Small label: "ينخفض تلقائياً" with 🔥
- Show `floorPrice` so buyer knows the lowest it can go
- Refresh price every 60 seconds while user is on the screen

**Optional local calculation (avoids extra network requests):**

You can calculate `currentPrice` client-side using the same formula the backend uses:
```javascript
function computeCurrentPrice(listing) {
  if (!listing.isPriceDecaying || !listing.floorPrice || !listing.expiryDate) {
    return listing.discountedPrice;
  }
  const now      = Date.now();
  const start    = new Date(listing.createdAt).getTime();
  const end      = new Date(listing.expiryDate).getTime();
  const total    = end - start;
  if (now >= end)   return listing.floorPrice;
  if (now <= start) return listing.discountedPrice;
  const progress = (now - start) / total;
  const price    = listing.discountedPrice - progress * (listing.discountedPrice - listing.floorPrice);
  return Math.max(Math.round(price * 100) / 100, listing.floorPrice);
}
```

Run this on a 60-second interval and update the displayed price in real time — no extra API call needed.

---

## 19. SMS OTP via Twilio

**What changed:** OTP codes are now sent as real SMS messages to the user's phone number. The endpoint is exactly the same — no FE change needed.

```
POST /api/auth/send-otp
{ "phone": "0591234567" }
```

The user will receive an actual SMS:
> "رمز التحقق الخاص بك في تطبيق LeftO هو: 847392 — صالح لمدة 10 دقائق."

The OTP flow UI is unchanged.

> **Note:** If Twilio is not yet configured on production, the OTP code appears in Railway logs as a fallback — the server does not crash. Real SMS delivery requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` to be set in Railway environment variables.

---

## 20. New Fields on Existing Responses

These fields appear on models you're already fetching. Make sure your FE handles them (don't assume they're always present — some are nullable).

### Every listing in `GET /api/listings` and `GET /api/listings/search`:
| Field | Type | Always present? | Notes |
|-------|------|----------------|-------|
| `currentPrice` | `number` | ✅ Yes | Use this as the displayed price — replaces `discountedPrice` in the UI |
| `isPriceDecaying` | `boolean` | ✅ Yes | If true, show the decay UI |
| `floorPrice` | `number \| null` | Only when decaying | Minimum price |

### Seller profile (`GET /api/sellers/:id`):
| Field | Type | Notes |
|-------|------|-------|
| `weeklyInsight` | `string \| null` | AI sentiment summary — show only when not null |
| `karamMealPrice` | `number \| null` | Price per Karam meal — show on Karam-enabled sellers |
| `participatesInKaram` | `boolean` | Whether this seller has Karam active |

### User profile:
| Field | Type | Notes |
|-------|------|-------|
| `isBlocked` | `boolean` | Block the UI if true |
| `cancellationCount` | `number` | Show in profile if you want ("cancelled X orders") |

---

## 21. Listing Report / Flag System

**What it is:** Buyers can flag a listing as problematic (wrong price, spoiled food, etc.). Admins see a queue and can dismiss or remove the listing.

---

### Buyer — Report a listing

```
POST /api/reports/listings/:listingId
Authorization: Bearer <buyerToken>

Body:
{
  "reason": "WRONG_PRICE",       // required — see enum below
  "details": "السعر الحقيقي أعلى بكثير"   // optional, max 500 chars
}
```

**Reason enum values:**
| Value | Arabic label to show |
|-------|----------------------|
| `SPOILED_FOOD` | طعام فاسد |
| `WRONG_DESCRIPTION` | وصف خاطئ |
| `WRONG_PRICE` | سعر خاطئ |
| `INAPPROPRIATE_CONTENT` | محتوى غير لائق |
| `OTHER` | سبب آخر |

**Success response (201):**
```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "reason": "WRONG_PRICE",
    "status": "PENDING",
    "createdAt": "2026-06-05T10:00:00.000Z"
  }
}
```

**Error responses:**
- `404` — listing not found
- `409` — buyer already reported this listing ("لقد أبلغت عن هذا العرض من قبل")
- `403` — only BUYER role can report

**What happens after:** Admin receives an in-app notification automatically.

**UI suggestion:**
- Add a 3-dot menu or flag icon on listing cards
- Show a bottom sheet with the 5 reason options (radio + optional text field)
- After success: show "شكراً، سيراجع فريقنا البلاغ" toast and disable the report button
- On 409: show "لقد أبلغت عن هذا العرض مسبقاً"

---

### Admin — View pending reports

```
GET /api/reports?status=PENDING&page=1&limit=20
Authorization: Bearer <adminToken>
```

Query params: `status` (PENDING | REVIEWED | DISMISSED — omit for all), `page`, `limit`

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "report-uuid",
        "reason": "WRONG_PRICE",
        "details": "السعر المذكور ضعف الحقيقي",
        "status": "PENDING",
        "createdAt": "2026-06-05T10:00:00.000Z",
        "listing": {
          "id": "listing-uuid",
          "title": "صينية كنافة نابلسية",
          "discountedPrice": 14,
          "seller": { "businessName": "حلويات الشيخ" }
        },
        "buyer": {
          "id": "buyer-uuid",
          "name": "أحمد",
          "phone": "0591234567"
        }
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### Admin — Dismiss or mark reviewed (no action on listing)

```
PATCH /api/reports/:reportId/review
Authorization: Bearer <adminToken>

Body:
{
  "status": "DISMISSED",         // or "REVIEWED"
  "adminNote": "لا يوجد مشكلة"  // optional
}
```

**Response:** Updated report with `status` and `adminNote`.

---

### Admin — Remove the reported listing (one-tap action)

```
DELETE /api/reports/:reportId/listing
Authorization: Bearer <adminToken>
```

This does two things at once:
1. Deletes (soft) the listing
2. Marks the report as REVIEWED

**What happens after:** Seller receives an in-app notification "تمت إزالة عرضك" automatically.

**Response:**
```json
{
  "success": true,
  "data": { "message": "Listing removed and report marked as reviewed" }
}
```

**UI suggestion for Admin:**
- In the report queue, show two buttons per row: "تجاهل" (DISMISSED) and "إزالة العرض" (DELETE)
- After delete: remove the row from the list and show success toast

---

## Key: What Tala Needs from Ghayda

1. **Stripe Publishable Key** (`pk_test_...`) — needed to initialize Stripe in the FE for Karam payment
2. **Firebase config** — for FCM push notification setup (if not already shared)

---

## Quick Reference — All New Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/stats/monthly-winner` | None | Monthly winner seller banner |
| `GET` | `/api/admin/stats/charts` | Admin | 6-month charts data |
| `GET` | `/api/admin/stats/best-rated` | Admin | Best seller + best charity |
| `GET` | `/api/admin/users?role=&isBlocked=&search=` | Admin | Smart filter users |
| `DELETE` | `/api/admin/users/:id` | Admin | Soft delete user |
| `DELETE` | `/api/admin/listings/:id` | Admin | Remove listing |
| `PATCH` | `/api/admin/users/:id/unblock` | Admin | Unblock buyer |
| `POST` | `/api/listings/ai/suggest-allergens` | Seller | AI allergen detection |
| `POST` | `/api/listings/ai/score-title` | Seller | AI title scoring |
| `GET` | `/api/listings/ai/price-suggestion?category=&originalPrice=` | Seller | AI price recommendation |
| `GET` | `/api/listings/ai/my-performance` | Seller | My AI performance score |
| `GET` | `/api/listings/ai/performance/:sellerId` | None | Public seller AI score |
| `POST` | `/api/listings/ai/analyze-image` | Seller | Gemini food image AI |
| `GET` | `/api/users/me/impact-certificate?month=YYYY-MM` | Any user | PDF certificate download |
| `GET` | `/api/sellers/karam` | None | Karam sellers list |
| `POST` | `/api/sellers/:id/karam/sponsor` | Buyer | Start Karam Stripe payment |
| `GET` | `/api/sellers/:id/karam` | None | Seller Karam balance |
| `PATCH` | `/api/sellers/me/karam` | Seller | Toggle Karam + set meal price |
| `POST` | `/api/sellers/me/karam/claim` | Seller | Claim one Karam meal |
| `POST` | `/api/payments/webhook` | Stripe (internal) | DO NOT call this — Stripe only |
| `POST` | `/api/reports/listings/:listingId` | Buyer | Flag a listing |
| `GET` | `/api/reports?status=PENDING` | Admin | View report queue |
| `PATCH` | `/api/reports/:reportId/review` | Admin | Mark report reviewed/dismissed |
| `DELETE` | `/api/reports/:reportId/listing` | Admin | Remove reported listing |

---

*LeftO Backend | Built for Nablus, Palestine 🇵🇸*
*Last updated: June 2026 — Sprint 5 + Dr. Haya features + Listing Report System complete*
