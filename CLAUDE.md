# CLAUDE.md — LeftO Mobile Frontend

## Git & Branch Rules
- Integration branch is **`main`** — feature branches merge here via PR
- Branch naming: `feature/`, `fix/`, `hotfix/` prefixes
- Never run destructive git operations; write the exact command for the user to run
- Never commit directly; always give the exact `git` command for the user

## Workflow Per Task
1. Build the feature
2. Run `npx tsc --noEmit` — must be clean
3. Tell user exactly how to test it on device/simulator (step by step)
4. After each feature: give the user the exact git commit command
5. After a complete feature group: provide a PR headline + full description

## Code Quality Rules
- MVVM strictly: Screen = render only · Hook = state/logic · Service = API call
- No screen should contain `api.get(...)` calls directly — always via a service
- No hook should render JSX
- No half-finished implementations
- Run `npx tsc --noEmit` after every file change; fix all errors before proceeding
- RTL support is mandatory on every screen — `isRTL()` from `../../i18n`
- Never add comments that explain WHAT the code does — only the non-obvious WHY

## Communication Rules
- Explain every step before doing it
- When changing project structure, explain the tradeoff first
- Always show step-by-step testing instructions after each feature

## Project Context
- Platform: food rescue app — Nablus, Palestine
- Stack: React Native 0.83.6 + Expo 55 + TypeScript 5.9
- Backend: `https://lefto-backend-production.up.railway.app`
- Auth: Axios interceptor in `src/services/shared/api.ts` auto-attaches Bearer token + refreshes on 401. Never pass tokens manually.
- Navigation: custom state-machine in `App.tsx` (NOT React Navigation at root). Buyer home uses `BuyerTabNavigator.tsx` (5 tabs).
- i18n: `src/i18n/index.ts` · `isRTL()` · `t()` for translations
- Theme tokens: `src/theme/index.ts` — `Colors.primaryOrange (#DE985A)`, `Colors.greenMain (#16A34A)`, `Colors.background (#FAFAF8)`, `Colors.grayDark (#404040)`, `Colors.grayMedium (#9CA3AF)`

## Codebase Patterns (Observed)

### API response access
```ts
const res = await api.get('/api/something');
const data = res.data.data;            // single item or array
const items = res.data.data.items;     // paginated list
const pagination = res.data.data.pagination;
```

### Service pattern
```ts
// src/services/buyer/someFeature.service.ts
import api from '../shared/api';
export const getSomething = (params?: Record<string, unknown>) =>
  api.get('/api/something', { params });
export const createSomething = (body: SomeType) =>
  api.post('/api/something', body);
```

### Hook pattern
```ts
// src/hooks/buyer/useSomething.ts
import { useState, useEffect, useCallback } from 'react';
import { getSomething } from '../../services/buyer/someFeature.service';

export function useSomething() {
  const [data, setData]       = useState<Something | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSomething();
      setData(res.data.data);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
```

### RTL pattern (every screen)
```ts
import { isRTL } from '../../i18n';
const rtl = isRTL();
// StyleSheet:
row:  { flexDirection: rtl ? 'row-reverse' : 'row' },
text: { textAlign:    rtl ? 'right'        : 'left' },
```

### Navigation — App.tsx state machine
- New screens reachable via props callbacks (onPress, onNavigate)
- `BuyerTabNavigator` accepts callbacks: `onListingPress`, `onOpenChatbot`, `onOpenNearMe`, `onOpenNotifications`, `onOpenQRScan`
- To add a new screen: add its AppStep string to the type in App.tsx, add a case in the render switch, pass the callback down through BuyerTabNavigator props

### Component naming conventions
- Screens: `XxxScreen.tsx` in `src/screens/[role]/`
- Hooks:   `useXxx.ts`    in `src/hooks/[role]/`
- Services: `xxx.service.ts` in `src/services/[role]/`
- Components: `XxxCard.tsx`, `XxxModal.tsx` in `src/components/[role]/`

