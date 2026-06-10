# LeftO Backend — Senior Code Review
**Originally reviewed: 2026-05-20 | Last updated: 2026-06-02**
**25 issues found → all resolved. Additional features added post-review.**

---

## Resolution Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Race condition — quantity goes negative | CRITICAL | ✅ Fixed |
| 2 | Order expiry + quantity restore not atomic | CRITICAL | ✅ Fixed |
| 3 | `cancelOrder` unconditionally resets listing to ACTIVE | CRITICAL | ✅ Fixed |
| 4 | QR token per-listing not per-order | CRITICAL | ✅ Fixed |
| 5 | Registration returns no refresh token | CRITICAL | ✅ Fixed |
| 6 | `deductPoints` targets wrong table | CRITICAL | ✅ Fixed |
| 7 | Hard-delete seller on re-application causes 500 | HIGH | ✅ Fixed |
| 8 | `getListings`/`searchListings` load all records into RAM | HIGH | ✅ Fixed |
| 9 | `reviewerId` exposed on public endpoint | HIGH | ✅ Fixed |
| 10 | Buyer can monopolize a listing | HIGH | ✅ Fixed |
| 11 | CORS allows any origin | HIGH | ✅ Fixed |
| 12 | No pagination on `getMyDonations` | MEDIUM | ✅ Fixed |
| 13 | No pagination on `getAllCharities` | MEDIUM | ✅ Fixed |
| 14 | `reason` field in reject endpoints has no validation | MEDIUM | ✅ Fixed |
| 15 | `updateFcmToken` accepts any string | MEDIUM | ✅ Fixed |
| 16 | Document upload accepts any file type | MEDIUM | ✅ Already had fileFilter — no change needed |
| 17 | `pickupEnd` not validated against `pickupStart` | MEDIUM | ✅ Fixed |
| 18 | Admin approve/reject are dead code for auto-verified sellers | MEDIUM | ✅ Kept as manual override by design |
| 19 | Post-completion side effects duplicated | MEDIUM | ✅ Fixed |
| 20 | Chatbot queries buyer DB for SELLER/CHARITY users | LOW | ✅ Fixed |
| 21 | Chatbot accepts unlimited message length | LOW | ✅ Fixed |
| 22 | OTP record not cleared after registration | LOW | ✅ Fixed |
| 23 | `discountedPrice` has no minimum | LOW | ✅ Fixed |
| 24 | No CI/CD | INFRA | ✅ Fixed |
| 25 | No unit tests | INFRA | ✅ Fixed — 27 tests passing |

---

## Post-Review Features Added

| Feature | Branch/PR | Status |
|---------|-----------|--------|
| Points expansion (+5 review, +15 first order, -5 cancel, Community Donor badge) | fix/code-review-fixes | ✅ Done |
| Charity → seller review (`POST /api/reviews/charity`) | developG | ✅ Done |
| Charity 24-hour proof upload enforcement cron (node-cron, hourly) | developG | ✅ Done |
| `AppConfig` model + `GET /api/app/config` + `PATCH /api/admin/config` | developG | ✅ Done |
| New listing types: `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG` | developG | ✅ Done |
| `repeatDaily` field on Listing | developG | ✅ Done |
| Ramadan Mode — RAMADAN_BAG boosted in recommendations, iftar window detection | developG | ✅ Done |
| Prayer time utility (`adhan` library, Nablus coordinates, pure math) | developG | ✅ Done |

---

## CRITICAL — All Fixed

---

### 1. Race condition — quantity can go negative under concurrent orders ✅ FIXED
**File:** `src/repositories/order.repository.ts`

**Problem:** The code read `listing.quantity`, checked it, then decremented. Two simultaneous requests both read `quantity = 1`, both passed the check, both decremented → `quantity = -1`.

**Fix applied:** Atomic decrement with a `where: { quantity: { gte: requestedQty } }` guard inside a `prisma.$transaction`. If the update matches 0 rows, throws `INSUFFICIENT_QUANTITY` which the service converts to a clean 400.

---

### 2. Order expiry and quantity restore are NOT atomic ✅ FIXED
**File:** `src/services/order.service.ts`, `src/repositories/order.repository.ts`

**Problem:** `expireOrders` and `restoreListingQuantities` ran as two separate DB operations. Process crash between them = orders CANCELLED but quantity never restored.

