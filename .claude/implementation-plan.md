# LeftO Mobile — Implementation Plan
> All missing features, ordered by priority. Each task has exact files, API calls, and steps.
> Date: 2026-06-02

---

## TASK 1 — Seller: Create / Edit / Delete Listing 🔴

**Why first:** Sellers currently can't add any food. The core seller value prop is broken.

### Files to create
- `src/screens/seller/listings/CreateListingScreen.tsx`
- `src/screens/seller/listings/EditListingScreen.tsx`
- `src/hooks/seller/useListingForm.ts`
- `src/services/seller/listing.service.ts`

### Files to modify
- `src/screens/seller/SellerDashboardScreen.tsx` — add "+" FAB button on listings tab, add delete swipe/button per listing card, wire "Edit" tap

### API calls
```
POST   /api/listings           — create
PUT    /api/listings/:id       — edit
DELETE /api/listings/:id       — delete
PATCH  /api/listings/:id/sold-out — already done ✅
```

### Form fields (both create and edit)
| Field | Type | Notes |
|---|---|---|
| `title` | TextInput | required |
| `type` | Picker | `MEAL_BAG` or `SPECIFIC_PARCEL` |
| `category` | Picker | `MEALS`, `BREAD_AND_PASTRIES`, `GROCERIES`, `MIXED` |
| `originalPrice` | NumberInput | required |
| `discountedPrice` | NumberInput | required, must be < originalPrice |
| `quantity` | NumberInput | required |
| `pickupStart` | TimePicker | HH:MM string |
| `pickupEnd` | TimePicker | HH:MM string, must be after start |
| `freshnessBadge` | Picker | `eat_today`, `fresh_tonight`, `good_1_2_days` |
| `allergenNote` | TextInput | optional, multiline |
| `photoUrl` | ImagePicker | optional |

### Hook: `useListingForm.ts`
```ts
// state: formData, loading, errors
// functions: submit() → POST or PUT, deleteListing(id) → DELETE
// validation: price logic, required fields
```

### Nav wiring in App.tsx
- Add `"seller-create-listing"` and `"seller-edit-listing"` to `AppStep`
- Pass `listingToEdit` param when navigating to edit
- After create/edit success → go back to `"seller-dashboard"`

### UX details
- Delete: show `Alert.alert` confirmation before `DELETE`
- Edit: pre-populate all form fields from existing listing data
- Create: show success toast, return to listings tab
- All form inputs must support RTL

---

## TASK 2 — Seller: Settings Tab (Update Profile + Orders View) 🟡

**Why:** The Settings tab is an empty placeholder and sellers can't update their info.

### Files to create
- `src/screens/seller/SellerOrdersScreen.tsx`
- `src/hooks/seller/useSellerOrders.ts`

### Files to modify
- `src/screens/seller/SellerDashboardScreen.tsx`
  - Replace placeholder Settings tab with real edit form
  - Add Orders tab (4th tab: overview / listings / orders / settings)
  - Or keep 3 tabs but put orders inside overview

### API calls
```
PATCH  /api/sellers/me                      — update profile
GET    /api/sellers/me/orders?page=&limit=  — seller's order list
```

### Settings tab form fields
| Field | Type |
|---|---|
| `businessName` | TextInput |
| `description` | TextInput multiline |
| `contactInfo.phone` | TextInput |
| `contactInfo.website` | TextInput |
| `contactInfo.socialMedia` | TextInput |
| `location.address` | TextInput |

### Orders tab
- Show paginated list of orders using `SellerOrderCard` component
- Order shows: buyer name (or anonymous), listing title, status, pickup time
- Statuses: `RESERVED` (orange), `COMPLETED` (green), `CANCELLED` (gray)
- Pull-to-refresh

---

## TASK 3 — Seller: Donate Surplus Flow 🟡

**Why:** Sellers can donate unsold food directly to charities — this whole feature is missing.

### Files to create
- `src/screens/seller/donations/SellerDonateSurplusScreen.tsx`
- `src/screens/seller/donations/SellerDonationsHistoryScreen.tsx`
- `src/hooks/seller/useSellerDonations.ts`
- `src/services/seller/donation.service.ts`

### Files to modify
- `src/screens/seller/SellerDashboardScreen.tsx` — add "Donate Surplus" button on listings tab per listing card, add Donations tab or section in overview

