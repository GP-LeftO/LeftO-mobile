# LeftO — Tala's Task List
> All tasks for Tala (D2 — Mobile Frontend)
> Written for Claude — every task is self-contained with full context.
> Last updated: June 4, 2026

---

## ⚠️ Coordination Note with Ghayda

Ghayda is working in parallel on buyer-facing screens. You will **never edit the same file**.

**Files Ghayda owns — do not touch:**
- `src/screens/buyer/HomeScreen.tsx`
- `src/screens/buyer/StoreDetailsScreen.tsx`
- `src/components/buyer/ListingCard.tsx`
- `src/screens/buyer/support/ChatbotScreen.tsx`
- `src/screens/buyer/nearMe/NearMeScreen.tsx`
- `src/features/browse/BrowseScreen.tsx`
- `src/screens/buyer/ProfileScreen.tsx` (she's adding impact page wiring + order cancel)
- `src/screens/buyer/reserve/ImpactCelebrationScreen.tsx`
- `src/features/favorites/screens/FavoritesScreen.tsx`
- `src/components/buyer/profile/ReviewCard.tsx`
- Any new charity directory or impact detail screens she creates

**One coordination point:** Ghayda will create `src/context/AppConfigContext.tsx`. Once she does, you need to wrap it in `App.tsx` (see task T0-6-COORD below). She will tell you when it's ready.

**Files you own — Ghayda will not touch:**
- All seller screens and hooks
- All charity screens and hooks
- `src/screens/auth/*`
- `src/screens/buyer/reserve/CheckoutScreen.tsx`
- `src/screens/buyer/reserve/CharitySelectorScreen.tsx`
- `src/screens/buyer/reserve/DonationConfirmedScreen.tsx`
- `src/context/AuthContext.tsx`
- `src/navigation/BuyerTabNavigator.tsx`
- `App.tsx`

---

## Project Context

**What is LeftO?** A food rescue mobile app for Palestine. Connects buyers with surplus food from local Nablus stores at discounted prices, enables community giving through the Karam system, and routes food donations to verified charities.

**Stack:**
- React Native 0.83.6 + Expo 55 (Managed workflow)
- TypeScript 5.9
- Custom state-machine router in `App.tsx` — no React Navigation at the root
- Buyer home uses `BuyerTabNavigator.tsx` (5 bottom tabs)
- HTTP: Axios instance at `src/services/shared/api.ts` (auto-attaches Bearer token, auto-refreshes on 401)
- AsyncStorage for tokens, onboarding, language
- i18n: `src/i18n/index.ts` with Arabic (RTL) and English (LTR)
- Animations: React Native Reanimated 4.x

**Backend URL:** `https://lefto-backend-production.up.railway.app`

**MVVM pattern — always follow this:**
```
Screen (tsx)  → only renders UI, receives state + callbacks from hook
Hook  (ts)    → all state, API calls via service, business logic
Service (ts)  → raw axios call, returns typed data
```

**API response shape — all endpoints return this:**
```ts
// Success
{ success: true, data: { ... } }
// Error
{ success: false, message: "Human error", errors: ["..."] }
// Paginated
{ success: true, data: { items: [...], pagination: { page, limit, total, totalPages } } }
```
Access data as: `const res = await api.get('/api/...')` → `res.data.data`

**Auth:** Every protected call needs `Authorization: Bearer <accessToken>`. The `api` instance in `src/services/shared/api.ts` handles this automatically. Never pass tokens manually.

**RTL pattern — required on every screen:**
```ts
import { isRTL } from '../../i18n'; // adjust path

// In StyleSheet:
container: { flexDirection: isRTL() ? 'row-reverse' : 'row' }
text:      { textAlign: isRTL() ? 'right' : 'left' }
```

**Design tokens (`src/theme/index.ts`):**
```ts
colors: {
  primary:     '#DE985A',  // warm orange
  primaryLight:'#FFE8D6',
  green:       '#16A34A',
  greenLight:  '#D1FAE5',
  background:  '#FAFAF8',
  textDark:    '#404040',
  textMedium:  '#9CA3AF',
  white:       '#FFFFFF',
  error:       '#EF4444',
  warning:     '#F59E0B',
}
spacing: { xs:4, sm:8, md:16, lg:24, xl:32, xxl:48 }
// Font: Nunito (already loaded)
```

**Navigation — App.tsx state machine:**
```ts
// AppStep type — each screen is a string key
// Navigate forward:  push('step-name')
// Navigate back:     pop() / onBack()
// Screens receive:   onNext, onBack, params as props
```

**Important architecture decisions:**
- Buyer donation orders (`type: "DONATION"`) are **deprecated** — backend returns 410. All related UI must be removed.
- `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG` listing types are **removed** — backend rejects them. Do not show these in any picker.
- The community giving feature is now the **Karam system** — pay-it-forward meal pools at seller level.
- Charity registration is always **PENDING** after registration — no auto-approval.

**Demo credentials (use for testing):**
```
Admin:         0598262751 / Admin123!
Buyer (يوسف):  0591111111 / Buyer123!
Buyer (مريم):  0592222222 / Buyer123!
Seller (Karam أبو العبد): 0551234567 / Seller123!
Charity (إطعام نابلس):   0597777777 / Charity123!
Charity (رعاية الأسرة):  0597888888 / Charity123!
Seller PENDING (admin demo): 0556789012 / Seller123!
```

---

## Task List — Priority Order

---

### TASK 1 — Charity Dashboard (Full Rewrite) 🔴 ALREADY IN WORK

**What:** Replace the "Coming Soon" placeholder with a fully functional charity dashboard showing incoming donations, pickup flow, and proof upload.

**API calls:**
```
GET    /api/donations/me?page=1&limit=10    Auth: CHARITY
  Response: { donations: [...], pagination: { page, limit, total, totalPages } }
  Each donation: {
    id, status, quantity, pickupStart, pickupEnd,
    listing: { id, title, category, photoUrl },
    seller: { id, businessName, address, location: { latitude, longitude } },
    donor: { id, name } | null,
    proofPhoto: string | null,
    createdAt
  }

PATCH  /api/donations/:id/pickup           Auth: CHARITY
  No body needed
  Response: { donation: { id, status: "PICKED_UP", ... } }

PATCH  /api/donations/:id/confirm          Auth: CHARITY
  Body: { proofPhotoUrl?: string }
  Response: { donation: { id, status: "CONFIRMED", ... } }

POST   /api/documents/upload               Auth: any
  Body: FormData — field "file" (JPEG/PNG/PDF max 5MB) + field "documentType" = "PROOF_PHOTO"
  Response: { url: string }  ← use this URL as proofPhotoUrl

POST   /api/reviews/charity                Auth: CHARITY
  Body: { donationId: string, ratingOverall: 1-5, ratingPickup: 1-5, ratingQuality: 1-5, comment?: string }
  Response: { review: { id, ... } }
```

**Files to create:**
```
src/hooks/charity/useCharityDonations.ts
src/services/charity/charity.service.ts
src/components/charity/DonationIncomingCard.tsx
src/components/charity/ProofUploadModal.tsx
```

**Files to modify:**
```
src/screens/charity/CharityDashboardScreen.tsx  ← full rewrite
```

**Implementation:**

`charity.service.ts`:
```ts
import api from '../../services/shared/api';
export const getMyDonations = (page = 1, limit = 10) =>
  api.get('/api/donations/me', { params: { page, limit } });
export const markPickedUp = (donationId: string) =>
  api.patch(`/api/donations/${donationId}/pickup`);
export const confirmDonation = (donationId: string, proofPhotoUrl?: string) =>
  api.patch(`/api/donations/${donationId}/confirm`, { proofPhotoUrl });
export const uploadProof = (file: FormData) =>
  api.post('/api/documents/upload', file, { headers: { 'Content-Type': 'multipart/form-data' } });
export const rateSellerAfterDonation = (
  donationId: string, ratingOverall: number, ratingPickup: number,
  ratingQuality: number, comment?: string
) => api.post('/api/reviews/charity', { donationId, ratingOverall, ratingPickup, ratingQuality, comment });
```

`useCharityDonations.ts`:
```ts
// State: donations[], loading, error, refreshing, page
// Functions:
//   loadDonations(page) — fetch with pagination
//   markPickedUp(id) — call API, optimistically update status in list
//   confirmWithProof(id, file?) — upload photo if present, then confirm
//   rateSeller(donationId, ratings) — submit rating
//   refresh() — reload page 1
```

`CharityDashboardScreen.tsx` — Three tabs using a tab bar or segment control:

**Tab 1 — Incoming (PENDING)**
- List of `DonationIncomingCard` components
- Each card shows: seller business name, food item title, quantity, pickup window (formatted)
- CTA button: "تم الاستلام" → calls `markPickedUp(id)` → moves card to Tab 2
- Status badge: orange "قادم"

**Tab 2 — Picked Up (PICKED_UP)**
- Same cards but different CTA: "رفع إثبات التوزيع"
- Tap → opens `ProofUploadModal`
- Modal: optional photo picker (expo-image-picker) → "تأكيد التوزيع" button
- On confirm: upload photo if selected → get URL → call `confirmDonation(id, url)` → move to Tab 3

**Tab 3 — Completed (CONFIRMED)**
- History list, no CTA
- Show proof photo thumbnail if available
- Show "قيّم البائع" button if not yet rated → opens 3-star rating bottom sheet (ratingOverall, ratingPickup, ratingQuality + optional comment)
- Status badge: green "مكتمل"

**Impact counter at top of screen:**
- Count completed donations (from confirmed list length or from a counter)
- Show: "استلمتم X وجبة" with green accent

**RTL:** All text right-aligned, flex-direction row-reverse on card rows.

**Done when:** Charity can see incoming donations, mark them picked up, upload a photo, confirm distribution, and rate the seller. All three tabs work. Pull-to-refresh works. Empty states shown when each tab is empty.

---

### TASK 2 — Seller Listing Create + Edit + Delete 🔴 ALREADY IN WORK

**What:** Wire the listing creation and editing forms so sellers can actually post food.

**API calls:**
```
POST  /api/listings                    Auth: SELLER
Body:
{
  "type": "MEAL_BAG" | "SPECIFIC_PARCEL",
  "title": "string (2-100 chars, required)",
  "description": "string (optional)",
  "category": "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED",
  "quantity": number (int, min 1),
  "originalPrice": number (min 1),
  "discountedPrice": number (min 0.5, must be < originalPrice),
  "pickupStart": "ISO 8601 string",
  "pickupEnd": "ISO 8601 string (must be after pickupStart)",
  "expiryDate": "ISO 8601 string" ← REQUIRED for SPECIFIC_PARCEL, optional for MEAL_BAG
  "freshnessBadge": "eat_today" | "fresh_tonight" | "good_1_2_days",
  "photoUrl": "string (optional)",
  "allergenNote": "string (optional)",
  "estimatedWeightG": number (optional),
  "repeatDaily": false
}
Response: { listing: { id, qrCodeUrl, ... } }  ← qrCodeUrl is auto-generated!

PUT   /api/listings/:id                Auth: SELLER
Body: same shape as POST (all fields optional for edit)
Response: { listing: { ... } }

DELETE /api/listings/:id               Auth: SELLER
Response: { success: true }
```

**Files to create:**
```
src/screens/seller/listings/CreateListingScreen.tsx
src/screens/seller/listings/EditListingScreen.tsx
src/hooks/seller/useListingForm.ts
src/services/seller/listing.service.ts
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← add FAB "+" button + edit/delete per card
App.tsx  ← add "seller-create-listing" and "seller-edit-listing" to AppStep type + routing
```

**Form fields:**

| Field | Input Type | Validation |
|-------|-----------|------------|
| type | Picker (2 options) | required |
| title | TextInput | required, 2–100 chars |
| category | Picker (4 options) | required |
| quantity | NumberInput | required, min 1 |
| originalPrice | NumberInput (NIS) | required, min 1 |
| discountedPrice | NumberInput (NIS) | required, must be < originalPrice, min 0.5 |
| pickupStart | DateTimePicker | required |
| pickupEnd | DateTimePicker | required, must be after pickupStart |
| expiryDate | DateTimePicker | **required only if type = SPECIFIC_PARCEL**, label: "تاريخ انتهاء الصلاحية (المطبوع على العبوة)" |
| freshnessBadge | Picker (3 options) | required |
| allergenNote | TextInput multiline | optional |
| photoUrl | Image URL input or ImagePicker | optional |
| description | TextInput multiline | optional |

**Do NOT show:** `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG` in the type picker — they are removed from backend.

**SellerDashboardScreen modifications:**
- Add "+" FAB button (bottom-right, orange circle) → navigates to `"seller-create-listing"`
- On each listing card: add "تعديل" button → navigate to `"seller-edit-listing"` with listing data as param
- On each listing card: add "حذف" button → show `Alert.alert` confirmation → call DELETE → remove from list
- After create/edit success: refresh listings list + show success toast

**qrCodeUrl:** After a listing is created, the response includes `qrCodeUrl` (base64 PNG). Store this. Display it as a full-screen `<Image>` when seller taps "عرض رمز QR" on a listing card.

**App.tsx additions:**
```ts
// Add to AppStep type:
| "seller-create-listing"
| "seller-edit-listing"
// Add routing cases in the switch statement
// seller-create-listing: renders <CreateListingScreen onBack={() => pop()} onSuccess={() => { pop(); setRefreshSeller(true); }} />
// seller-edit-listing: renders <EditListingScreen listing={params.listing} onBack={() => pop()} onSuccess={() => { pop(); setRefreshSeller(true); }} />
```

**RTL:** All form labels right-aligned, inputs with RTL text direction. Picker items in Arabic.

**Done when:** Seller can create a new MEAL_BAG and a new SPECIFIC_PARCEL listing. Can edit existing listings. Can delete a listing with a confirmation dialog. QR code is shown on the listing card after creation.

---

### TASK 3 — Karam Seller UI 🔴 NEW TASK

**What:** Sellers can opt into the Karam (كرم) pay-it-forward program, sponsor meals, and mark walk-in recipients claiming them.

**What is Karam:** A Palestinian pay-it-forward concept. A restaurant opts in, then "sponsors" meals (prepays for X meals that any walk-in customer who needs it can claim face-to-face, no app needed). Buyers can also remotely sponsor meals via the store detail page.

**API calls:**
```
PATCH  /api/sellers/me/karam           Auth: SELLER
Body: { participatesInKaram: boolean }
Response: { seller: { ..., participatesInKaram: boolean } }

POST   /api/sellers/me/karam/sponsor   Auth: SELLER
(No body — sponsors 1 meal from the seller's own account)
Response: { sponsored: 7, claimed: 4, available: 3 }

POST   /api/sellers/me/karam/claim     Auth: SELLER
(No body — marks 1 meal as claimed by a walk-in)
Response: { sponsored: 7, claimed: 5, available: 2 }
Errors:
  400 "No sponsored meals available to claim today" → show this message

GET    /api/sellers/:id/karam          Public
Response: { sponsored: 7, claimed: 4, available: 3 }
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← add Karam dashboard card + claim button
```
The seller settings tab (Task 2's settings form — Task 5 below) must include the Karam toggle. Coordinate this with Task 5.

**Dashboard home tab — add a Karam card:**
```
┌─────────────────────────────────────┐
│  كرم  🤝                            │
│  اليوم: 7 ممولة  |  4 مُستلمة  |  3 متاحة │
│  [مول وجبة]    [وجبة مستلمة]       │
└─────────────────────────────────────┘
```
- Card uses green accent (`#16A34A`) with green-light background
- "مول وجبة" button → call `POST /api/sellers/me/karam/sponsor` → refresh counts
- "وجبة مُستلمة" button → call `POST /api/sellers/me/karam/claim` → refresh counts; on error 400 show toast "لا توجد وجبات متاحة اليوم"
- Only show this card when `seller.participatesInKaram === true`

**Karam toggle in settings tab** (add to Task 5):
- Switch/Toggle labeled "أشارك في برنامج كرم"
- On toggle ON → call `PATCH /api/sellers/me/karam { participatesInKaram: true }`
- On toggle OFF → call `PATCH /api/sellers/me/karam { participatesInKaram: false }`
- Show brief explanation below toggle: "يتيح للمشترين تمويل وجبات لمن يحتاج، ويمكن لأي شخص الحصول عليها مجاناً"

**RTL:** Card layout reversed, Arabic labels.

**Done when:** Seller can toggle Karam participation in settings, see today's balance on dashboard, sponsor a meal, and mark a walk-in claim.

---

### TASK 4 — Notifications Screen + FCM 🔴 ALREADY IN WORK

**What:** Full notifications screen with unread badge, push notification setup via FCM.

**API calls:**
```
GET    /api/notifications/me?page=1&limit=20   Auth: Bearer
Response:
{
  notifications: [{
    id, type, title, body, isRead, createdAt
  }],
  unreadCount: number,
  pagination: { page, limit, total, totalPages }
}

PATCH  /api/notifications/me/read-all          Auth: Bearer
Response: { success: true }

PUT    /api/auth/fcm-token                     Auth: Bearer
Body: { fcmToken: string | null }
Response: { success: true }
```

**Notification types and icons:**
| Type | Icon (Feather) | Color |
|------|---------------|-------|
| `ORDER_RESERVED` | `shopping-bag` | orange `#DE985A` |
| `ORDER_CANCELLED` | `x-circle` | red `#EF4444` |
| `ORDER_RECEIVED` | `check-circle` | green `#16A34A` |
| `DONATION_INCOMING` | `heart` | green `#16A34A` |
| `DONATION_CONFIRMED` | `check-square` | green `#16A34A` |
| `NEW_REVIEW` | `star` | orange `#DE985A` |
| `SELLER_APPROVED` | `check-circle` | green `#16A34A` |
| `SELLER_REJECTED` | `alert-circle` | red `#EF4444` |
| `CHARITY_UNDER_REVIEW` | `clock` | orange `#DE985A` |
| `CHARITY_APPROVED` | `check-circle` | green `#16A34A` |
| `CHARITY_REJECTED` | `alert-circle` | red `#EF4444` |

**Files to create:**
```
src/screens/buyer/NotificationsScreen.tsx
src/hooks/buyer/useNotifications.ts
src/services/buyer/notifications.service.ts
```

**Files to modify:**
```
src/context/AuthContext.tsx  ← add FCM token registration on login + null on logout
src/navigation/BuyerTabNavigator.tsx  ← add bell icon to header with unread badge
App.tsx  ← add "notifications" step
```

**AuthContext changes:**
```ts
// After successful login, in the login function:
import * as Notifications from 'expo-notifications'; // or firebase
const token = await Notifications.getExpoPushTokenAsync();
await api.put('/api/auth/fcm-token', { fcmToken: token.data });

// In logout():
await api.put('/api/auth/fcm-token', { fcmToken: null });
```

**BuyerTabNavigator header:**
- Add a bell icon (Feather `bell`) to the header right side
- Show a red dot with `unreadCount` number when `unreadCount > 0`
- Tap → navigate to notifications screen

**NotificationsScreen layout:**
- "الإشعارات" header + "تحديد الكل كمقروء" button (top right)
- FlatList of notification cards:
  - Unread: slightly highlighted background (orangeLight `#FFE8D6`)
  - Each card: icon (colored per type), title (bold), body, relative time ("منذ 3 دقائق")
  - Tap card → mark as read + navigate to relevant screen if applicable
- Load more on scroll end (pagination)
- Empty state: "لا توجد إشعارات بعد"

**⚠️ FCM endpoint update (Sprint 5):** The backend guide now says to use `POST /api/notifications/device-token`. Check with the backend team whether this replaced `PUT /api/auth/fcm-token` or runs in parallel. Use whichever they confirm is active.

**New notification types to add to the icon/label map (Sprint 5 AI features):**
| Type | Icon | Color | Arabic label |
|------|------|-------|--------------|
| `NEW_LISTING_FAVORITE_SELLER` | `bell` | orange | محلك المفضل أضاف عرضاً جديداً |
| `LISTING_EXPIRY_ALERT` | `clock` | orange | عرض ينتهي قريباً |
| `PREDICTIVE_WASTE_ALERT` | `alert-triangle` | red | تحذير من هدر الطعام |
| `LISTING_REMOVED_BY_ADMIN` | `trash-2` | red | تمت إزالة عرضك |

**Push notification tap → deep link (REQUIRED):** When the user taps a push notification from outside the app, the app must navigate to the correct screen. Handle this in `App.tsx` or a notification listener in `AuthContext`:

```ts
import * as Notifications from 'expo-notifications';

// In AuthContext or App.tsx useEffect:
Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  // data.type is the notification type, data.listingId / data.orderId / data.sellerId

  switch (data.type) {
    case 'ORDER_RESERVED':
    case 'ORDER_CANCELLED':
    case 'ORDER_RECEIVED':
      navigate('buyer-orders'); // existing orders screen
      break;
    case 'NEW_LISTING_FAVORITE_SELLER':
    case 'LISTING_EXPIRY_ALERT':
      if (data.listingId) navigate('store-details', { listingId: data.listingId });
      break;
    case 'PREDICTIVE_WASTE_ALERT':
    case 'NEW_REVIEW':
    case 'LISTING_REMOVED_BY_ADMIN':
      navigate('seller-dashboard'); // seller sees their dashboard
      break;
    case 'DONATION_INCOMING':
    case 'DONATION_CONFIRMED':
      navigate('charity-dashboard');
      break;
    case 'SELLER_APPROVED':
    case 'SELLER_REJECTED':
      navigate('seller-dashboard');
      break;
    case 'CHARITY_APPROVED':
    case 'CHARITY_REJECTED':
    case 'CHARITY_UNDER_REVIEW':
      navigate('charity-dashboard');
      break;
  }
});
```

**Done when:** Notifications screen shows real notifications including new AI-triggered types. Unread badge appears in tab bar. FCM token is saved on login and cleared on logout. **Tapping any push notification from the lock screen or notification drawer navigates to the correct in-app screen.**

---

### TASK 5 — Seller Settings Form 🟡 ALREADY IN WORK

**What:** Replace the "Coming Soon" settings tab with a real form for updating seller profile.

**API calls:**
```
GET    /api/sellers/me                 Auth: SELLER
  (already called for dashboard — reuse the data)

PATCH  /api/sellers/me                 Auth: SELLER
Body:
{
  businessName?: string,
  description?: string,
  businessType?: "RESTAURANT" | "BAKERY" | "MARKET" | "GROCERY",
  contactInfo?: {
    phone?: string,
    website?: string,
    socialMedia?: string
  },
  location?: {
    address: string,
    latitude: number,
    longitude: number
  },
  operatingHours?: string  ← free text, e.g. "9 ص – 10 م يومياً"
}
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← replace Coming Soon settings tab
```

**Settings form fields:**
| Field | Input | Notes |
|-------|-------|-------|
| اسم المحل | TextInput | business name |
| وصف المحل | TextInput multiline | description |
| نوع المحل | Picker | RESTAURANT/BAKERY/MARKET/GROCERY |
| رقم الهاتف | TextInput | contact phone |
| الموقع الإلكتروني | TextInput | website |
| السوشيال ميديا | TextInput | social media link |
| العنوان | TextInput | location address |
| ساعات العمل | TextInput | free text, e.g. "9 ص – 10 م" |
| أشارك في برنامج كرم | Switch | `participatesInKaram` — calls `PATCH /api/sellers/me/karam` |

- "حفظ التغييرات" button → calls `PATCH /api/sellers/me` → success toast
- Pre-populate all fields from `seller` data on mount
- Show loading indicator while saving
- Validate: businessName required, 2–100 chars

**RTL:** All labels right-aligned, inputs use RTL text direction.

**Done when:** Seller can update all profile fields. Karam toggle saves correctly. Changes persist after returning to the app.

---

### TASK 6 — Seller Orders Tab 🟡 ALREADY IN WORK

**What:** Add a tab to the seller dashboard showing incoming reservations.

**API calls:**
```
GET    /api/sellers/me/orders?page=1&limit=10   Auth: SELLER
Response:
{
  orders: [{
    id, quantity, totalPrice, status, createdAt, expiresAt,
    listing: { id, title, type, pickupStart, pickupEnd },
    buyer: { id, name } | null  ← null if anonymous
  }],
  pagination: { page, limit, total, totalPages }
}
```

**Files to create:**
```
src/hooks/seller/useSellerOrders.ts
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← add Orders tab
```

**Orders tab layout:**
- Segmented or tab header: "نشطة" (RESERVED) / "مكتملة" (COMPLETED) / "ملغاة" (CANCELLED)
- Each order card shows:
  - Listing title
  - Buyer name (or "مجهول الهوية" if null)
  - Quantity + total price
  - Pickup window: pickupStart → pickupEnd
  - Status badge (color-coded)
  - Expiry time if RESERVED: "ينتهي في X دقيقة"
- Pull-to-refresh
- Load more on scroll (pagination)
- Empty state per tab: "لا توجد طلبات" with icon

**Status badge colors:**
- `RESERVED` → orange
- `COMPLETED` → green
- `CANCELLED` → gray

**Done when:** Seller can see all reservations in real time, filtered by status. Pull-to-refresh works.

---

### TASK 7 — Seller Donation Flow 🟡 ALREADY IN WORK

**What:** Sellers can donate surplus food directly to a verified charity.

**API calls:**
```
GET    /api/charities                  Public (no auth needed)
Response: [{ id, orgName, description, region, verifiedBadge, trustScore }]

POST   /api/donations                  Auth: SELLER
Body:
{
  listingId: string,
  charityId: string,
  quantity: number,
  pickupStart: string (ISO),
  pickupEnd: string (ISO),
  purposeNote?: string
}
Response: { donation: { id, status: "PENDING", ... } }

GET    /api/donations/me?page=1&limit=10   Auth: SELLER
Response: { donations: [...], pagination: {...} }
Each donation: { id, status, quantity, pickupStart, pickupEnd, listing, charity, createdAt }
```

**Files to create:**
```
src/screens/seller/donations/SellerDonateSurplusScreen.tsx
src/screens/seller/donations/SellerDonationsHistoryScreen.tsx
src/hooks/seller/useSellerDonations.ts
src/services/seller/donation.service.ts
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← add "تبرع بالفائض" button per listing card + Donations history tab
src/screens/buyer/reserve/CharitySelectorScreen.tsx  ← repurpose for seller use (see below)
App.tsx  ← add "seller-donate-surplus" step
```

**CharitySelectorScreen repurposing:**
This screen currently exists for buyer donation (deprecated). Repurpose it to be role-agnostic:
- Accept a prop `onSelectCharity(charity)` callback
- List charities with trust score badge (show `trustScore` from API if available)
- Works for both seller donation selection and any future use
- Remove any "buyer donation" specific wording

**Donation flow steps:**
1. Seller taps "تبرع بالفائض" on a listing card
2. Navigate to `SellerDonateSurplusScreen`:
   - Listing info (title, quantity available) shown at top (read-only)
   - Quantity input (number, 1 to listing.quantity)
   - Pickup window time pickers (start + end — today only)
   - "اختر جمعية" button → opens repurposed `CharitySelectorScreen` as modal
   - "ملاحظة (اختياري)" free text field
   - "تأكيد التبرع" button → `POST /api/donations`
3. On success → success toast "تم إرسال التبرع للجمعية" → back to dashboard

**Donations History tab** (in seller dashboard):
- Tab showing past donations with statuses: PENDING / PICKED_UP / CONFIRMED
- Each card: charity name, food item, quantity, status badge, date
- Pull-to-refresh

**Done when:** Seller can donate a listing to a charity, select the charity from a list (with trust scores shown), set pickup window, and see donation history.

---

### TASK 8 — Checkout Donate Path Removal 🔴 NEW TASK

**What:** Remove the deprecated buyer donation flow from checkout. The backend returns 410 if `type: "DONATION"` is sent. This must not be reachable from the UI.

**Files to modify:**
```
src/screens/buyer/reserve/CheckoutScreen.tsx  ← remove Donate option
App.tsx  ← remove "charity-selector" and "donation-confirmed" from buyer checkout path
```

**What to do in CheckoutScreen:**
- Remove any "Donate" button or toggle that was part of the checkout flow
- Remove any reference to `CharitySelectorScreen` from the buyer checkout navigation
- Keep only the purchase path: "احجز الآن" → `POST /api/orders { listingId, quantity, type: "PURCHASE" }` → order-confirmed
- The checkout screen should be clean: store summary, pickup time, quantity selector, cash on pickup notice, reserve button

**What to do in App.tsx:**
- Remove `"charity-selector"` step from the buyer checkout navigation path
- Remove `"donation-confirmed"` step from the buyer checkout navigation path
- Keep `"order-confirmed"` and `"impact-celebration"` steps (these are still used for purchase completion)

Note: `CharitySelectorScreen` itself is NOT deleted — it is repurposed for seller donation flow (Task 7). Just remove it from the buyer checkout navigation path.

Note: `DonationConfirmedScreen` can be kept or hidden — it's no longer reachable. Do NOT delete it to avoid breaking imports; just make it unreachable by removing the navigation step.

**Done when:** Buyer checkout only shows the purchase flow. No donate option visible. No broken navigation.

---

### TASK 9 — Forgot / Reset Password Screens 🟡 ALREADY IN WORK

**What:** Add forgot password and reset password screens so users aren't permanently blocked when they forget their password.

**API calls:**
```
POST   /api/auth/forgot-password       Public
Body: { phone: string }
Response: { success: true, message: "OTP sent" }
Errors: 404 "User not found"

POST   /api/auth/reset-password        Public
Body: { phone: string, code: string, newPassword: string }
Response: { success: true, message: "Password reset successfully" }
Errors: 400 "Invalid or expired OTP"
        400 "New password must be at least 8 characters"
```

**Files to create:**
```
src/screens/auth/ForgotPasswordScreen.tsx
src/screens/auth/ResetPasswordScreen.tsx
```

**Files to modify:**
```
src/screens/auth/SignInScreen.tsx  ← add "نسيت كلمة المرور؟" link
src/services/auth/auth.service.ts ← add forgotPassword() and resetPassword()
App.tsx  ← add "forgot-password" and "reset-password" to AppStep + routing
```

**ForgotPasswordScreen:**
- Phone number input (same style as `PhoneEntryScreen`)
- "إرسال رمز التحقق" button
- On success → navigate to `"reset-password"` passing `{ phone }` as param
- On 404 → show "لم يتم العثور على هذا الرقم"

**ResetPasswordScreen:**
- Header: "إعادة تعيين كلمة المرور"
- OTP input (6 digits, same style as `OTPVerificationScreen`)
- New password input (with show/hide toggle eye icon)
- Confirm password input (must match)
- "إعادة تعيين" button → `POST /api/auth/reset-password { phone, code, newPassword }`
- On success → navigate to `"sign-in"` + show success toast "تم تغيير كلمة المرور بنجاح"
- On 400 (invalid OTP) → "رمز التحقق غير صحيح أو منتهي الصلاحية"

**SignInScreen link:** Add a small "نسيت كلمة المرور؟" text link below the password input → navigates to `"forgot-password"`.

**App.tsx:**
```ts
// Add to AppStep type:
| "forgot-password"
| "reset-password"
// Add in routing:
case "forgot-password": return <ForgotPasswordScreen onBack={pop} onSuccess={(phone) => push("reset-password", { phone })} />;
case "reset-password": return <ResetPasswordScreen phone={params.phone} onBack={pop} onSuccess={() => push("sign-in")} />;
```

**Done when:** User can tap "نسيت كلمة المرور؟" in sign-in, enter their phone, receive OTP (will be SMS once OTP is integrated), enter OTP + new password, and log in with the new password.

---

### TASK 10 — App.tsx: Add AppConfigProvider (Coordination with Ghayda) 🔴

**What:** Ghayda is creating `src/context/AppConfigContext.tsx`. Once she creates it, you need to wrap it in App.tsx so all screens can access `isRamadanSeason`, `isIftarWindow`, and `maghribTime`.

**What Ghayda creates:**
```ts
// src/context/AppConfigContext.tsx
export const AppConfigContext = createContext<AppConfig | null>(null);
export const AppConfigProvider = ({ children }) => { ... };
export const useAppConfig = () => useContext(AppConfigContext);
```

**What you do in App.tsx:**
```tsx
import { AppConfigProvider } from './src/context/AppConfigContext';

// Wrap the root navigator:
return (
  <AppConfigProvider>
    <AuthProvider>
      {/* ... rest of app */}
    </AuthProvider>
  </AppConfigProvider>
);
```

**Coordination:** Ask Ghayda when `AppConfigContext.tsx` is ready, then add these 2 lines. This is the only file coordination between you two.

---

### TASK 11 — Seller Switch-to-Buyer Mode 🟢 NEW TASK

**What:** Sellers can switch to buyer mode to browse and reserve food like a regular buyer, without logging out.

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx  ← add "تصفح كمشتري" button in settings tab
src/context/AuthContext.tsx  ← add local role override state
App.tsx  ← route role-overridden sellers to buyer-home
```

**Implementation:**

In `AuthContext.tsx`, add a `viewMode: 'seller' | 'buyer'` state:
```ts
const [viewMode, setViewMode] = useState<'seller' | 'buyer'>('seller');
const switchToBuyerMode = () => setViewMode('buyer');
const switchToSellerMode = () => setViewMode('seller');
```

In seller settings tab: add a prominent button "تصفح كمشتري 🛍️" → calls `switchToBuyerMode()` → App.tsx routes seller to `"buyer-home"` tab navigator.

In the buyer tab bar (bottom of `BuyerTabNavigator`): when user is a SELLER in buyer mode, show a floating banner at top: "أنت في وضع المشتري" with a "رجوع لمحلي" button → calls `switchToSellerMode()` → App.tsx routes back to `"seller-dashboard"`.

The seller's actual role (`SELLER`) remains in AuthContext. Only the `viewMode` switches. This means all buyer API calls work normally.

**Done when:** Seller can tap "تصفح كمشتري" → see buyer home → browse listings → switch back.

---

## Summary Table

| Task | Priority | Status | Est. |
|------|----------|--------|------|
| T1: Charity Dashboard | 🔴 CRITICAL | Already in work | 3–4h |
| T2: Seller Listing CRUD | 🔴 CRITICAL | Already in work | 2–3h |
| T3: Karam Seller UI | 🔴 CRITICAL | New | 1.5h |
| T4: Notifications + FCM | 🔴 CRITICAL | Already in work | 2–3h |
| T5: Seller Settings Form | 🟡 HIGH | Already in work | 1.5h |
| T6: Seller Orders Tab | 🟡 HIGH | Already in work | 1h |
| T7: Seller Donation Flow | 🟡 HIGH | Already in work | 1.5h |
| T8: Checkout Cleanup | 🔴 CRITICAL | New | 0.5h |
| T9: Forgot/Reset Password | 🟡 HIGH | Already in work | 1h |
| T10: AppConfigProvider in App.tsx | 🔴 CRITICAL | Coordination | 0.1h |
| T11: Seller Switch-to-Buyer | 🟢 MEDIUM | New | 1h |
| **Total** | | | **~17h** |

---

---

## Sprint 5 — New Backend Features (Added June 5, 2026)

> The backend team added major new features. All tasks below are NEW — they do not overlap with the original 11 tasks above. Same conflict rules apply.

---

### NEW-T1 — AI-Assisted Create Listing (4 AI Features) 🔴 NEW

**What:** Four AI helpers are available inside the Create/Edit Listing screen. All four call backend endpoints — no local AI needed. Integrate them into `CreateListingScreen.tsx`.

---

**A — Food Image Recognition (do this first — it's the entry point)**

```
POST  /api/listings/ai/analyze-image   Auth: SELLER
Content-Type: multipart/form-data
Field: "photo" (JPEG or PNG, max 5MB)
Response:
{
  suggestedCategory: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED",
  suggestedTitle: "وجبة مشاوي مشكلة مع الخبز والسلطة",
  suggestedAllergens: ["gluten"],
  description: "طبق مشاوي متنوع يشمل شيش طاووق...",
  confidence: 0.91   // 0–1
}
```

**Make the photo picker the FIRST step of the form, not optional at the end:**
1. Show photo picker at the top of the form
2. After user picks a photo → show a button: "✨ تحليل الصورة وملء التفاصيل تلقائياً"
3. On tap → upload photo → show spinner (~2–3s) → pre-fill: `category`, `title`, `description`, `allergenNote` fields
4. Show a blue info banner: "تم تعبئة التفاصيل بواسطة الذكاء الاصطناعي — يمكنك التعديل قبل النشر ✏️"
5. If `confidence < 0.5` → show yellow warning: "الصورة غير واضحة — يرجى مراجعة التفاصيل بعناية"
6. All pre-filled values are editable — the seller has final say

For upload: use `FormData` with `expo-image-picker`:
```ts
const formData = new FormData();
formData.append('photo', { uri: imageUri, name: 'food.jpg', type: 'image/jpeg' } as any);
const res = await api.post('/api/listings/ai/analyze-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
const data = res.data.data;
```

---

**B — Title Scorer**

```
POST  /api/listings/ai/score-title   Auth: SELLER
Body: { title: string, category: string }
Response: { score: 22, feedback: "العنوان قصير جداً..." }
```

**Wire this to the title input's `onBlur` event (not on every keystroke):**
- After seller finishes typing the title → call the endpoint
- Show a progress bar below the title field:
```
تقييم العنوان:  ████████████░░░░   78/100   ممتاز
💡 أضف وزن أو عدد الحصص لزيادة الجاذبية
```
- Color: `score < 40` → red "ضعيف" | `score 41–69` → orange "مقبول" | `score ≥ 70` → green "ممتاز"
- `feedback` string: show below the bar in gray text
- If call is loading → show a skeleton bar
- Hide the bar until the first blur event

---

**C — Price Suggestion**

```
GET   /api/listings/ai/price-suggestion?category=MEALS&originalPrice=30   Auth: SELLER
Response: { suggestedDiscountedPrice: 18, discountPercent: 40, reasoning: "الوجبات في هذه الفئة..." }
```

**Call this when seller fills in both `category` and `originalPrice`:**
- Show a hint chip next to the discounted price field:
```
[ السعر الأصلي: 30 ₪ ]   [ السعر بعد الخصم: _____ ₪ ]
                           💡 الأنسب: 18 ₪ (خصم 40%)  ← tap to apply
```
- Tapping the chip pre-fills `discountedPrice` field with `suggestedDiscountedPrice`
- Seller can still override and type any price
- Show `reasoning` text below as a small gray note
- Re-call if seller changes category or original price

---

**D — Allergen Detection**

```
POST  /api/listings/ai/suggest-allergens   Auth: SELLER
Body: { title: string, description: string }
Response: { allergens: ["gluten", "dairy", "nuts"], arabicLabel: "جلوتين، منتجات الألبان، مكسرات" }
```

**Show a button near the `allergenNote` field:**
```
[ 🧪 اكتشاف المواد المسببة للحساسية تلقائياً ]
```
- On tap → call endpoint with current title + description → pre-fill `allergenNote` with `arabicLabel`
- Only available when title field is not empty
- Seller can still edit the allergenNote after auto-fill

**Files to modify:**
```
src/screens/seller/listings/CreateListingScreen.tsx  ← add all 4 AI helpers
src/screens/seller/listings/EditListingScreen.tsx    ← add allergen detection only (not image analysis)
src/hooks/seller/useListingForm.ts                   ← add AI call functions
src/services/seller/listing.service.ts               ← add AI service calls
```

**Done when:** Image analysis auto-fills the form. Title scorer appears after typing. Price suggestion chip appears. Allergen button detects allergens from title+description.

---

### NEW-T2 — AI Seller Performance Dashboard Card 🟡 NEW

**What:** Add a seller performance card to the seller dashboard using two AI endpoints: the personal performance score and the weekly sentiment insight.

**API:**
```
GET  /api/listings/ai/my-performance   Auth: SELLER
Response:
{
  sellerId: string,
  performanceScore: 84,         // 0–100
  breakdown: {
    sellThroughRate: 0.87,      // percentage
    avgRating: 4.7,
    weeklyListingCount: 12,
    isVerified: true
  },
  weeklyInsight: "💪 أقوى نقطة: سرعة الاستجابة | ⚠️ أكثر شكوى: التأخر في الاستلام"
  // weeklyInsight is null if seller has fewer than 5 reviews
}
```

**Files to modify:**
```
src/screens/seller/SellerDashboardScreen.tsx   ← add performance card to overview tab
src/hooks/seller/useSellerAnalytics.ts          ← add fetchMyPerformance()
src/services/seller/analytics.service.ts        ← add getMyPerformance()
```

**Performance card layout (add to Overview tab of SellerDashboardScreen):**
```
┌─────────────────────────────────────────┐
│  أداء محلك                    84/100     │
│  ████████████████░░░░  (progress bar)   │
│                                         │
│  ✅ معدل المبيع: 87%                    │
│  ⭐ التقييم: 4.7                        │
│  📋 إدراجات هذا الأسبوع: 12            │
│  🏅 بائع موثق                           │
└─────────────────────────────────────────┘
```

Progress bar color:
- `score ≥ 70` → green `#16A34A`
- `score 40–69` → orange `#DE985A`
- `score < 40` → red `#EF4444`

**Weekly Sentiment card (separate card, show only when `weeklyInsight !== null`):**
```
┌─────────────────────────────────────────┐
│  ملخص آراء العملاء هذا الأسبوع           │
│  💪 سرعة الاستجابة     ← green row      │
│  ⚠️ التأخر في الاستلام  ← orange row    │
└─────────────────────────────────────────┘
```

Parse `weeklyInsight` by splitting on `|`:
```ts
const parts = weeklyInsight.split('|').map(s => s.trim());
// parts[0] = "💪 أقوى نقطة: سرعة الاستجابة"
// parts[1] = "⚠️ أكثر شكوى: التأخر في الاستلام"
```
- Row starting with 💪 → green background `#D1FAE5`
- Row starting with ⚠️ → orange background `#FFE8D6`

Load on dashboard mount. Add to existing analytics fetch or separate hook call.

**Done when:** Seller dashboard shows the performance score card and (if available) the sentiment insight card. Score updates if seller refreshes.

---

### NEW-T3 — Dynamic Pricing in Create Listing Form 🟡 NEW

**What:** Sellers can optionally enable automatic price decay on a listing. The price drops from `discountedPrice` down to a `floorPrice` linearly over time until expiry.

**New form fields to add to `CreateListingScreen.tsx` and `EditListingScreen.tsx`:**

| Field | Input | Condition |
|-------|-------|-----------|
| `isPriceDecaying` | Toggle/Switch | Always visible |
| `floorPrice` | NumberInput (NIS) | Show only when `isPriceDecaying === true` |
| `expiryDate` | DateTimePicker | Required when `isPriceDecaying === true`, already optional for SPECIFIC_PARCEL |

**UX for the toggle:**
```
┌──────────────────────────────────────────────────┐
│  تسعير متناقص تلقائياً  🔥    [OFF → ON toggle]   │
│  السعر ينخفض تدريجياً حتى وقت الانتهاء            │
│                                                  │
│  (when ON, show these two fields below:)         │
│  السعر الأدنى (₪):  [_____]                      │
│  ينتهي في: [DateTimePicker]                      │
└──────────────────────────────────────────────────┘
```

**Validation rules:**
- `floorPrice` must be < `discountedPrice`
- `floorPrice` must be ≥ 0.5
- If `isPriceDecaying: true` and `expiryDate` is not set → block form submission with error: "حدد وقت انتهاء السعر المتناقص"

**POST /api/listings body addition:**
```json
{
  "isPriceDecaying": true,
  "floorPrice": 5,
  "expiryDate": "2026-06-06T18:00:00Z"
  // ... all existing fields
}
```

**Done when:** Toggle appears in the create form. Enabling it reveals floorPrice + expiryDate fields. Validation prevents invalid combinations. Listing creates correctly with decay fields.

---

### NEW-T4 — Karam Seller UI: Add Meal Price Field 🔴 UPDATE (modifies Task 3)

**What:** The Karam settings toggle now requires a `karamMealPrice` field when enabling. Update the Karam toggle in seller settings to include this.

**Updated API:**
```
PATCH  /api/sellers/me/karam   Auth: SELLER
Body (enabling):  { participatesInKaram: true, karamMealPrice: 15 }
Body (disabling): { participatesInKaram: false }
```

**Update the Karam toggle section in seller settings (Task 3 / Task 5):**
```
┌─────────────────────────────────────────────┐
│  أشارك في برنامج كرم          [Toggle ON]   │
│                                             │
│  (when ON, show this field:)                │
│  سعر الوجبة المُموَّلة (₪):  [____]          │
│  المبلغ الذي يدفعه المشتري لتمويل وجبة      │
└─────────────────────────────────────────────┘
```

- Price input: required when toggling ON, must be ≥ 1 NIS
- On save: call `PATCH /api/sellers/me/karam { participatesInKaram: true, karamMealPrice: enteredPrice }`
- On disable: call `PATCH /api/sellers/me/karam { participatesInKaram: false }` (no price needed)
- Display current price on the Karam dashboard card: "سعر الوجبة: 15 ₪ للمشتري"

**Done when:** Karam enable requires a price. Price shows on the dashboard card.

---

### NEW-T5 — Cancellation Block: Handle 403 in Checkout 🔴 NEW

**What:** If a buyer has cancelled 5+ orders, they are blocked from placing new ones. The server returns 403.

**Files to modify:**
```
src/screens/buyer/reserve/CheckoutScreen.tsx   ← handle 403 from POST /api/orders
src/context/AuthContext.tsx                    ← read isBlocked from user profile on login
```

**CheckoutScreen — global error handler for POST /api/orders:**
```ts
try {
  const res = await api.post('/api/orders', { listingId, quantity, type: 'PURCHASE' });
  // success...
} catch (error) {
  if (error.response?.status === 403) {
    // Show block modal instead of generic error
    setIsBlockedModalVisible(true);
    return;
  }
  // handle other errors...
}
```

**Block modal UI:**
```
┌──────────────────────────────────────────┐
│  🚫 تم تعليق حسابك                        │
│                                          │
│  تم تعليق حسابك بسبب إلغاء الحجوزات     │
│  بشكل متكرر.                             │
│                                          │
│  تواصل مع الإدارة لإلغاء التعليق.        │
│                                          │
│         [ حسناً ]                        │
└──────────────────────────────────────────┘
```

**AuthContext — read `isBlocked` on login:**
After login or on profile fetch, check `user.isBlocked`. Store in context:
```ts
const [isBlocked, setIsBlocked] = useState(false);
// After GET /api/users/me:
setIsBlocked(userData.isBlocked ?? false);
```
Expose `isBlocked` from context so other screens can disable the "احجز الآن" button proactively:
```tsx
// In CheckoutScreen (or ListingCard button):
const { isBlocked } = useAuth();
// If isBlocked → show disabled button with tooltip "حسابك موقوف مؤقتاً"
```

**Done when:** Blocked buyer sees the block modal instead of a confusing error. The reserve button is visually disabled for blocked users.

---

### NEW-T6 — Dual Role: Buyer Can Register as Seller 🟡 NEW

**What:** The backend now allows a buyer to also create a seller profile without changing their main role. Login response already includes `sellerStatus`.

**What the login response now includes:**
```json
{
  "user": { "id": "...", "role": "BUYER", ... },
  "sellerStatus": "APPROVED" | "PENDING" | "REJECTED" | null,
  "charityStatus": null,
  "accessToken": "..."
}
```

**Files to modify:**
```
src/context/AuthContext.tsx   ← store sellerStatus in context
App.tsx                       ← if sellerStatus === "APPROVED", show seller dashboard option
```

**AuthContext update:**
```ts
// After login, store:
const [sellerStatus, setSellerStatus] = useState<string | null>(null);
// From login response: setSellerStatus(res.data.data.sellerStatus);
// Expose sellerStatus from context
```

**App.tsx routing logic:**
```ts
// A buyer with sellerStatus === "APPROVED" should be able to access seller dashboard
// Existing Task 11 (Switch-to-Buyer mode) handled seller→buyer direction
// Now handle buyer→seller direction:
// If user.role === "BUYER" && sellerStatus === "APPROVED":
//   Show a "لوحة التاجر" entry point somewhere (ProfileScreen handles the UI — Ghayda adds that)
//   Route "seller-dashboard" step to SellerDashboardScreen (already exists)
```

**Done when:** A buyer who also has a seller profile can access the seller dashboard (Ghayda adds the UI button in ProfileScreen). The routing works correctly.

---

### NEW-T7-COORD — Wrap App.tsx with StripeProvider 🔴 COORDINATION

**What:** Ghayda is integrating Stripe payments for the Karam buyer flow. She needs `StripeProvider` at the root of App.tsx. This is a 4-line addition.

**Ghayda will give you:** The Stripe publishable key (`pk_test_...`). Wait for her to share it via message.

**File to modify:** `App.tsx`

```bash
npx expo install @stripe/stripe-react-native
```

```tsx
import { StripeProvider } from '@stripe/stripe-react-native';

// Wrap the outermost navigator:
return (
  <StripeProvider publishableKey="pk_test_GHAYDA_WILL_GIVE_YOU_THIS">
    <AppConfigProvider>  {/* already added from Task T10 */}
      <AuthProvider>
        {/* ... rest of app */}
      </AuthProvider>
    </AppConfigProvider>
  </StripeProvider>
);
```

**Done when:** `StripeProvider` wraps the root. Ghayda's payment sheet will work after this.

---

### NEW-T8 — Badge Decrement Toast After Cancel 🟢 NEW

**What:** When a buyer cancels an order, the backend may automatically remove their loyalty badge. Detect this and show a toast.

**Files to modify:**
```
src/screens/buyer/OrdersScreen.tsx   ← after cancel, re-fetch profile and compare badges
```

```ts
const handleCancelOrder = async (orderId: string) => {
  // Save current badges before cancel
  const previousBadges = currentUser.badges?.map(b => b.id) ?? [];

  await api.patch(`/api/orders/${orderId}/cancel`);

  // Re-fetch profile
  const profileRes = await api.get('/api/users/me');
  const newBadges = profileRes.data.data.badges?.map(b => b.id) ?? [];

  // Find removed badges
  const removed = previousBadges.filter(b => !newBadges.includes(b));
  if (removed.includes('loyal_buyer_5') || removed.includes('loyal_buyer_10')) {
    showToast('تم سحب شارة المشتري الوفي بسبب الإلغاء', 'warning');
  }

  // Update user in context
  updateUserBadges(newBadges);

  // Refresh orders list
  refreshOrders();
};
```

**Done when:** After cancelling an order, if a loyalty badge was removed by the backend, the user sees a toast notification. No badge → no toast (normal cancel).

---

*LeftO Tasks — Tala | D2 Mobile Frontend | For Palestine 🇵🇸*
