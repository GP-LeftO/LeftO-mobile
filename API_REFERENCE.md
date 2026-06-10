# LeftO — Full API Reference

> For the front-end team. Every endpoint, every field, every error.

---

## Global Rules

### Base URLs
| Environment | URL |
|-------------|-----|
| Local dev | `http://localhost:3000` |
| Production | `https://lefto-backend-production.up.railway.app` |

### Auth Header
All protected endpoints require:
```
Authorization: Bearer <accessToken>
```

### All responses follow this shape
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Human-readable error", "errors": ["field-level detail"] }
```

### HTTP status codes used
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request (business logic error) |
| 401 | Missing or invalid token |
| 403 | Forbidden (wrong role, or action not allowed) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation error (wrong field types/format) |
| 429 | Rate limit exceeded |
| 503 | External service unavailable |

---

## 1. OTP

### POST /api/auth/send-otp
Send a 6-digit OTP to a phone number. Must be called before register or forgot-password.

**Auth:** None

**Body:**
```json
{ "phone": "0591234567" }
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| phone | string | Yes | 10–15 digits only |

**Success 200:**
```json
{ "success": true, "data": { "message": "OTP sent successfully" } }
```

**Errors:**
| Code | Message |
|------|---------|
| 422 | Phone must contain only numbers |
| 429 | Too many OTP requests. Please wait before requesting another. |

> **Dev note:** OTP code is printed in the server terminal (mock SMS for MVP). Check Railway logs in production.

---

### POST /api/auth/verify-otp
Verify the 6-digit code. Must be called before `register`. Marks the phone as verified in the DB.

**Auth:** None

**Body:**
```json
{ "phone": "0591234567", "code": "123456" }
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| phone | string | Yes | 10–15 digits |
| code | string | Yes | Exactly 6 digits |

**Success 200:**
```json
{ "success": true, "data": { "message": "Phone verified successfully" } }
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Invalid or expired OTP |
| 400 | OTP already used |
| 422 | Validation error |

---

## 2. Authentication

### POST /api/auth/register
Create a new user account. Phone must be OTP-verified first.

**Auth:** None

**Body:**
```json
{
  "name": "غيداء",
  "phone": "0591234567",
  "password": "Password123!",
  "role": "BUYER",
  "allergyPreferences": ["nuts", "gluten"],
  "dietaryPreferences": ["vegetarian"]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| name | string | Yes | 2–50 characters |
| phone | string | Yes | 10–15 digits |
| email | string | No | Valid email format |
| password | string | Yes | 8–100 characters |
| role | string | Yes | `BUYER`, `SELLER`, or `CHARITY` |
| allergyPreferences | string[] | No | Defaults to `[]` |
| dietaryPreferences | string[] | No | Defaults to `[]` |

**Success 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "غيداء",
      "phone": "0591234567",
      "role": "BUYER"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Phone number has not been OTP-verified |
| 409 | Phone number already registered |
| 409 | Email already registered |
| 422 | Name must be at least 2 characters |
| 422 | Password must be at least 8 characters |
| 422 | Role must be BUYER, SELLER, or CHARITY |

---

### POST /api/auth/login

**Auth:** None

**Body:**
```json
{ "phone": "0591234567", "password": "Password123!" }
```

**Success 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "غيداء", "role": "SELLER" },
    "sellerStatus": "APPROVED",
    "charityStatus": null,
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

> **How to use `sellerStatus` / `charityStatus` after login:**
> - `null` → profile not created yet → send to registration screen
> - `"PENDING"` → waiting for admin approval → show "under review" screen
> - `"APPROVED"` → full access
> - `"REJECTED"` → show rejection screen

**Errors:**
| Code | Message |
|------|---------|
| 401 | Invalid credentials |
| 422 | Validation error |

---

### POST /api/auth/refresh
Get a new access token using a refresh token. Call this when you get a 401 on any protected endpoint.

**Auth:** None

**Body:**
```json
{ "refreshToken": "eyJhbG..." }
```

**Success 200:**
```json
{ "success": true, "data": { "accessToken": "eyJhbG..." } }
```

**Errors:**
| Code | Message |
|------|---------|
| 401 | Invalid or expired refresh token |
| 422 | Refresh token is required |

---

### POST /api/auth/logout
Invalidate the refresh token. Also call `PUT /api/auth/fcm-token` with `null` to clear push notifications.

**Auth:** None

**Body:**
```json
{ "refreshToken": "eyJhbG..." }
```

**Success 200:**
```json
{ "success": true, "data": { "message": "Logged out successfully" } }
```

---

### POST /api/auth/forgot-password
Request a password reset OTP. Always returns success regardless of whether the phone exists (security — never reveals registered phones).

**Auth:** None

**Body:**
```json
{ "phone": "0591234567" }
```

**Success 200:**
```json
{ "success": true, "data": { "message": "If this phone is registered, an OTP has been sent." } }
```

> OTP code printed in server terminal (dev) / Railway logs (production).

---

### POST /api/auth/reset-password

**Auth:** None

**Body:**
```json
{
  "phone": "0591234567",
  "code": "123456",
  "newPassword": "NewPassword123!"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| phone | string | Yes | 10–15 digits |
| code | string | Yes | Exactly 6 digits |
| newPassword | string | Yes | 8–100 characters |

**Success 200:**
```json
{ "success": true, "data": { "message": "Password reset successfully" } }
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Invalid or expired OTP |
| 404 | Account not found |
| 422 | Validation error |

---

### GET /api/auth/me
Returns the user object from the JWT payload (minimal — use `/api/users/me` for full profile).

**Auth:** Required (any role)

**Success 200:**
```json
{
  "success": true,
  "data": { "userId": "uuid", "role": "BUYER", "iat": 1234567890, "exp": 1234567890 }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 401 | No token provided / Invalid token / Token expired |

---

### PUT /api/auth/fcm-token
Save or clear the Firebase device token for push notifications. Call after login with the token from Firebase SDK. Pass `null` on logout.

**Auth:** Required (any role)

**Body:**
```json
{ "fcmToken": "FCM_DEVICE_TOKEN_FROM_FIREBASE_SDK" }
```

To clear on logout:
```json
{ "fcmToken": null }
```

**Success 200:**
```json
{ "success": true, "data": { "message": "FCM token updated" } }
```

---

## 3. Users

### GET /api/users/me
Full authenticated user profile — everything in one call.

**Auth:** Required (any role)

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Layla",
    "phone": "0591111111",
    "email": "buyer@demo.lefto",
    "role": "BUYER",
    "language": "AR",
    "avatarStyle": null,
    "avatarColor": null,
    "dietaryPreferences": ["vegetarian"],
    "allergyPreferences": ["nuts"],
    "badges": ["first_save", "loyal_buyer_5"],
    "points": 75,
    "totalCo2SavedKg": 4.2,
    "pickupWindowPref": null,
    "activeOrdersCount": 1,
    "confirmedDonationsCount": 3,
    "isBlocked": false,
    "cancellationCount": 0,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "seller": null,
    "charity": null
  }
}
```

> For SELLER accounts, `seller` contains `{ id, businessName, businessType, status, rating, verifiedBadge }`.
> For CHARITY accounts, `charity` contains `{ id, orgName, region, status, verifiedBadge }`.
> The field for the other role is always `null`.

**Errors:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 404 | User not found |

---

### GET /api/users/me/impact-certificate?month=YYYY-MM
Download a PDF impact certificate for the authenticated user for a given month.

**Auth:** Required (any role)

**Query params:**
| Param | Required | Format |
|-------|----------|--------|
| month | Yes | `YYYY-MM` e.g. `2026-06` |

**Success 200:** Binary PDF — `Content-Type: application/pdf`

The PDF contains: user name, month in Arabic, meals saved, CO2 saved in kg, CO2 equivalent, total all-time stats.

**Download in JavaScript:**
```javascript
const res  = await fetch('/api/users/me/impact-certificate?month=2026-06', {
  headers: { Authorization: `Bearer ${token}` }
});
const blob = await res.blob();
const url  = URL.createObjectURL(blob);
const a    = document.createElement('a');
a.href = url; a.download = 'impact.pdf'; a.click();
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Invalid month format. Use YYYY-MM |
| 404 | User not found |

