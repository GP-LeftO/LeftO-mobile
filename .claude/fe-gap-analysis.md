# Frontend Gap Analysis — LeftO Mobile
> Session note: what's done vs. what's missing based on backend checklist audit.
> Date: 2026-06-02

---

## What's Done ✅

| Area | Status |
|---|---|
| Onboarding (Splash, Language, Intro) | ✅ |
| Auth: OTP send/verify, Register, Login, Logout | ✅ |
| Auto token refresh on 401 | ✅ |
| Role routing after login (pending/rejected/approved) | ✅ |
| Buyer: Home, Recommended, Category filter | ✅ |
| Buyer: Search with all filters + map view | ✅ |
| Buyer: Store details + reviews display | ✅ |
| Buyer: Reserve (PURCHASE order) + Impact celebration | ✅ |
| Buyer: Donate order + charity selector | ✅ |
| Buyer: Orders history + cancel + confirm received | ✅ |
| Buyer: Favorites (add/remove/list) | ✅ |
| Buyer: Profile (name, email, prefs, badges, CO2, points) | ✅ |
| Buyer: Submit review (service exists, wired in ProfileScreen) | ✅ |
| Buyer: Chatbot text + voice | ✅ |
| Buyer: Near Me | ✅ |
| Seller: Registration + document upload | ✅ |
| Seller: Pending / Rejected screens | ✅ |
| Seller: Dashboard overview + view listings + mark sold-out | ✅ |
| Charity: Registration + document upload | ✅ |

---

## What's Missing / Late ❌

### 1. Auth — Forgot & Reset Password
- No `ForgotPasswordScreen` or `ResetPasswordScreen`
- No calls to `POST /api/auth/forgot-password` or `POST /api/auth/reset-password` anywhere
- No FCM token save on login (`PUT /api/auth/fcm-token`) or on logout (`fcmToken: null`)

### 2. Buyer — QR Code Pickup Flow
- No QR code scanner screen (buyer scans seller's QR → `POST /api/orders/:id/scan { token }`)
- No display of `qrCodeUrl` from the listing (buyer should be able to show their QR to the seller)

### 3. Buyer — Notifications (entirely missing)
- No notification screen
- No notification service/hook
- No unread badge on the tab bar
- No `PATCH /api/notifications/me/read-all`
- No FCM push notification setup (Firebase SDK + `PUT /api/auth/fcm-token`)

### 4. Seller — Listing CRUD (partial)
- View listings ✅, Mark sold-out ✅
- **No "Create Listing" form** (`POST /api/listings`)
- **No "Edit Listing" form** (`PUT /api/listings/:id`)
- **No "Delete Listing"** (`DELETE /api/listings/:id`)

### 5. Seller — Settings & Orders Tab
- Settings tab is a "Coming Soon" placeholder — no profile update form (`PATCH /api/sellers/me`)
- No seller orders view (`GET /api/sellers/me/orders`)

### 6. Seller — Donations
- No flow for a seller to donate surplus food to a charity (`POST /api/donations`)
- No donations history for sellers (`GET /api/donations/me` as SELLER)

### 7. Charity Dashboard — Fully Placeholder
- The entire `CharityDashboardScreen` is a "Coming Soon" card with dummy buttons
- Missing: incoming donations list (`GET /api/donations/me` as CHARITY)
- Missing: Mark donation as picked up (`PATCH /api/donations/:id/pickup`)
- Missing: Upload proof photo + confirm (`PATCH /api/donations/:id/confirm`)

### 8. Avatar Customization
- Profile screen exists but avatar style/color editing is disabled
- `PATCH /api/users/me { avatarStyle, avatarColor }` is not wired up

---

## Priority Order

| Priority | Feature | Why |
|---|---|---|
| 🔴 High | **Notifications screen + FCM setup** | Backend ready, affects all roles |
| 🔴 High | **Seller: Create / Edit / Delete listing** | Sellers can't add food — core seller flow is broken |
| 🔴 High | **Charity dashboard** (donations list, pickup, proof) | Entire charity role is non-functional |
| 🟡 Medium | **Forgot / Reset password screens** | Auth gap — users with forgotten passwords are stuck |
| 🟡 Medium | **Seller settings + orders tab** | Seller can't update profile or see order history |
| 🟡 Medium | **Seller donations flow** | Surplus donation feature missing on seller side |
| 🟢 Low | **QR code scan / display** | Pickup can still be confirmed manually via "Received" |
| 🟢 Low | **Avatar customization** | Cosmetic only |