### API calls
```
POST  /api/donations { listingId, charityId, quantity, pickupStart, pickupEnd }  — create donation
GET   /api/donations/me?page=&limit=                                              — history (as SELLER)
GET   /api/charities                                                              — pick charity
```

### Donate Surplus flow (step-by-step)
1. Seller taps "Donate" on a listing card
2. Shows `SellerDonateSurplusScreen`:
   - Quantity input (default: remaining quantity)
   - Pickup window (pickupStart / pickupEnd time pickers)
   - Charity picker (calls `GET /api/charities`)
3. Confirm → `POST /api/donations`
4. Success toast → back to dashboard

### Donations History tab
- List of past donations with status badges
- Statuses: `PENDING` → `PICKED_UP` → `CONFIRMED`
- Show charity name, item, quantity, date

---

## TASK 4 — Charity Dashboard (Full Implementation) 🔴

**Why:** The charity role is completely non-functional — everything is "Coming Soon".

### Files to create
- `src/hooks/charity/useCharityDonations.ts`
- `src/services/charity/charity.service.ts`
- `src/components/charity/DonationIncomingCard.tsx`
- `src/components/charity/ProofUploadModal.tsx`

### Files to modify
- `src/screens/charity/CharityDashboardScreen.tsx` — full rewrite, replace placeholder with real data

### API calls
```
GET    /api/donations/me?page=&limit=   — incoming donations (as CHARITY)
PATCH  /api/donations/:id/pickup        — mark as picked up
PATCH  /api/donations/:id/confirm { proofPhotoUrl? }  — confirm distribution
POST   /api/documents/upload            — upload proof photo (form-data)
```

### Dashboard layout (3 tabs or sections)
**Tab 1 — Incoming** (`status: PENDING`)
- List of incoming donations
- Each card: seller name, food item, quantity, pickup window
- CTA: "Mark as Picked Up" button → `PATCH /api/donations/:id/pickup`

**Tab 2 — Picked Up** (`status: PICKED_UP`)
- "Upload Proof & Confirm Distribution" button per donation
- Opens `ProofUploadModal`:
  - Optional photo picker → `POST /api/documents/upload` → get URL
  - Confirm button → `PATCH /api/donations/:id/confirm { proofPhotoUrl }`

**Tab 3 — Completed** (`status: CONFIRMED`)
- History of confirmed donations
- Show proof photo thumbnail if available

### Donation status badges
| Status | Color | Label EN | Label AR |
|---|---|---|---|
| `PENDING` | orange | Incoming | قادم |
| `PICKED_UP` | purple | Picked Up | تم الاستلام |
| `CONFIRMED` | green | Confirmed | مكتمل |

---

## TASK 5 — Buyer: Notifications Screen 🔴

**Why:** Backend is fully ready, notifications API exists, and there's no screen at all.

### Files to create
- `src/screens/buyer/NotificationsScreen.tsx`
- `src/hooks/buyer/useNotifications.ts`
- `src/services/buyer/notifications.service.ts`

### Files to modify
- `src/navigation/BuyerTabNavigator.tsx` — add notification bell icon to header OR add as tab; add unread badge dot
- `src/context/AuthContext.tsx` — add FCM token registration on login and `null` on logout

### API calls
```
GET    /api/notifications/me?page=&limit=  — list
PATCH  /api/notifications/me/read-all      — mark all read
PUT    /api/auth/fcm-token { fcmToken }    — save on login
PUT    /api/auth/fcm-token { fcmToken: null } — clear on logout
```

### Notification screen layout
- Header with "Mark all as read" button (top right)
- Flat list, paginated (load more on scroll)
- Each notification card:
  - Icon based on `type`
  - Title + body text
  - Timestamp (relative: "2 min ago")
  - Unread dot (orange) if `read: false`
- Empty state: "No notifications yet"

### Notification types → icons
| Type | Icon | Color |
|---|---|---|
| `ORDER_RESERVED` | `shopping-bag` | orange |
| `ORDER_CANCELLED` | `x-circle` | red |
| `ORDER_RECEIVED` | `check-circle` | green |
| `DONATION_RESERVED` | `heart` | green |

### Unread badge on tab bar
- Add to bell icon in `BuyerTabNavigator` header (not as a 6th tab)
- Read `unreadCount` from `GET /api/notifications/me` response
- Show red dot with count if `unreadCount > 0`