---

### PATCH /api/users/me
Update name, email, language, allergy/dietary preferences, or pickup window preference. All fields optional — only send what you want to change.

**Auth:** Required (any role)

**Body:**
```json
{
  "name": "Layla Ahmed",
  "email": "layla@example.com",
  "language": "EN",
  "allergyPreferences": ["nuts", "dairy"],
  "dietaryPreferences": ["vegetarian"],
  "pickupWindowPref": "morning"
}
```

| Field | Type | Rules |
|-------|------|-------|
| name | string | 2–50 characters |
| email | string | Valid email |
| language | string | `AR` or `EN` |
| allergyPreferences | string[] | Array of allergen strings |
| dietaryPreferences | string[] | Array of preference strings |
| pickupWindowPref | string | Max 50 characters |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Layla Ahmed",
    "phone": "0591111111",
    "email": "layla@example.com",
    "role": "BUYER",
    "language": "EN",
    "allergyPreferences": ["nuts", "dairy"],
    "dietaryPreferences": ["vegetarian"],
    "pickupWindowPref": "morning",
    "updatedAt": "2026-06-04T10:00:00.000Z"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 401 | Unauthorized |
| 422 | Invalid email format / Name must be at least 2 characters |

---

## 4. Sellers

### POST /api/sellers/register
Create a seller business profile after registering with role `SELLER`. If the registration number is in the whitelist → instantly approved with verified badge.

**Auth:** Required (role: `SELLER`)

**Body:**
```json
{
  "businessName": "مطعم أبو العبد",
  "businessType": "RESTAURANT",
  "location": {
    "latitude": 32.2211,
    "longitude": 35.2544,
    "address": "شارع فيصل، نابلس"
  },
  "description": "وجبات يومية بخصم",
  "registrationNumber": "NE-200001",
  "contactInfo": {
    "phone": "0509876543",
    "website": "https://example.com",
    "socialMedia": "https://instagram.com/example"
  },
  "documentUrls": ["https://supabase.co/storage/.../trade-license.pdf"]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| businessName | string | Yes | 2–100 characters |
| businessType | string | Yes | `RESTAURANT`, `MARKET`, or `BAKERY` |
| location.latitude | number | Yes | -90 to 90 |
| location.longitude | number | Yes | -180 to 180 |
| location.address | string | No | Max 255 characters |
| description | string | No | Max 1000 characters |
| registrationNumber | string | Yes | Format: `NE-XXXXXX` |
| contactInfo.phone | string | No | 10–15 digits |
| contactInfo.website | string | No | Valid URL |
| contactInfo.socialMedia | string | No | Max 200 characters |
| documentUrls | string[] | No | Array of valid URLs from `/api/documents/upload` |

**Success 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "مطعم أبو العبد",
    "businessType": "RESTAURANT",
    "status": "APPROVED",
    "verifiedBadge": true,
    "rating": null,
    "participatesInKaram": false
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Registration number not found in our verified list |
| 403 | Only SELLER accounts can register a seller profile |
| 409 | Seller profile already exists for this account |
| 422 | Business type must be RESTAURANT, MARKET, or BAKERY |

---

### GET /api/sellers/me
Seller's full dashboard: profile + all listings + computed metrics.

**Auth:** Required (role: `SELLER`)

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "مطعم أبو العبد",
    "businessType": "RESTAURANT",
    "status": "APPROVED",
    "verifiedBadge": true,
    "rating": 4.3,
    "participatesInKaram": true,
    "activeListingsCount": 3,
    "totalOrdersCompleted": 48,
    "totalRevenue": 1200,
    "currentMonthOrders": 12,
    "totalItemsSaved": 120,
    "listings": [ ... ]
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Forbidden |
| 404 | Seller profile not found |

---

### PATCH /api/sellers/me
Update seller profile fields. All optional.

**Auth:** Required (role: `SELLER`)

**Body:**
```json
{
  "description": "Updated description",
  "phone": "0509876543",
  "website": "https://example.com",
  "socialMedia": "https://instagram.com/example",
  "logoUrl": "https://supabase.co/storage/.../logo.jpg"
}
```

**Success 200:** Returns updated seller profile.

---

### GET /api/sellers/me/orders
Paginated list of all orders on this seller's listings.

**Auth:** Required (role: `SELLER`)

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | |
| limit | number | 20 | Max 100 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "quantity": 2,
        "totalPrice": 30,
        "type": "PURCHASE",
        "status": "COMPLETED",
        "createdAt": "2026-06-04T12:00:00.000Z",
        "receivedAt": "2026-06-04T14:00:00.000Z",
        "listing": { "title": "حقيبة الغداء", "category": "MEALS" },
        "buyer": { "name": "Layla" },
        "charity": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 48, "totalPages": 3 }
  }
}
```

---

### GET /api/sellers/:id
Public. Single seller profile with their active listings.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "مطعم أبو العبد",
    "businessType": "RESTAURANT",
    "address": "شارع فيصل، نابلس",
    "latitude": 32.2211,
    "longitude": 35.2544,
    "rating": 4.3,
    "verifiedBadge": true,
    "totalDonations": 12,
    "participatesInKaram": true,
    "listings": [ ... ]
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 404 | Seller not found |

---

## 5. Karam Program

### GET /api/sellers/karam
Public. List of all sellers currently participating in the Karam program, with today's balance.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": [
    {
      "sellerId": "uuid",
      "businessName": "مطعم أبو العبد",
      "today": { "sponsored": 5, "claimed": 2, "available": 3 }
    }
  ]
}
```

---

### PATCH /api/sellers/me/karam
Toggle the seller's Karam participation on or off.

**Auth:** Required (role: `SELLER`, status: `APPROVED`)

**No body needed.**

**Success 200:**
```json
{ "success": true, "data": { "participatesInKaram": true } }
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Only approved sellers can manage Karam |
| 404 | Seller profile not found |

---

### POST /api/sellers/me/karam/sponsor
Seller marks that they are sponsoring one Karam meal (increments their own sponsored counter).

**Auth:** Required (role: `SELLER`, status: `APPROVED`)

**No body needed.**

**Success 200:**
```json
{ "success": true, "data": { "sponsored": 6, "claimed": 2, "available": 4 } }
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | This seller is not participating in the Karam program |
| 403 | Forbidden |

---

### POST /api/sellers/me/karam/claim
Seller records that one Karam meal was claimed (decrements available balance).

**Auth:** Required (role: `SELLER`, status: `APPROVED`)

**No body needed.**

**Success 200:**
```json
{ "success": true, "data": { "sponsored": 6, "claimed": 3, "available": 3 } }
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | No available Karam meals to claim |
| 400 | This seller is not participating in the Karam program |

---

### GET /api/sellers/:id/karam
Public. Get a specific seller's Karam balance for today.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "sellerId": "uuid",
    "participatesInKaram": true,
    "today": { "sponsored": 5, "claimed": 2, "available": 3 }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 404 | Seller not found |

---

### POST /api/sellers/:id/karam/sponsor
**Buyer** anonymously sponsors one Karam meal from a specific seller's pool.

**Auth:** Required (role: `BUYER`)

**No body needed.**

**URL param:** `:id` = seller UUID

