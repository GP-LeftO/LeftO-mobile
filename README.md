# LeftO Mobile 📱

LeftO is a platform that connects customers with surplus good-quality food from their favorite restaurants at reduced prices. Customers can also donate to verified charity organizations, who then distribute the food to people in need — with full transparency and trust.

## User Roles

| Role | Description |
|------|-------------|
| Customer | Browses and purchases surplus food, or donates to charities |
| Restaurant Owner | Lists surplus food items with reduced prices |
| Charity Organization | Receives donations and distributes food to those in need |
| Admin | Reviews and approves restaurants and charity organizations |

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React Native + Expo (Managed) | Cross-platform mobile framework |
| TypeScript | Static typing |
| React Navigation | Screen navigation |
| i18next + react-i18next | Internationalization (AR/EN) |
| AsyncStorage | Local persistence |
| expo-localization | Device language detection |
| expo-updates | App reload for RTL switching |

---

## Project Structure
```
src/
├── screens/      # Full page components (View)
├── components/   # Reusable UI pieces (View)
├── hooks/        # Custom hooks — business logic (ViewModel)
├── services/     # API calls (Model)
├── types/        # TypeScript interfaces (Model)
├── i18n/         # Translation files + config (AR/EN)
└── navigation/   # React Navigation setup
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app (SDK 55) on your phone → https://expo.dev/go

### Installation
```bash
git clone https://github.com/LeftO-Org/LeftO-mobile.git
cd LeftO-mobile
npm install
```

### Environment Variables

Copy the example file and fill in your values:
```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| EXPO_PUBLIC_API_URL | Backend API base URL |
| EXPO_PUBLIC_APP_ENV | Environment name (development/production) |

### Running the App
```bash
npm start
```

Scan the QR code with Expo Go on your phone.