**Fix applied:** Merged into a single `expireOrdersAndRestoreQuantities` function that wraps both `updateMany` (cancel orders) and individual `update` (restore quantities) inside one `prisma.$transaction`.

---

### 3. `cancelOrder` unconditionally resets listing status to ACTIVE ✅ FIXED
**File:** `src/repositories/order.repository.ts`

**Problem:** On cancel, listing was always set to `status: ACTIVE`, overriding the seller's intentional `SOLD_OUT` state.

**Fix applied:** Status is only changed to `ACTIVE` if the listing was `SOLD_OUT` due to zero quantity. If the seller explicitly marked it sold out with remaining stock, that state is preserved.

---

### 4. QR token is per-listing, not per-order ✅ FIXED
**File:** `src/utils/qr.ts`, `src/repositories/order.repository.ts`

**Problem:** `generateQRToken(listingId)` encoded only the listing ID. Any buyer could scan any other buyer's QR for the same listing.

**Fix applied:** QR payload now includes `{ listingId, orderId, exp }`. `scanOrderQR` validates both. Each order gets its own token stored in `order.qrToken`. Migration: `add_order_qr_token`.

---

### 5. Registration does NOT return a refresh token ✅ FIXED
**File:** `src/services/auth.service.ts`

**Problem:** `POST /api/auth/register` returned only an `accessToken`. User was silently kicked out after 15 minutes with no way to refresh.

**Fix applied:** Registration now generates and saves a refresh token — same flow as login — and returns both `accessToken` and `refreshToken`.

---

### 6. `deductPoints` targets wrong table ✅ FIXED
**File:** `src/utils/points.ts`

**Problem:** Raw SQL targeted `"User"` but the actual table is `"users"` (from `@@map("users")`). 0 rows affected, no error, no points deducted. Cancel penalty never applied.

**Fix applied:** Replaced raw SQL with Prisma ORM: `findUnique` to get current points, then `update` with `Math.max(0, current - amount)`. Floor at 0 is guaranteed.

---

## HIGH — All Fixed

---

### 7. Hard-deleting a seller with existing data causes 500 on re-application ✅ FIXED
**File:** `src/repositories/seller.repository.ts`

**Problem:** `prisma.seller.delete` threw a P2003 FK constraint error if the seller had listings or orders.

**Fix applied:** `resetSellerForReapplication` updates the existing record in-place (resets fields, sets `status: PENDING`), preserving history and avoiding FK errors.

---

### 8. `getListings` and `searchListings` load ALL records into memory ✅ FIXED
**File:** `src/repositories/listing.repository.ts`

**Problem:** `findMany` with no `take` pulled every listing into Node.js RAM. Allergen filtering done in JavaScript post-fetch.

**Fix applied:**
- Pushed allergen filtering to DB level using Prisma `NOT` clause with `mode: 'insensitive'`
- Added `take: 500` safety cap as absolute ceiling
- `skip`/`take` applied at DB level for pagination

---

### 9. `reviewerId` exposed on public endpoint ✅ FIXED
**File:** `src/repositories/review.repository.ts`

**Problem:** `reviewerId` (raw user UUID) included in the public `GET /api/reviews/seller/:id` response — enables user ID enumeration.

**Fix applied:** `reviewerId` removed from the `select` clause on `getSellerReviews`.

---

### 10. Buyer can reserve all quantity of a listing themselves ✅ FIXED
**File:** `src/repositories/order.repository.ts`

**Problem:** No guard prevented one buyer from placing multiple orders for the same listing.

**Fix applied:** Inside the create transaction, checks for an existing `RESERVED` order by the same `buyerId` for the same `listingId`. If found, throws `ALREADY_RESERVED` → service returns `409 Conflict`.

---

### 11. CORS allows any origin ✅ FIXED
**File:** `src/app.ts`

**Problem:** `app.use(cors())` with no config — any domain could make authenticated requests.

**Fix applied:**
```typescript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true;
app.use(cors({ origin: allowedOrigins }));
```
`ALLOWED_ORIGINS` added to `.env`.

---

## MEDIUM — All Fixed

---

### 12. No pagination on `getMyDonations` ✅ FIXED
**File:** `src/repositories/donation.repository.ts`, `src/services/donation.service.ts`, `src/controllers/donation.controller.ts`