**Success 200:**
```json
{ "success": true, "data": { "sponsored": 6, "claimed": 2, "available": 4 } }
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | This seller is not participating in the Karam program |
| 403 | Forbidden |
| 404 | Seller not found |

---

## 6. Charities

### POST /api/charities/register
Create a charity profile. If registration number is in the whitelist → instantly approved.

**Auth:** Required (role: `CHARITY`)

**Body:**
```json
{
  "orgName": "جمعية إطعام نابلس",
  "description": "نوزع وجبات على الأسر المحتاجة في نابلس",
  "region": "نابلس",
  "registrationNumber": "MOI-10001",
  "location": {
    "latitude": 32.2211,
    "longitude": 35.2544,
    "address": "وسط البلد، نابلس"
  },
  "contactInfo": { "phone": "0509876543" },
  "documentUrls": ["https://supabase.co/storage/.../charity-reg.pdf"]
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| orgName | string | Yes | 2–100 characters |
| region | string | Yes | 2–100 characters |
| registrationNumber | string | Yes | Format: `MOI-XXXXX` |
| description | string | No | Max 1000 characters |
| location | object | No | latitude, longitude, address |
| contactInfo.phone | string | No | 10–15 digits |
| documentUrls | string[] | No | Max 10 URLs |

**Success 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orgName": "جمعية إطعام نابلس",
    "status": "APPROVED",
    "verifiedBadge": true
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Registration number not found in our verified list |
| 403 | Only CHARITY accounts can register a charity profile |
| 409 | Charity profile already exists for this account |
| 422 | Validation error |

---

### GET /api/charities
Public. All approved charities.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orgName": "جمعية إطعام نابلس",
      "region": "نابلس",
      "verifiedBadge": true,
      "rating": 4.7,
      "status": "APPROVED"
    }
  ]
}
```

---

### GET /api/charities/:id
Public. Single charity with trust score.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orgName": "جمعية إطعام نابلس",
    "region": "نابلس",
    "address": "وسط البلد، نابلس",
    "verifiedBadge": true,
    "rating": 4.7,
    "trustScore": 82,
    "trustBreakdown": {
      "volume": 22,
      "proofRate": 35,
      "avgRating": 18,
      "responseSpeed": 7
    }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 404 | Charity not found |

---

### GET /api/charities/:id/basket
Public. What food categories this charity needs. Sellers can check before creating a donation.

**Auth:** None

**Success 200:**
```json
{ "success": true, "data": { "categories": ["MEALS", "GROCERIES"] } }
```

---

### PUT /api/charities/me/basket
Charity sets their food needs (replaces all previous categories). Must be APPROVED.

**Auth:** Required (role: `CHARITY`, status: `APPROVED`)

**Body:**
```json
{ "categories": ["MEALS", "BREAD_AND_PASTRIES"] }
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| categories | string[] | Yes | 1–4 values. Each must be `MEALS`, `BREAD_AND_PASTRIES`, `GROCERIES`, or `MIXED` |

**Success 200:**
```json
{
  "success": true,
  "data": { "charityId": "uuid", "categories": ["MEALS", "BREAD_AND_PASTRIES"] }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Your charity account must be approved before managing your basket |
| 404 | Charity profile not found |
| 422 | At least one category is required |
| 422 | Cannot select more than 4 categories |

---

### GET /api/charities/me/basket
Get this charity's current basket.

**Auth:** Required (role: `CHARITY`)

**Success 200:**
```json
{ "success": true, "data": { "categories": ["MEALS"] } }
```

---

## 7. Listings

### GET /api/listings
Public. Paginated active listings with optional filters.

**Auth:** None

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| category | string | — | `MEALS`, `BREAD_AND_PASTRIES`, `GROCERIES`, `MIXED` |
| status | string | — | `ACTIVE`, `SOLD_OUT`, `EXPIRED` |
| type | string | — | `MEAL_BAG`, `SPECIFIC_PARCEL` |
| sellerId | string | — | Filter by seller UUID |
| lat | number | — | User latitude (enables distance sort) |
| lng | number | — | User longitude |
| radius | number | — | `1`, `5`, or `10` km |
| minPrice | number | — | Min discounted price |
| maxPrice | number | — | Max discounted price |
| freshnessBadge | string | — | `eat_today`, `fresh_tonight`, `good_1_2_days` |
| excludeAllergens | string | — | Comma-separated allergens to exclude |
| sortBy | string | `createdAt` | `distance`, `price`, `rating`, `freshness`, `createdAt` |
| page | number | 1 | |
| limit | number | 10 | Max 50 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "type": "MEAL_BAG",
        "title": "حقيبة مفاجآت الغداء",
        "description": "وجبة غداء كاملة",
        "category": "MEALS",
        "quantity": 3,
        "originalPrice": 30,
        "discountedPrice": 12,
        "currentPrice": 9.5,
        "isPriceDecaying": true,
        "floorPrice": 5,
        "pickupStart": "2026-06-04T12:00:00.000Z",
        "pickupEnd": "2026-06-04T14:00:00.000Z",
        "expiryDate": "2026-06-04T23:59:59.000Z",
        "freshnessBadge": "eat_today",
        "allergenNote": "يحتوي على جلوتين",
        "estimatedCo2SavedG": 800,
        "status": "ACTIVE",
        "qrCodeUrl": "data:image/png;base64,...",
        "createdAt": "2026-06-04T08:00:00.000Z",
        "seller": {
          "id": "uuid",
          "businessName": "مطعم أبو العبد",
          "businessType": "RESTAURANT",
          "address": "شارع فيصل، نابلس",
          "latitude": 32.2211,
          "longitude": 35.2544,
          "rating": 4.3,
          "verifiedBadge": true,
          "totalDonations": 12,
          "participatesInKaram": true
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
  }
}
```

---

### GET /api/listings/search
Full-text + location-aware search.

**Auth:** None

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| q | string | — | Text search (title / business name) |
| lat | number | — | User latitude |
| lng | number | — | User longitude |
| radius | number | — | Radius in km |
| category | string | — | `MEALS`, `BREAD_AND_PASTRIES`, `GROCERIES`, `MIXED` |
| freshnessBadge | string | — | `eat_today`, `fresh_tonight`, `good_1_2_days` |
| minPrice | number | — | |
| maxPrice | number | — | |
| excludeAllergens | string | — | Comma-separated |
| sortBy | string | `relevance` | `relevance`, `distance`, `price`, `rating` |
| page | number | 1 | |
| limit | number | 10 | Max 50 |

**Success 200:** Same shape as `GET /api/listings`.

---

### GET /api/listings/recommended
Personalized recommendations scored by 10 signals. Returns top 10 listings.

**Auth:** Required (any role — buyer gets personalized results)