### FCM setup (in AuthContext)
```ts
// After login success:
const fcmToken = await getFCMToken(); // from expo-notifications or firebase
await api.put("/api/auth/fcm-token", { fcmToken });

// In logout():
await api.put("/api/auth/fcm-token", { fcmToken: null });
```

---

## TASK 6 — Auth: Forgot & Reset Password 🟡

**Why:** Users who forget their password are completely stuck — no recovery path exists.

### Files to create
- `src/screens/auth/ForgotPasswordScreen.tsx`
- `src/screens/auth/ResetPasswordScreen.tsx`

### Files to modify
- `src/services/auth/auth.service.ts` — add `forgotPassword()` and `resetPassword()`
- `src/screens/auth/SignInScreen.tsx` — add "Forgot password?" link
- `App.tsx` — add `"forgot-password"` and `"reset-password"` to `AppStep`

### API calls
```
POST /api/auth/forgot-password { phone }
POST /api/auth/reset-password  { phone, code, newPassword }
```

### ForgotPasswordScreen
- Phone number input (same style as PhoneEntryScreen)
- "Send Reset Code" button → `POST /api/auth/forgot-password`
- On success → navigate to `"reset-password"`, pass phone number

### ResetPasswordScreen
- OTP input (4–6 digit, same style as OTPVerificationScreen)
- New password input (show/hide toggle)
- Confirm password input
- "Reset Password" button → `POST /api/auth/reset-password`
- On success → navigate to `"sign-in"` with success toast

---

## TASK 7 — Buyer: QR Code Pickup Flow 🟢

**Why:** Manual "Received" button works as a fallback, but QR is the designed UX.

### Files to create
- `src/screens/buyer/reserve/QRScanScreen.tsx`
- `src/components/buyer/QRCodeDisplay.tsx`

### Files to modify
- `src/screens/buyer/OrdersScreen.tsx` — add "Show QR" button on RESERVED orders
- `App.tsx` — add `"qr-scan"` to `AppStep`

### API calls
```
POST /api/orders/:id/scan { token }   — buyer scans seller's QR
```

### Two QR flows
**Flow A — Buyer shows their QR to seller**
- On RESERVED order card, add "Show QR" button
- Fetch `qrCodeUrl` from `GET /api/listings/:id` response (base64 PNG)
- Display as full-screen `<Image>` with order ID and listing title below

**Flow B — Buyer scans seller's QR**
- Uses `expo-camera` or `expo-barcode-scanner`
- On scan success → `POST /api/orders/:id/scan { token }`
- On success → refresh orders list + show confirmation toast

### Package needed
```bash
npx expo install expo-camera
# or
npx expo install expo-barcode-scanner
```

---

## TASK 8 — Avatar Customization 🟢

**Why:** It's wired on the backend (`avatarStyle`, `avatarColor`) but disabled in the profile screen.

### Files to modify
- `src/screens/buyer/ProfileScreen.tsx` — re-enable avatar picker UI
- `src/hooks/buyer/profile/useProfile.ts` — add `updateAvatar(style, color)` function
- `src/services/buyer/profile/profileService.ts` — already has `PATCH /api/users/me`, just pass `{ avatarStyle, avatarColor }`

### UX
- Avatar circle at top of profile screen (already rendered)
- Tap avatar → open bottom sheet with:
  - Row of color swatches (6–8 colors)
  - Row of style options (abstract shapes / initials styles)
- Auto-save on selection with optimistic update + rollback on error

---

## Execution Order

| # | Task | Priority | Estimate |
|---|---|---|---|
| 1 | Seller: Create / Edit / Delete Listing | 🔴 High | Large |
| 2 | Charity Dashboard (full) | 🔴 High | Large |
| 3 | Buyer: Notifications screen + FCM | 🔴 High | Medium |
| 4 | Auth: Forgot / Reset Password | 🟡 Medium | Small |
| 5 | Seller: Settings tab + Orders view | 🟡 Medium | Medium |
| 6 | Seller: Donate Surplus flow | 🟡 Medium | Medium |
| 7 | Buyer: QR Code pickup flow | 🟢 Low | Small |
| 8 | Avatar customization | 🟢 Low | Small |

---

## Notes

- All new screens must support RTL (`isRTL()` + `rtl && styles.rtl` pattern)
- All new services use the shared `api` instance — never pass tokens manually
- All list screens need: loading state, empty state, error state, pull-to-refresh
- All forms need: field validation, loading on submit, error display, success feedback
- Follow MVVM: screen = render only, hook = state/logic, service = API call