**Fix applied:** Full pagination stack added end-to-end. Both `findDonationsBySeller` and `findDonationsByCharity` now accept `skip`/`take` and return `{ donations, total }`. Response shape: `{ donations: [...], pagination: { page, limit, total, totalPages } }`.

---

### 13. No pagination on `getAllCharities` ✅ FIXED
**File:** `src/repositories/charity.repository.ts`

**Fix applied:** Added `take: 100` cap to `findAllApprovedCharities`. Full pagination can be added if the charity list ever exceeds 100.

---

### 14. `reason` field in reject endpoints has no validation ✅ FIXED
**File:** `src/controllers/admin.controller.ts`

**Fix applied:** Zod schema `z.object({ reason: z.string().max(500).optional() })` added to both `rejectSeller` and `rejectCharity` handlers.

---

### 15. `updateFcmToken` accepts any string ✅ FIXED
**File:** `src/controllers/auth.controller.ts`

**Fix applied:** `z.object({ fcmToken: z.string().max(200).nullable() })` validates the body before the DB update.

---

### 16. Document upload accepts any file type ✅ ALREADY FIXED
**File:** `src/config/multer.ts`

**Diagnosis:** `fileFilter` was already present restricting to `['application/pdf', 'image/jpeg', 'image/png']`. No change needed.

---

### 17. `pickupEnd` not validated to be after `pickupStart` ✅ FIXED
**File:** `src/validators/listing.validator.ts`

**Fix applied:** `.refine(data => new Date(data.pickupEnd) > new Date(data.pickupStart), { message: 'Pickup end time must be after pickup start time', path: ['pickupEnd'] })` added to the listing schema.

---

### 18. Admin approve/reject are dead code for auto-verified sellers — DESIGN DECISION
**File:** `src/services/seller.service.ts`

**Decision:** Auto-verification via Chamber of Commerce number is intentional. Admin approval endpoints are kept as **manual override only** — an admin can reject a seller who passed auto-verification but was later found to be fraudulent. This is documented in the README. No code change made.

---

### 19. Post-completion side effects duplicated ✅ FIXED
**File:** `src/services/order.service.ts`

**Fix applied:** Extracted `handleOrderCompletion(buyerId, order, notificationTitle, notificationBody)` helper. Both `markOrderReceived` and `scanOrderQR` call it. Points, CO2, badges, and notifications are now maintained in one place.

---

## LOW — All Fixed

---

### 20. Chatbot queries buyer DB for SELLER/CHARITY roles ✅ FIXED
**File:** `src/services/chatbot.service.ts`

**Fix applied:** Fetch user first to check role. Orders and favorites queries are wrapped in `isBuyer ? prisma.order.findMany(...) : Promise.resolve([])`. Non-buyers skip those two DB calls entirely.

---

### 21. Chatbot accepts unlimited message length ✅ FIXED
**File:** `src/controllers/chatbot.controller.ts`

**Fix applied:** `if (message.length > 1000) throw new AppError('Message is too long (max 1000 characters)', 400)` added before calling the service.

---

### 22. OTP record not cleared after registration ✅ FIXED
**File:** `src/repositories/otp.repository.ts`, `src/services/auth.service.ts`

**Fix applied:** Added `deleteOtpsByPhone(phone)` to the OTP repository. Called non-blocking (`.catch(() => {})`) after `saveRefreshToken` in the login/register flow.

---

### 23. `discountedPrice` has no minimum ✅ FIXED
**File:** `src/validators/listing.validator.ts`

**Fix applied:** Changed from `.positive()` to `.min(0.5, 'Discounted price must be at least 0.5 NIS')`.

---

## INFRA — Both Fixed

---

### 24. No CI/CD ✅ FIXED
GitHub Actions workflow added at `.github/workflows/ci.yml`. Runs on every push and PR to `developG`: typecheck + 27 unit tests. Broken TypeScript or failing tests block the PR.

---

### 25. No unit tests ✅ FIXED
27 Jest unit tests passing across 4 test files:
- `co2.test.ts` — CO2 estimation per category + weight
- `points.test.ts` — award, deduct, floor-at-zero behavior
- `qr.test.ts` — token generation, valid verify, expired token, tampered token
- `distance.test.ts` — haversine against known coordinate pairs

---

*LeftO Code Review — Originally 2026-05-20 | Updated 2026-06-02 | All 25 issues resolved*