**Query params:**
| Param | Type | Notes |
|-------|------|-------|
| lat | number | Optional — enables distance scoring |
| lng | number | Optional |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "uuid",
        "title": "حقيبة مفاجآت الغداء",
        "score": 95,
        "reasons": ["من متجرك المفضل", "يتناسب مع ذوقك", "خصم 50%"],
        "distanceKm": 1.2,
        "rescueScore": 55,
        "rescueBadge": "expiring_soon",
        "seller": { "participatesInKaram": true, ... }
      }
    ],
    "total": 8
  }
}
```

**Rescue score signals:**
| Signal | Points |
|--------|--------|
| Expires within 3h | +25 |
| Expires within 6h | +15 |
| Discount ≥ 50% | +20 |
| 1–2 units left | +15 |
| Pickup window open now | +15 |

**`rescueBadge` values:** `critical_rescue` (60+) · `expiring_soon` (35–59) · `good_deal` (<35)

---

### GET /api/listings/:id
Public. Single listing with full seller details.

**Auth:** None

**Success 200:** Full listing object including `qrCodeUrl` (base64 PNG, valid 24h).

**Errors:**
| Code | Message |
|------|---------|
| 404 | Listing not found |

---

### POST /api/listings
Create a new listing.

**Auth:** Required (role: `SELLER`, status: `APPROVED`)

**Body:**
```json
{
  "type": "MEAL_BAG",
  "title": "حقيبة مفاجآت المخبزة",
  "description": "خبز وحلويات متبقية من اليوم",
  "category": "BREAD_AND_PASTRIES",
  "quantity": 5,
  "originalPrice": 25,
  "discountedPrice": 10,
  "pickupStart": "2026-06-04T15:00:00.000Z",
  "pickupEnd": "2026-06-04T17:00:00.000Z",
  "expiryDate": "2026-06-04T18:00:00.000Z",
  "freshnessBadge": "eat_today",
  "allergenNote": "يحتوي على جلوتين",
  "estimatedWeightG": 400,
  "estimatedCo2SavedG": 560,
  "photoUrl": "https://...",
  "repeatDaily": false
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| type | string | Yes | `MEAL_BAG` or `SPECIFIC_PARCEL` |
| title | string | Yes | 2–100 characters |
| category | string | Yes | `MEALS`, `BREAD_AND_PASTRIES`, `GROCERIES`, `MIXED` |
| quantity | integer | Yes | Min 1 |
| originalPrice | number | Yes | Must be positive |
| discountedPrice | number | Yes | Must be < originalPrice, min 0.5 NIS |
| pickupStart | ISO datetime | Yes | |
| pickupEnd | ISO datetime | Yes | Must be after pickupStart |
| expiryDate | ISO datetime | No for MEAL_BAG / **Required for SPECIFIC_PARCEL** | Must be a future date |
| freshnessBadge | string | No | `eat_today`, `fresh_tonight`, `good_1_2_days` |
| allergenNote | string | No | Max 500 characters |
| estimatedWeightG | integer | No | Weight in grams — used for CO2 auto-calculation |
| estimatedCo2SavedG | integer | No | Auto-calculated if omitted |
| photoUrl | string | No | Valid URL |
| repeatDaily | boolean | No | Display hint for FE only |
| isPriceDecaying | boolean | No | Enable automatic price decay toward `floorPrice` |
| floorPrice | number | Required if isPriceDecaying=true | Minimum price — must be < discountedPrice |

**Decaying price fields on every listing response:**
| Field | Type | Notes |
|-------|------|-------|
| `currentPrice` | number | Live price right now — always use this for display |
| `isPriceDecaying` | boolean | True if price is decaying |
| `floorPrice` | number\|null | Minimum the price can reach |

**Expiry rules:**
- `MEAL_BAG` → if no `expiryDate`, auto-set to end of pickup day (23:59:59)
- `SPECIFIC_PARCEL` → `expiryDate` is required and must be in the future

**Success 201:** Returns the full created listing object.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Meal listings cannot expire after end of pickup day |
| 400 | expiryDate is required for SPECIFIC_PARCEL listings |
| 400 | expiryDate must be in the future |
| 400 | TAKIYA listings have been deprecated. Use the Karam counter endpoints instead. |
| 400 | RAMADAN_BAG listings are no longer created this way. |
| 401 | Unauthorized |
| 403 | Only SELLER accounts can create listings |
| 403 | Only approved sellers can create listings |
| 422 | Discounted price must be less than the original price |
| 422 | Pickup end time must be after pickup start time |

---

### PUT /api/listings/:id
Update a listing. All fields optional. Seller must own it.

**Auth:** Required (role: `SELLER`)

**Body:** Same fields as POST — only include what you want to change.

**Success 200:** Returns updated listing.

**Errors:**
| Code | Message |
|------|---------|
| 403 | You do not own this listing |
| 404 | Listing not found |

---

### DELETE /api/listings/:id
Soft-delete a listing (sets `deletedAt`). Seller must own it.

**Auth:** Required (role: `SELLER`)

**Success 200:**
```json
{ "success": true, "data": { "message": "Listing deleted successfully" } }
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | You do not own this listing |
| 404 | Listing not found |

---

### PATCH /api/listings/:id/sold-out
Mark a listing as SOLD_OUT. Seller must own it.

**Auth:** Required (role: `SELLER`)

**No body needed.**

**Success 200:** Returns updated listing with `status: "SOLD_OUT"`.

**Errors:**
| Code | Message |
|------|---------|
| 403 | You do not own this listing |
| 404 | Listing not found |

---

## 8. Orders

> All order endpoints require: `Authorization: Bearer <token>` with role `BUYER`.

### POST /api/orders
Place an order on an active listing.

**Auth:** Required (role: `BUYER`)

**Body (PURCHASE):**
```json
{
  "listingId": "uuid",
  "quantity": 1,
  "type": "PURCHASE"
}
```

**Body (DONATION — buyer donates to charity):**
```json
{
  "listingId": "uuid",
  "quantity": 1,
  "type": "DONATION",
  "charityId": "uuid"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| listingId | string (uuid) | Yes | |
| quantity | integer | Yes | Min 1 |
| type | string | Yes | `PURCHASE` or `DONATION` |
| charityId | string (uuid) | Required if type is `DONATION` | |

**What happens:**
1. Listing validated (must be ACTIVE, seller APPROVED, quantity available)
2. Order created with status `RESERVED`
3. Listing quantity decremented atomically
4. Seller receives push + in-app notification

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": 1,
    "totalPrice": 12,
    "type": "PURCHASE",
    "status": "RESERVED",
    "expiresAt": "2026-06-04T16:00:00.000Z",
    "createdAt": "2026-06-04T14:00:00.000Z",
    "listing": {
      "title": "حقيبة مفاجآت الغداء",
      "pickupStart": "2026-06-04T12:00:00.000Z",
      "pickupEnd": "2026-06-04T14:00:00.000Z",
      "seller": { "businessName": "مطعم أبو العبد", "address": "شارع فيصل" }
    }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Not enough quantity available |
| 400 | charityId is required when type is DONATION |
| 404 | Listing not found |
| 404 | Approved charity not found |
| 422 | Type must be PURCHASE or DONATION |

---

### GET /api/orders/me
Paginated list of the buyer's orders. Stale `RESERVED` orders past their pickup window are auto-cancelled on every call.

**Auth:** Required (role: `BUYER`)

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| status | string | — | `RESERVED`, `COMPLETED`, `CANCELLED` |
| page | number | 1 | |
| limit | number | 10 | Max 50 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": { "page": 1, "limit": 10, "total": 24, "totalPages": 3 }
  }
}
```

---

### PATCH /api/orders/:id/cancel
Cancel a RESERVED order. Restores the listing quantity. Seller gets notified.

**Auth:** Required (role: `BUYER`)

**No body needed.**

**Success 200:** Returns updated order with `status: "CANCELLED"`.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Only reserved orders can be cancelled |
| 404 | Order not found |

---

### PATCH /api/orders/:id/received
Buyer manually confirms pickup. Sets status to `COMPLETED`.

**Auth:** Required (role: `BUYER`)

**No body needed.**

**Side effects (non-blocking):**
- +10 points
- +15 bonus points on first-ever completed order
- CO2 incremented on user profile
- Badge check runs (first_save, loyal_buyer, eco_hero)
- Seller gets push notification

**Success 200:** Returns updated order with `status: "COMPLETED"`.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Order is not in a receivable state |
| 404 | Order not found |

---

### POST /api/orders/:id/scan
Buyer scans the listing QR code at the seller's location. Same effect as `/received`.

**Auth:** Required (role: `BUYER`)

**Body:**
```json
{ "token": "<value encoded in the QR code>" }
```

**What happens:**
1. HMAC signature verified
2. Token expiry checked (24h validity)
3. Token `listingId` matched against this order's listing
4. Order → `COMPLETED`, same points/badges/CO2/notifications as manual received

**Success 200:** Returns completed order.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Invalid QR token |
| 400 | QR token has expired |
| 400 | QR code does not match this order's listing |
| 404 | Order not found |

---

## 9. Reviews

### POST /api/reviews
Buyer submits a review for a completed order.

**Auth:** Required (role: `BUYER`)

**Body:**
```json
{
  "orderId": "uuid",
  "ratingOverall": 5,
  "ratingPickup": 4,
  "ratingQuality": 5,
  "ratingVariety": 4,
  "comment": "تجربة ممتازة، الطعام طازج"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| orderId | string (uuid) | Yes | Order must be COMPLETED and owned by buyer |
| ratingOverall | integer | Yes | 1–5 |
| ratingPickup | integer | Yes | 1–5 |
| ratingQuality | integer | Yes | 1–5 |
| ratingVariety | integer | Yes | 1–5 |
| comment | string | No | Max 500 characters |

**Side effects:** Seller's average `rating` recalculated. Seller gets notified.

**Success 201:** Returns the created review.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Order is not completed |
| 400 | You have already reviewed this order |
| 403 | This order does not belong to you |
| 404 | Order not found |
| 422 | Validation error |

---

### POST /api/reviews/charity
Charity submits a review for a CONFIRMED donation pickup.

**Auth:** Required (role: `CHARITY`)

**Body:**
```json
{
  "donationId": "uuid",
  "ratingOverall": 5,
  "ratingPickup": 4,
  "ratingQuality": 5,
  "comment": "Food was fresh and ready on time."
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| donationId | string (uuid) | Yes | Must be CONFIRMED and belong to this charity |
| ratingOverall | integer | Yes | 1–5 |
| ratingPickup | integer | Yes | 1–5 |
| ratingQuality | integer | Yes | 1–5 |
| comment | string | No | Max 500 characters |

**Success 201:** Returns the created review.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Donation is not confirmed |
| 409 | This donation has already been reviewed |
| 404 | Donation not found |

---

### GET /api/reviews/seller/:id
Public. Paginated reviews for a seller.

**Auth:** None

**Query params:**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 10 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "ratingOverall": 5,
        "ratingPickup": 4,
        "ratingQuality": 5,
        "ratingVariety": 4,
        "comment": "تجربة ممتازة",
        "reply": null,
        "createdAt": "2026-06-04T12:00:00.000Z",
        "buyer": { "name": "Layla" }
      }
    ],
    "averageRating": 4.5,
    "pagination": { "page": 1, "limit": 10, "total": 18, "totalPages": 2 }
  }
}
```

---

### POST /api/reviews/:id/reply
Seller replies to a specific review (once only).

**Auth:** Required (role: `SELLER`)

**Body:**
```json
{ "reply": "شكراً لك على تقييمك الإيجابي!" }
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | This review is not for your business |
| 409 | You have already replied to this review |
| 404 | Review not found |
| 422 | Validation error |

---

## 10. Favorites

> All favorites endpoints require: `Authorization: Bearer <token>` (any role).

### GET /api/favorites/me
All sellers the user has favorited, each with their active listings.

**Auth:** Required (any role)

**Success 200:**
```json
{
  "success": true,
  "data": [
    {
      "sellerId": "uuid",
      "seller": {
        "businessName": "مطعم أبو العبد",
        "rating": 4.3,
        "listings": [ ... ]
      }
    }
  ]
}
```

---

### POST /api/favorites
Add a seller to favorites.

**Auth:** Required (any role)

**Body:**
```json
{ "sellerId": "uuid" }
```

**Success 201:** Returns the favorite record.

**Errors:**
| Code | Message |
|------|---------|
| 409 | Already in favorites |
| 422 | Validation error |

---

### DELETE /api/favorites/:sellerId
Remove a seller from favorites.

**Auth:** Required (any role)

**URL param:** `:sellerId` = seller UUID (not user UUID)

**Success 200:**
```json
{ "success": true, "data": { "message": "Removed from favorites" } }
```

**Errors:**
| Code | Message |
|------|---------|
| 404 | Favorite not found |

---

## 11. Donations (Seller → Charity)

### POST /api/donations
Seller donates a listing directly to a chosen charity.

**Auth:** Required (role: `SELLER`, status: `APPROVED`)

**Body:**
```json
{
  "listingId": "uuid",
  "charityId": "uuid",
  "quantity": 3,
  "pickupStart": "2026-06-04T15:00:00.000Z",
  "pickupEnd": "2026-06-04T17:00:00.000Z",
  "purposeNote": "خبز طازج من اليوم"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| listingId | string (uuid) | Yes | Must be ACTIVE and owned by this seller |
| charityId | string (uuid) | Yes | Must be APPROVED charity |
| quantity | integer | Yes | Min 1, must not exceed listing quantity |
| pickupStart | ISO datetime | No | |
| pickupEnd | ISO datetime | No | |
| purposeNote | string | No | Max 500 characters |

**Side effects:** Selected charity notified. Basket-matched charities also notified automatically. Seller gets +20 points.

**Success 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "quantity": 3,
    "charity": { "orgName": "جمعية إطعام نابلس" },
    "seller": { "businessName": "مطعم أبو العبد" },
    "listing": { "title": "حقيبة مفاجآت الغداء" }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | Not enough quantity available |
| 403 | You can only donate from your own listings |
| 403 | Only approved sellers can create donations |
| 404 | Listing not found |
| 404 | Approved charity not found |
| 422 | Validation error |

---

### GET /api/donations/me
- SELLER → sees donations they created
- CHARITY → sees donations destined for them

**Auth:** Required (role: `SELLER` or `CHARITY`)

**Query params:**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 10 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "donations": [ ... ],
    "pagination": { "page": 1, "limit": 10, "total": 8, "totalPages": 1 }
  }
}
```

---

### PATCH /api/donations/:id/pickup
Charity marks a donation as physically picked up. Status: `PENDING` → `PICKED_UP`.

**Auth:** Required (role: `CHARITY`)

**No body needed.**

**Success 200:** Returns updated donation with `status: "PICKED_UP"`.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Only pending donations can be marked as picked up |
| 404 | Donation not found |

---

### PATCH /api/donations/:id/confirm
Charity confirms receipt with optional proof photo. Status: `PICKED_UP` → `CONFIRMED`.

**Auth:** Required (role: `CHARITY`)

**Body:**
```json
{ "proofPhotoUrl": "https://supabase.co/storage/.../proof.jpg" }
```

| Field | Type | Required |
|-------|------|----------|
| proofPhotoUrl | string (URL) | No |

**Side effects:** Seller receives "DONATION_CONFIRMED" notification.

**Success 200:** Returns updated donation with `status: "CONFIRMED"`.

**Errors:**
| Code | Message |
|------|---------|
| 400 | Only picked-up donations can be confirmed |
| 404 | Donation not found |

---

## 12. Notifications

### GET /api/notifications/me
Paginated list of the user's notifications + unread count.

**Auth:** Required (any role)

**Query params:**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 20 |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "ORDER_RESERVED",
        "title": "طلب جديد!",
        "body": "لديك طلب جديد على حقيبة مفاجآت الغداء.",
        "isRead": false,
        "createdAt": "2026-06-04T12:00:00.000Z"
      }
    ],
    "unreadCount": 3,
    "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
  }
}
```