### Existing shared components to reuse
- `Button.tsx` — primary CTA buttons
- `Chip.tsx` — small pill labels
- `LeafletMap.tsx` — map display
- `ErrorBoundary.tsx` / `ErrorFallback.tsx` — error UI
- `SkeletonCard` (exported from ListingCard) — loading placeholders

### Listing type constants (NEVER use deprecated types)
- Valid: `MEAL_BAG`, `SPECIFIC_PARCEL`
- Removed/rejected by backend: `SUSPENDED_MEAL`, `TAKIYA`, `RAMADAN_BAG`

### Key type file: `src/types/index.ts`
Add new interfaces/types here. Always extend existing types rather than duplicating.

## Feature Status (as of June 5, 2026)

### ✅ Fully Implemented
- Auth flow (OTP, register, login, forgot/reset password)
- Buyer home (3 listing sections + Karam community section + stats)
- Search + advanced filters
- Browse map (Leaflet, seller pins, radius)
- Favorites (add/remove, local context)
- StoreDetailsScreen (listing + seller + reviews + reserve/donate CTAs)
- CheckoutScreen (quantity, pricing, reserve)
- OrdersScreen (RESERVED/COMPLETED/CANCELLED tabs)
- ProfileScreen (orders + donations tabs, settings modal)
- QR scan (expo-camera, POST /api/orders/:id/scan)
- NotificationsScreen (all types, mark read, unread badge)
- Chatbot (text + voice via Groq)
- Near Me (AI voice/text, store cards)
- Seller dashboard (overview, listings CRUD, orders, settings, donations)
- Charity dashboard (incoming/history, proof photo upload)
- Admin dashboard (seller approvals only)
- Forgot/Reset Password
- Seller donations (surplus to charity)
- Karam seller UI (toggle in dashboard, sponsor/claim)
- Karam buyer UI (sponsor button in HomeScreen)
- AppConfig (Ramadan season, Maghrib time — in HomeScreen)

### ❌ Not Yet Implemented
- **`currentPrice` / dynamic pricing display** in ListingCard (uses `discountedPrice` — WRONG)
- **`isPriceDecaying` + `floorPrice` fields** in ListingFormScreen
- **`rescueBadge` display** in ListingCard (recommended endpoint returns it)
- **"Rescue Now" section** in HomeScreen
- **Monthly Winner banner** in HomeScreen
- **Karam Stripe Payment** (buyer sponsor uses simple POST, not Stripe payment sheet)
- **AI Allergen Detection** in ListingFormScreen
- **AI Title Scorer** in ListingFormScreen
- **AI Price Suggestion** in ListingFormScreen
- **AI Food Image Recognition** in ListingFormScreen
- **AI Seller Performance Score** — personal (seller dashboard) + public (StoreDetailsScreen)
- **AI Weekly Sentiment Insight** in seller dashboard
- **Listing Report / Flag System** (buyer flag + admin queue)
- **Impact Certificate PDF** in ProfileScreen
- **Admin Charts + Best-Rated** in AdminDashboardScreen
- **Admin User Filters + Unblock + Delete** in AdminDashboardScreen
- **Cancellation Block 403 handling** in CheckoutScreen
- **`isBlocked` / `cancellationCount` display** in ProfileScreen
- **Badge decrement toast** after cancel in OrdersScreen
- **New notification types** (NEW_LISTING_FROM_FAVORITE, LISTING_EXPIRING_SOON, WASTE_PATTERN_ALERT, DEAL_WINDOW_TIP, ACCOUNT_BLOCKED, LISTING_REPORTED, LISTING_REMOVED)
- **FCM push notification tap → deep link routing**
- **Dual Role buyer→seller** button in ProfileScreen (AuthContext already stores `sellerStatus`)
- **Seller Performance public score** in StoreDetailsScreen
- **`reply` field display** in ReviewCard (API returns `reply`, ReviewCard may not show it)

## Demo Credentials
```
Admin:         0598262751 / Admin123!
Buyer:         0591111111 / Buyer123!
Seller (Karam):0551234567 / Seller123!
Charity:       0597777777 / Charity123!
```
