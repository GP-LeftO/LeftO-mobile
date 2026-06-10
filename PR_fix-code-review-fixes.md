# PR: fix/code-review-fixes → developG

## Title
`fix: resolve 8 critical code review issues`

---

## Summary

Fixes 8 critical issues identified in the code review, covering security, correctness, and data integrity bugs.

---

## Fixes Applied

### 1. `deductPoints` — wrong table name (silent failure)
- **File:** `src/utils/points.ts`
- Raw SQL `UPDATE "User"` failed silently because the table is `@@map("users")` in Prisma
- Replaced with Prisma client: `prisma.user.update(...)` with a `Math.max(0, ...)` guard against negative points

### 2. No refresh token on registration
- **File:** `src/services/auth.service.ts`
- `registerUser` only returned `accessToken`; users were silently logged out after 15 min
- Now generates and saves a refresh token the same way `loginUser` does

### 3. QR token per-order (was per-listing)
- **Files:** `src/utils/qr.ts`, `src/services/order.service.ts`, `src/repositories/order.repository.ts`, `prisma/schema.prisma`
- QR tokens were tied to a listing; any order for the same listing could scan any other order's QR
- Added `orderId` to `QRPayload`; token generated per-order at creation (`updateOrderQrToken`); orderId validated at scan time
- Schema: added `qrToken String?` to `Order` → migration `add_order_qr_token`

### 4. `cancelOrder` — unconditional ACTIVE reset
- **File:** `src/repositories/order.repository.ts`
- Cancelling any order always reset listing status to `ACTIVE`, even if the seller had manually set it to `SOLD_OUT`
- Now only reactivates if listing was `SOLD_OUT` due to quantity hitting 0 (`shouldReactivate` guard)

### 5. Race condition on quantity decrement
- **File:** `src/repositories/order.repository.ts`
- Read-check-write pattern allowed two concurrent requests to both pass the quantity check for the last item
- Replaced with atomic `updateMany` + where-guard (`quantity: { gte: data.quantity }`); if `count === 0`, another request won the race

### 6. `pickupEnd` not validated against `pickupStart`
- **File:** `src/validators/listing.validator.ts`
- No check prevented end time from being before start time
- Added Zod `.refine()` that rejects if `pickupEnd <= pickupStart`

### 7. `reviewerId` exposed publicly
- **File:** `src/repositories/review.repository.ts`
- `getSellerReviews` returned `reviewerId`, leaking which buyer wrote each review
- Removed `reviewerId` from the public select

### 8. Hard-delete seller re-application crash
- **Files:** `src/services/seller.service.ts`, `src/repositories/seller.repository.ts`
- Deleting a seller with existing listings/orders caused Prisma P2003 FK constraint violation on re-create
- Replaced delete + create with update-in-place via `resetSellerForReapplication`; preserves all FK relations and history

---

## Schema Changes

| Change | Migration |
|--------|-----------|
| Added `qrToken String?` to `Order` model | `add_order_qr_token` |

---

## How to Test

| Scenario | Expected |
|----------|----------|
| `POST /api/auth/register` | Response includes `refreshToken` |
| Place two simultaneous orders for a listing with `quantity: 1` | Only one succeeds, second gets 409/400 |
| Cancel an order on a listing seller manually set to `SOLD_OUT` | Listing stays `SOLD_OUT` |
| `GET /api/sellers/:id/reviews` | No `reviewerId` in response |
| Seller with existing listings re-applies after rejection | No 500 error |
| Scan QR of order A on order B's endpoint | Returns 400 mismatch error |

---

## Changes from Plan

No scope changes — all 8 fixes are from the code review backlog (`CODE_REVIEW.md`). Lower-priority issues (Issues 2, 10–23) deferred to a follow-up fix branch.