**Notification types:**
| Type | Who receives it | Trigger |
|------|-----------------|---------|
| `ORDER_RESERVED` | Seller | Buyer places order |
| `ORDER_CANCELLED` | Seller | Buyer cancels order |
| `ORDER_RECEIVED` | Seller | Buyer confirms pickup |
| `DONATION_INCOMING` | Charity | Seller creates donation OR basket match cron fires |
| `DONATION_CONFIRMED` | Seller | Charity confirms donation |
| `NEW_REVIEW` | Seller | Buyer submits review |
| `SELLER_APPROVED` | Seller | Admin approves |
| `SELLER_REJECTED` | Seller | Admin rejects |
| `CHARITY_APPROVED` | Charity | Admin approves |
| `CHARITY_REJECTED` | Charity | Admin rejects |
| `NEW_LISTING_FROM_FAVORITE` | Buyer | Seller creates new listing (fires to favorites + recent buyers) |
| `LISTING_EXPIRING_SOON` | Buyer | Listing expires within 2h — hourly cron |
| `WASTE_PATTERN_ALERT` | Seller | Sunday cron: day+hour slot has >70% unsold rate |
| `DEAL_WINDOW_TIP` | Buyer | Sunday cron: tips buyer about seller's upcoming deal window |
| `ACCOUNT_BLOCKED` | Buyer | Account blocked after 5 cancellations |
| `LISTING_REPORTED` | Admin | A buyer reported a listing |
| `LISTING_REMOVED` | Seller | Admin removed the listing via a report action |

---

### PATCH /api/notifications/me/read-all
Mark all of this user's notifications as read.

**Auth:** Required (any role)

**Success 200:**
```json
{ "success": true, "data": { "message": "All notifications marked as read" } }
```

---

## 13. Points

### GET /api/points/me
Current points balance.

**Auth:** Required (any role)

**Success 200:**
```json
{ "success": true, "data": { "id": "uuid", "points": 75 } }
```

**Points table:**
| Action | Points |
|--------|--------|
| Order received (manual or QR) | +10 |
| First-ever completed order | +15 (one-time bonus) |
| Review submitted | +5 |
| Seller donation created | +20 |
| Order cancelled | -5 (floors at 0) |

**Badges:**
| Badge | Trigger |
|-------|---------|
| `first_save` | First completed order |
| `loyal_buyer_5` | 5 completed orders |
| `loyal_buyer_10` | 10 completed orders |
| `eco_hero_10kg` | 10 kg CO2 saved |
| `eco_champion_50kg` | 50 kg CO2 saved |
| `community_donor` | First DONATION-type order completed |

---

## 14. Chatbot

### POST /api/chatbot/message
Send a text message to the LeftO AI assistant. Responds in Arabic if message is in Arabic, English otherwise.

**Auth:** Required (any role)

**Body:**
```json
{
  "message": "ما المتاح الآن قريب مني؟",
  "lat": 32.2211,
  "lng": 35.2544
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| message | string | Yes | 1–1000 characters |
| lat | number | No | Enables distance-aware replies |
| lng | number | No | |

**Success 200:**
```json
{ "success": true, "data": { "reply": "يوجد مطعم أبو العبد على بعد 0.8 كم..." } }
```

**Errors:**
| Code | Message |
|------|---------|
| 503 | المساعد مشغول حالياً، يرجى المحاولة بعد لحظات. / The assistant is busy right now, please try again in a moment. |
| 422 | Validation error |

> If `GROQ_API_KEY` is missing, returns a friendly mock reply — server won't crash.

---

### POST /api/chatbot/voice
Voice message: audio → Whisper transcription → AI reply.

**Auth:** Required (any role)

**Body (form-data):**
| Key | Type | Required | Notes |
|-----|------|----------|-------|
| audio | File | Yes | `.webm`, `.mp4`, `.mp3`, `.wav`, `.ogg`, `.m4a` — max 25 MB |
| lat | Text | No | User latitude |
| lng | Text | No | User longitude |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "transcript": "ايش في قريب مني هلق؟",
    "reply": "في مطعم البيت على بعد 0.8 كم..."
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | No audio file provided |
| 400 | Could not transcribe audio — please try again |
| 503 | Voice feature is not configured on this server |

> Uses **Groq Whisper** (`whisper-large-v3-turbo`) — same `GROQ_API_KEY` as the chatbot. No separate API key needed.

---

## 15. Document Upload

### POST /api/documents/upload
Upload a PDF, JPEG, or PNG to Supabase Storage. Call this before registering as a seller or charity, then pass the returned URL in `documentUrls`.

**Auth:** Required (any role)

**Body (form-data):**
| Key | Type | Required | Notes |
|-----|------|----------|-------|
| file | File | Yes | PDF, JPEG, or PNG — max 5 MB |
| documentType | Text | Yes | `TRADE_LICENSE`, `HEALTH_CERTIFICATE`, or `CHARITY_REGISTRATION` |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "documentType": "TRADE_LICENSE",
    "fileUrl": "https://supabase.co/storage/.../trade-license.pdf",
    "status": "PENDING"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | File too large (max 5MB) |
| 400 | Invalid file type. Only PDF, JPEG, and PNG are allowed |
| 422 | documentType must be TRADE_LICENSE, HEALTH_CERTIFICATE, or CHARITY_REGISTRATION |

---

## 16. App Config

### GET /api/app/config
Public. FE should read this on startup to check if Ramadan mode is active.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "id": "singleton",
    "isRamadanSeason": false,
    "maghribTime": null,
    "isIftarWindow": false,
    "updatedAt": "2026-06-04T00:00:00.000Z"
  }
}
```

When `isRamadanSeason: true`:
- `maghribTime` is today's Maghrib time in Nablus (ISO string)
- `isIftarWindow: true` during the 2 hours before Maghrib

---

## 17. Stats & Community (Phase C)

### GET /api/stats/leaderboard
Public. Community leaderboard — top buyers by CO2, top sellers by meals donated.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "topBuyers": [
      { "rank": 1, "name": "Layla", "totalCo2SavedKg": 14.2 },
      { "rank": 2, "name": "Mohammed", "totalCo2SavedKg": 9.8 }
    ],
    "topSellers": [
      { "rank": 1, "businessName": "مطعم أبو العبد", "mealsSaved": 48 },
      { "rank": 2, "businessName": "مخبز الحاج خليل", "mealsSaved": 31 }
    ]
  }
}
```

---

### GET /api/stats/heatmap
Public. Sellers with active listings + their geo coordinates. Use to render a map.

**Auth:** None

**Success 200:**
```json
{
  "success": true,
  "data": {
    "points": [
      {
        "sellerId": "uuid",
        "businessName": "مطعم أبو العبد",
        "latitude": 32.2211,
        "longitude": 35.2544,
        "activeListings": 3
      }
    ]
  }
}
```

---

### GET /api/stats/charities/:charityId/trust
Public. Trust score for a specific charity (0–100).

**Auth:** None

**URL param:** `:charityId` = charity UUID

**Success 200:**
```json
{
  "success": true,
  "data": {
    "charityId": "uuid",
    "trustScore": 82,
    "trustBreakdown": {
      "volume": 22,
      "proofRate": 35,
      "avgRating": 18,
      "responseSpeed": 7
    }
  }
}
```

**Score breakdown:**
| Component | Max | Based on |
|-----------|-----|----------|
| volume | 25 | Number of confirmed donations |
| proofRate | 35 | % of donations with proof photo |
| avgRating | 30 | Average charity review rating |
| responseSpeed | 10 | Speed of marking donations as picked up |

---

### GET /api/stats/my-analytics
Seller's personal waste analytics dashboard.

**Auth:** Required (role: `SELLER`)

**Success 200:**
```json
{
  "success": true,
  "data": {
    "totalListings": 24,
    "soldListings": 18,
    "sellThroughRate": 0.75,
    "totalCo2SavedKg": 14.2,
    "totalRevenue": 1840,
    "peakHour": 14,
    "topListing": {
      "title": "حقيبة مفاجآت الغداء",
      "orderCount": 12
    }
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Forbidden |
| 404 | Seller profile not found |

---

## 18. Admin

> All admin endpoints require: `Authorization: Bearer <adminToken>` (role: `ADMIN`).
> Non-admin users receive **403 Forbidden**.

### PATCH /api/admin/config
Toggle platform-wide feature flags.

**Body:**
```json
{ "isRamadanSeason": true }
```

**Success 200:** Returns updated config object.

---

### GET /api/admin/stats
Platform-wide statistics with impact data.

**Success 200:**
```json
{
  "success": true,
  "data": {
    "users": { "total": 120, "buyers": 80, "sellers": 30, "charities": 10 },
    "listings": { "active": 18, "soldOut": 45, "expired": 12 },
    "orders": { "total": 210, "completed": 180, "cancelled": 30 },
    "donations": { "total": 34, "confirmed": 28 },
    "impact": {
      "totalCo2SavedKg": 87,
      "totalItemsSaved": 340
    }
  }
}
```

---

### GET /api/admin/sellers/pending
All sellers with status `PENDING`.

**Success 200:** Array of seller objects with user info and documents.

---

### PATCH /api/admin/sellers/:id/approve
Approve a seller. Sets `status: APPROVED`, `verifiedBadge: true`. Seller gets notified.

**No body needed.**

**Errors:**
| Code | Message |
|------|---------|
| 400 | Seller is not in PENDING status |
| 404 | Seller not found |

---

### PATCH /api/admin/sellers/:id/reject
Reject a seller. Seller gets notified.

**Body (optional):**
```json
{ "reason": "Documents are not valid" }
```

**Errors:**
| Code | Message |
|------|---------|
| 404 | Seller not found |

---

### GET /api/admin/charities/pending
All charities with status `PENDING`.

---

### PATCH /api/admin/charities/:id/approve
Approve a charity. Sets `status: APPROVED`, `verifiedBadge: true`. Charity gets notified.

**No body needed.**

**Errors:**
| Code | Message |
|------|---------|
| 400 | Charity is not in PENDING status |
| 404 | Charity not found |

---

### PATCH /api/admin/charities/:id/reject
Reject a charity. Charity gets notified.

**Body (optional):**
```json
{ "reason": "Documents are not valid" }
```

---

### GET /api/admin/users
Paginated list of all users with smart filters.

**Query params:**
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | |
| limit | number | 10 | |
| role | string | — | `BUYER` · `SELLER` · `CHARITY` · `ADMIN` |
| isBlocked | boolean | — | `true` or `false` |
| search | string | — | Searches name, phone, email — case-insensitive |

---

### GET /api/admin/users/:id
Single user with their seller/charity profile and uploaded documents.

**Errors:**
| Code | Message |
|------|---------|
| 404 | User not found |

---

### PATCH /api/admin/users/:id/unblock
Unblock a buyer — resets `isBlocked = false` and `cancellationCount = 0`.

**Auth:** Admin

**No body needed.**

**Success 200:**
```json
{ "id": "uuid", "name": "Ahmad", "isBlocked": false, "cancellationCount": 0 }
```

---

### DELETE /api/admin/users/:id
Soft-delete a user (sets `deletedAt`).

**Auth:** Admin

**Success 200:** `{ "id": "uuid", "name": "...", "deletedAt": "..." }`

---

### DELETE /api/admin/listings/:id
Soft-delete a listing and mark it `EXPIRED`.

**Auth:** Admin

**Success 200:** `{ "id": "uuid", "title": "...", "status": "EXPIRED", "deletedAt": "..." }`

---

### GET /api/admin/stats/charts
6-month data for charting. Ready for recharts / chart.js.

**Auth:** Admin

**Success 200:**
```json
{
  "success": true,
  "data": {
    "charts": [
      { "month": "2025-12", "completedOrders": 45, "listingsCreated": 120, "newUsers": 18 },
      { "month": "2026-01", "completedOrders": 67, "listingsCreated": 180, "newUsers": 34 }
    ]
  }
}
```

---

### GET /api/admin/stats/best-rated
Top seller by average rating + top charity by confirmed donation count.

**Auth:** Admin

**Success 200:**
```json
{
  "success": true,
  "data": {
    "bestSeller": { "id": "uuid", "businessName": "مطعم أبو العبد", "rating": 4.9, "address": "نابلس" },
    "bestCharity": { "id": "uuid", "orgName": "جمعية إطعام نابلس", "region": "نابلس", "_count": { "donations": 47 } }
  }
}
```

---

## 19. AI Features

All AI listing endpoints require a **Seller token** unless stated otherwise.

### POST /api/listings/ai/suggest-allergens
Detect allergens from an Arabic food title/description using Groq LLM.

**Auth:** Required (role: `SELLER`)

**Body:**
```json
{ "title": "كنافة بالجبن والقشطة", "description": "محضرة بالسمن والجوز والعسل" }
```

| Field | Required | Rules |
|-------|----------|-------|
| title | Yes | 2–200 characters |
| description | No | Max 500 characters |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "allergens": ["gluten", "dairy", "nuts"],
    "confidence": "high"
  }
}
```

---

### POST /api/listings/ai/score-title
Score a listing title 0–100 and get Arabic feedback + optional improved title.

**Auth:** Required (role: `SELLER`)

**Body:**
```json
{ "title": "أكل", "category": "MEALS" }
```

**Success 200:**
```json
{
  "success": true,
  "data": {
    "score": 22,
    "feedback": "العنوان قصير جداً ولا يوضح المحتوى — أضف اسم الطبق",
    "suggestedTitle": "وجبة مقلوبة دجاج لشخصين مع خبز — خصم 50%"
  }
}
```

Score interpretation: 0–40 = weak · 41–69 = acceptable · 70–100 = excellent

---

### GET /api/listings/ai/price-suggestion?category=X&originalPrice=Y
Data-driven price recommendation — queries 30 days of real platform data, no external AI.

**Auth:** Required (role: `SELLER`)

**Query params:**
| Param | Required | Notes |
|-------|----------|-------|
| category | Yes | e.g. `MEALS`, `BREAD_AND_PASTRIES` |
| originalPrice | Yes | Positive number |

**Success 200:**
```json
{
  "success": true,
  "data": {
    "suggestedPrice": 9,
    "discountPct": 69,
    "categoryAvgDiscount": 59,
    "sellerSellThrough": 0,
    "reasoning": "معدل بيعك (0%) أقل من المتوسط — جرّب خصماً أعمق لزيادة فرص البيع"
  }
}
```

---

### GET /api/listings/ai/my-performance
Seller's own performance score with full breakdown.

**Auth:** Required (role: `SELLER`)

**Success 200:**
```json
{
  "success": true,
  "data": {
    "performanceScore": 84,
    "breakdown": { "sellThrough": 25, "rating": 32, "frequency": 17, "verified": 10 },
    "stats": { "totalListings": 42, "completedOrders": 36, "sellThroughRate": 86, "avgRating": 4.6, "listingsPerWeek": 3.4 },
    "weeklyInsight": "💪 أقوى نقطة: طعام لذيذ | ⚠️ أكثر شكوى: الانتظار",
    "weeklyInsightUpdatedAt": "2026-06-02T08:00:00.000Z"
  }
}
```

`weeklyInsight` is updated every Monday 8am by the sentiment cron. `null` if seller has fewer than 5 reviews.

---

### GET /api/listings/ai/performance/:sellerId
Public seller performance score.

**Auth:** None

**Success 200:** Same shape as `my-performance` above, without the private `stats` fields.

---

### POST /api/listings/ai/analyze-image
Upload a food photo — Gemini AI returns Arabic title, category, allergens, description.

**Auth:** Required (role: `SELLER`)

**Body:** `multipart/form-data` — field name: `photo` (JPEG or PNG, max 5MB)

**Success 200:**
```json
{
  "success": true,
  "data": {
    "suggestedCategory": "MEALS",
    "suggestedTitle": "وجبة مشاوي مشكلة مع الخبز والسلطة",
    "suggestedAllergens": ["gluten"],
    "description": "طبق مشاوي متنوع يشمل شيش طاووق ولحم مشوي مع خبز عربي وسلطة طازجة",
    "confidence": "high"
  }
}
```

**Errors:**
| Code | Message |
|------|---------|
| 400 | No image file provided |
| 503 | Image analysis service unavailable (GEMINI_API_KEY missing or quota exceeded) |

---

## 20. Report System

### POST /api/reports/listings/:listingId
Buyer reports a listing.

**Auth:** Required (role: `BUYER`)

**URL param:** `:listingId` = listing UUID

**Body:**
```json
{ "reason": "WRONG_PRICE", "details": "السعر المذكور ضعف الحقيقي" }
```

**Reason values:** `SPOILED_FOOD` · `WRONG_DESCRIPTION` · `WRONG_PRICE` · `INAPPROPRIATE_CONTENT` · `OTHER`

**Success 201:**
```json
{ "success": true, "data": { "id": "uuid", "reason": "WRONG_PRICE", "status": "PENDING", "createdAt": "..." } }
```

**Errors:**
| Code | Message |
|------|---------|
| 403 | Only BUYER role can report listings |
| 404 | Listing not found |
| 409 | You have already reported this listing |

**Side effect:** All admins receive an in-app `LISTING_REPORTED` notification.

---

### GET /api/reports
Admin view of the report queue.

**Auth:** Required (role: `ADMIN`)

**Query params:** `status` (PENDING · REVIEWED · DISMISSED — omit for all) · `page` · `limit`

**Success 200:**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": "uuid", "reason": "WRONG_PRICE", "details": "...", "status": "PENDING",
        "createdAt": "2026-06-05T10:00:00.000Z",
        "listing": { "id": "uuid", "title": "كنافة نابلسية", "discountedPrice": 14, "seller": { "businessName": "حلويات قناعة" } },
        "buyer": { "id": "uuid", "name": "أحمد", "phone": "0591234567" }
      }
    ],
    "total": 5, "page": 1, "totalPages": 1
  }
}
```

---

### PATCH /api/reports/:reportId/review
Mark report reviewed or dismissed (no action on listing).

**Auth:** Required (role: `ADMIN`)

**Body:**
```json
{ "status": "DISMISSED", "adminNote": "لا توجد مشكلة" }
```

| Field | Values |
|-------|--------|
| status | `REVIEWED` or `DISMISSED` |
| adminNote | Optional string |

**Success 200:** Updated report object.

---

### DELETE /api/reports/:reportId/listing
Remove the reported listing + mark report as REVIEWED in one action.

**Auth:** Required (role: `ADMIN`)

**No body needed.**

**Side effect:** Seller receives `LISTING_REMOVED` push + in-app notification.

**Success 200:**
```json
{ "success": true, "data": { "message": "Listing removed and report marked as reviewed" } }
```

---

## 21. Complete Endpoint Index

| Method | Path | Auth | Role |
|--------|------|------|------|
| POST | /api/auth/send-otp | None | — |
| POST | /api/auth/verify-otp | None | — |
| POST | /api/auth/register | None | — |
| POST | /api/auth/login | None | — |
| POST | /api/auth/refresh | None | — |
| POST | /api/auth/logout | None | — |
| POST | /api/auth/forgot-password | None | — |
| POST | /api/auth/reset-password | None | — |
| GET | /api/auth/me | Required | Any |
| PUT | /api/auth/fcm-token | Required | Any |
| GET | /api/users/me | Required | Any |
| PATCH | /api/users/me | Required | Any |
| POST | /api/sellers/register | Required | SELLER |
| GET | /api/sellers/me | Required | SELLER |
| PATCH | /api/sellers/me | Required | SELLER |
| GET | /api/sellers/me/orders | Required | SELLER |
| GET | /api/sellers/karam | None | — |
| PATCH | /api/sellers/me/karam | Required | SELLER |
| POST | /api/sellers/me/karam/sponsor | Required | SELLER |
| POST | /api/sellers/me/karam/claim | Required | SELLER |
| GET | /api/sellers/:id | None | — |
| GET | /api/sellers/:id/karam | None | — |
| POST | /api/sellers/:id/karam/sponsor | Required | BUYER |
| POST | /api/charities/register | Required | CHARITY |
| GET | /api/charities | None | — |
| GET | /api/charities/:id | None | — |
| GET | /api/charities/:id/basket | None | — |
| PUT | /api/charities/me/basket | Required | CHARITY |
| GET | /api/charities/me/basket | Required | CHARITY |
| GET | /api/listings | None | — |
| GET | /api/listings/search | None | — |
| GET | /api/listings/recommended | Required | Any |
| GET | /api/listings/:id | None | — |
| POST | /api/listings | Required | SELLER |
| PUT | /api/listings/:id | Required | SELLER |
| DELETE | /api/listings/:id | Required | SELLER |
| PATCH | /api/listings/:id/sold-out | Required | SELLER |
| POST | /api/orders | Required | BUYER |
| GET | /api/orders/me | Required | BUYER |
| PATCH | /api/orders/:id/cancel | Required | BUYER |
| PATCH | /api/orders/:id/received | Required | BUYER |
| POST | /api/orders/:id/scan | Required | BUYER |
| POST | /api/reviews | Required | BUYER |
| POST | /api/reviews/charity | Required | CHARITY |
| GET | /api/reviews/seller/:id | None | — |
| POST | /api/reviews/:id/reply | Required | SELLER |
| GET | /api/favorites/me | Required | Any |
| POST | /api/favorites | Required | Any |
| DELETE | /api/favorites/:sellerId | Required | Any |
| POST | /api/donations | Required | SELLER |
| GET | /api/donations/me | Required | SELLER / CHARITY |
| PATCH | /api/donations/:id/pickup | Required | CHARITY |
| PATCH | /api/donations/:id/confirm | Required | CHARITY |
| GET | /api/notifications/me | Required | Any |
| PATCH | /api/notifications/me/read-all | Required | Any |
| GET | /api/points/me | Required | Any |
| POST | /api/chatbot/message | Required | Any |
| POST | /api/chatbot/voice | Required | Any |
| POST | /api/documents/upload | Required | Any |
| GET | /api/app/config | None | — |
| GET | /api/stats/leaderboard | None | — |
| GET | /api/stats/heatmap | None | — |
| GET | /api/stats/charities/:charityId/trust | None | — |
| GET | /api/stats/my-analytics | Required | SELLER |
| PATCH | /api/admin/config | Required | ADMIN |
| GET | /api/admin/stats | Required | ADMIN |
| GET | /api/admin/sellers/pending | Required | ADMIN |
| PATCH | /api/admin/sellers/:id/approve | Required | ADMIN |
| PATCH | /api/admin/sellers/:id/reject | Required | ADMIN |
| GET | /api/admin/charities/pending | Required | ADMIN |
| PATCH | /api/admin/charities/:id/approve | Required | ADMIN |
| PATCH | /api/admin/charities/:id/reject | Required | ADMIN |
| GET | /api/admin/users | Required | ADMIN |
| GET | /api/admin/users/:id | Required | ADMIN |
| PATCH | /api/admin/users/:id/unblock | Required | ADMIN |
| DELETE | /api/admin/users/:id | Required | ADMIN |
| DELETE | /api/admin/listings/:id | Required | ADMIN |
| GET | /api/admin/stats/charts | Required | ADMIN |
| GET | /api/admin/stats/best-rated | Required | ADMIN |
| GET | /api/users/me/impact-certificate | Required | Any |
| GET | /api/stats/monthly-winner | None | — |
| POST | /api/listings/ai/suggest-allergens | Required | SELLER |
| POST | /api/listings/ai/score-title | Required | SELLER |
| GET | /api/listings/ai/price-suggestion | Required | SELLER |
| GET | /api/listings/ai/my-performance | Required | SELLER |
| GET | /api/listings/ai/performance/:id | None | — |
| POST | /api/listings/ai/analyze-image | Required | SELLER |
| POST | /api/reports/listings/:listingId | Required | BUYER |
| GET | /api/reports | Required | ADMIN |
| PATCH | /api/reports/:reportId/review | Required | ADMIN |
| DELETE | /api/reports/:reportId/listing | Required | ADMIN |
| POST | /api/payments/webhook | Stripe only | — |

---

*LeftO API Reference | Total: 90 endpoints | Last updated: June 2026*
