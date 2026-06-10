# **📄 LeftO — Product Requirements Document (PRD)**

### **Version 1.0 | Graduation Project | Nablus Pilot**

---

## **1\. 🌟 Product Overview**

Product Name: LeftO

Tagline: *"Too good to waste, too good not to share"*

Platform: Mobile App (iOS & Android via React Native) \+ Web (React)

Backend: Node.js

Target Market: Nablus, Palestine (Pilot) → wider Palestine → Middle East

Languages: Arabic (RTL) & English (Bilingual)

Launch Goal: MVP ready for graduation project presentation in 2.5 months

---

## **2\. 🎯 Problem Statement**

* Restaurants, bakeries, and markets in Palestine discard massive amounts of food daily  
* Low-income families and individuals struggle to afford meals  
* Charity organizations lack a structured, tech-enabled way to receive food donations  
* No existing solution in Palestine addresses food waste \+ community giving simultaneously

---

## **3\. 💡 Solution**

LeftO is a three-sided marketplace that:

* Connects sellers (restaurants, markets, bakeries) with buyers who purchase surplus food at a discount  
* Enables sellers and buyers to donate food/parcels to verified charity organizations  
* Creates a community-driven, trust-based ecosystem that reduces food waste and fights hunger in Palestine

3.1 🌐 Web Landing Page

LeftO has a public-facing landing page built with React.js, serving as the 

product's front door for the academic presentation and real-world launch.

Target audience: potential sellers, charities, buyers, and the academic committee.

Pages:

\- Hero section (tagline \+ app download CTA)

\- How it works (3-step explainer for each user role)

\- Impact stats (CO2 saved, meals donated, stores joined)

\- Featured charities section

\- About LeftO / our mission (Palestine-focused story)

\- Contact / Join as seller CTA

\- Footer with links

Tech: React.js (same repo as admin panel — lefto-web)

Architecture: Feature-Based — add /landing as a new feature folder

---

## **4\. 👥 User Roles**

4.1 Buyer (Consumer)

* Discovers and purchases discounted surplus food  
* Can donate parcels to charity organizations  
* Tracks personal impact (money saved, CO2 avoided)

4.2 Seller (Restaurant / Market / Bakery)

* Lists surplus food as Surprise Bags (restaurants) or Specific Parcels (markets/bakeries)  
* Can donate surplus food directly to charities  
* Manages reservations and pickup times

4.3 Charity Organization

* Receives food donations from sellers and buyers  
* Gets notified of incoming donations with pickup details  
* Must confirm receipt and upload proof of distribution from the Donor  
* Can rate and give feedback to sellers  
* Upload a proof of the charity when it signs up (Auth of the Charity)

4.4 Admin (LeftO Team)

* Reviews and approves (at first on sign-up) seller and charity applications  
* Monitors platform activity  
* Manages users, reports, and disputes  
* Future: manages commission system

---

## **5\. 🗺️ User Journeys**

5.1 customer Journey

* Download app → Onboarding/Intro screens  
* Sign up (phone OTP verification)  
* Set location on map \+ preferred radius  
* Set food preferences and preferred pickup time windows  
* Land on Discovery/Home Page  
* Browse Surprise Bags (restaurants) or Specific Parcels (markets)  
* View store/bag details page  
* Press Reserve/Buy → bag is held for them \+  (here the number of bags will decrease)  
* Note: each customer should have a Visa or cash card & we receive small fees for each reception.  
* Receive notification when bag is ready for pickup  
* Go to store → pick up bag \+ Received button when pressed asking the customer to scan it and submit the barcode without the need to print it , will expire on the seller side then the seller will receive the money.  
  NOTE: we need to generate barcodes automatically and send them to the seller (each for a bag would be generated ) the sec they post the bags\! \-24hr expiration time-  
* Rate (1-5) the experience for the food and leave a review. ( and one for the app like after buying 5 bags, like)  
* OR press Donate instead of Buy → choose charity → charity gets notified → authorization will be sent from charity “could be a photo or sth”

5.2 Seller Journey

* Sign up as seller → enter business name, type, pic description of the seller, location on map.  
* Upload verification documents (trade license, food permit)  
* Enter business details (food category, description, contact info, web. Link if exist, social media links)  
* Submit → wait for admin approval  
* Receive approval notification.  
* Access Seller Dashboard (MyStore)  
* Add a surprise bag or specific parcel listing:  
  * Set quantity, price, pickup time window (start-finish), description  
  * Post it on the app. (buyers who added this seller to their favorites will get notified  
* Receive reservation notifications from buyers  
* Manage active/sold-out listing(auto → when reserved, the number of bags decremented)  
* Access Donation Section → donate surplus directly to a charity(same autho. As buyer)  
* View store performance and ratings (dashboard or profile for the seller showing its performance)  
* In settings : log in as buyer and switch between the restaurants profile and his personal profile as a normal customer.

5.3 Charity Journey

* Sign up as charity → enter organization name, details, region on map (no radius here)  
* Upload proof documents (official charity registration)  
* Submit → wait for admin approval  
* Receive approval → organization listed in Charity list  
* Visible to both buyers and sellers & description page for all charities (pop out page) see more on miro  
* Receive real-time notifications when donation is made:  
  * Donor details (anonymous or named)  
  * Item details  
  * Pickup location and time window  
* Go to seller location → pick up donation → barcode auth.  
* **Upload photo (button or sth)** or confirm that donation was distributed to those in need (accountability layer),warrning: 24hrs limit to upload the proof to donor (button upload proof), after that the name of the organ. Will be removed from the list, admin will receive a noti. After the 24 hrs if there’s no proof. Tool to verify the uploaded photo  
* Rate and give feedback to the seller

---

## **6\. 📱 Core Features — MVP**

### **6.1 Onboarding & Authentication (All Users)**

* Animated intro/splash screens (LeftO brand)   
* Sign up / Sign in (forget pass) flow  
* Phone number \+ OTP verification  
* Role selection: Buyer / Seller / Charity  
* Social login (Google) — future consideration (Bonus)  
* Bilingual support (Arabic RTL / English LTR) from day one

---

### **6.2 Buyer Features**

🏠 Home / Discovery Page

* Set and change location on map with radius selector  
* Filter by food category:  
  * All / Meals / Bread & Pastries / Groceries / Mixed  
* Sections:  
  * Preferred Pickup Windows (personalized)  
  * Local Heroes (top-rated stores in Nablus)  
  * Surprise Bags Near You  
  * Parcels & Groceries  
  * "Popular Today" section (includes sold out bags)  
  * Your Favorites (with empty state CTA)  
  * "See all" to expand each section  
* Store Card shows:  
  * Store name & logo  
  * Bag type (Surprise Bag / Specific Parcel)  
  * Pickup time window  
  * Distance from user  
  * Original price \+ discounted price  
  * Items left count  
  * Sold out badge  
  * Save to Favorites (heart icon)  
  * Donate badge/button

---

🏪 Store / Bag Details Page

* Store hero image \+ logo  
* Back, Share, Favorite buttons  
* Items left badge \+ "Popular" badge  
* Bag type & food category tag  
* Star rating with review count  
* Pickup time window with "Today" badge  
* Sold out state with "Check again at \[time\]" message  
* Store address \+ map view  
* "Get directions" button  
* Pickup instructions  
* "About this Surprise Bag" description with "Read more"  
* Overall experience rating (out of 5\)  
* Breakdown ratings: Pickup / Quality / Variety  
* Ingredients & allergens expandable section  
* Original price \+ discounted price  
* Reserve Button  
* Donate Button (buy and donate to a charity of choice)

---

🛒 Reservation / Checkout Page

* Store name & bag type summary  
* Pickup date & time window  
* Payment method: Cash on Pickup (MVP)  
* Quantity selector (− / \+)  
* Total price  
* Terms & conditions link  
* Reserve Button  
* Donate Flow:  
  * Select charity from verified charity list  
  * Confirm donation  
  * Charity gets notified automatically

---

🔍 Browse / Search Page

* Search bar (find stores by name)  
* View toggle: List View / Map View  
* Map view with GPS current location button  
* Sort by: Relevance / Distance / Price / Rating  
* Smart Filters:  
  * Food category  
  * Pickup time window  
  * Distance/radius  
  * Price range  
  * Donation available toggle  
* Store cards (same as home page)  
* Empty/no results state with "Clear filters" CTA  
* Favorites toast notification when store is saved

---

❤️ Favorites Page

* All saved stores in one place  
* Same store card info  
* Per store actions:  
  * 🔔 Bell icon → toggle notifications for that store  
  * 💚 Heart icon → remove from favorites

---

👤 Profile Page

* Username display  
* Profile avatar with customization:  
  * Choose avatar style and color  
* Orders Summary:  
  * Active orders  
  * Past orders history  
  * Empty state with "Find a Surprise Bag" CTA  
* Donation History:  
  * List of donations made  
  * Charity name, item, date  
* Impact Stats:  
  * 🌱 CO2e avoided (tappable → detail page)  
  * 💰 Money saved (tappable → detail page)  
  * 🤲 Total donations made

---

🌱 Impact Pages

* CO2e Avoided Page:  
  * CO2e tracker  
  * Info button → "What is CO2e?" explainer  
  * Empty state with CTA  
* Money Saved Page:  
  * Monthly breakdown  
  * Surprise Bags saved count  
  * Original value vs amount paid  
  * Total savings (sticky footer)  
* Donations Impact Page:  
  * Total meals donated  
  * Charities supported  
  * Visual impact counter

---

⚙️ Settings / Account Management

* Account details:  
  * Name, Email, Phone, Birthday, Gender  
  * Dietary preferences  
  * Pickup window preferences  
  * Region/location settings  
* Notifications settings:  
  * Push notifications toggle  
  * Surprise Bag alerts toggle  
  * Donation updates toggle  
  * Daily reminder (select days)  
  * Calendar reminders toggle  
* Customer Support:  
  * In-app chatbot assistant (LeftO Bot)  
  * Topic selection  
  * Escalation to human support  
  * Conversation history  
  * Rate support experience  
* Recommend a Store:  
  * Search store by name  
  * Add manually  
  * Select reason \+ relationship  
  * Thank you confirmation screen  
* Charity Directory (browse all verified charities)  
* Hidden stores (future: corporate partnerships)  
* Blog (in-app web view):  
  * Filter by category  
  * Food waste facts, tips, local guides, recipes  
* Legal:  
  * Terms & conditions  
  * Privacy policy  
  * Data & cookies

---

### **6.3 Seller Features (MyStore Dashboard)**

📊 Dashboard Home

* Store performance overview  
* Active listings count  
* Today's reservations  
* Total items saved (impact counter)  
* Ratings summary

➕ Add Listing Page

* For Restaurants: Add Surprise Bag  
  * Bag name/description  
  * Food category tag  
  * Quantity available  
  * Original price \+ discounted price  
  * Pickup time window (start & end time)  
  * Photo upload (optional)  
  * Post listing button  
* For Markets/Bakeries: Add Specific Parcel  
  * Item name & description  
  * Specific items list  
  * Quantity  
  * Expiry date  
  * Original price \+ discounted price  
  * Pickup time window  
  * Photo upload  
  * Post listing button

📦 Manage Listings

* Active listings  
* Sold out listings  
* Edit / Delete listing  
* Mark as sold out manually  
* Reservation notifications in real time

🤲 Donation Section

* Select surplus items to donate  
* Choose charity from verified list  
* Set quantity and pickup time  
* Submit donation → charity notified automatically

⭐ Ratings & Reviews

* View all buyer reviews  
* Breakdown: Pickup / Quality / Variety  
* Respond to reviews (future)

⚙️ Store Settings

* Store profile: name, description, address, contact  
* Store category & food type  
* Operating hours  
* Notification preferences  
* Account details  
* Legal

---

### **6.4 Charity Features**

🏠 Charity Dashboard

* Incoming donations feed  
* Pending pickups  
* Completed donations history  
* Impact counter (meals received, people helped)

🔔 Notifications Center

* Real-time donation notifications:  
  * Donor name (or "Anonymous")  
  * Item details & quantity  
  * Seller name & address  
  * Pickup time window  
* Reminder notifications before pickup window closes

✅ Donation Confirmation Flow

* Mark donation as picked up  
* Upload photo proof of distribution  
* OR confirm via in-app confirmation button  
* This builds public trust and accountability

⭐ Feedback & Rating

* Rate seller after each donation pickup  
* Leave written feedback  
* View own organization's rating and reviews

👤 Charity Profile (Public)

* Organization name & logo  
* Description & mission  
* Region served  
* Verified badge ✅  
* Total donations received  
* Impact stats (visible to public)

---

## **7\. 🔐 Trust & Verification System**

Seller Verification:

* Document upload (trade license, food safety permit)  
* Manual review by LeftO admin team  
* Approval/rejection notification with reason  
* Verified badge on store profile

Charity Verification:

* Upload official charity registration documents  
* Manual review by LeftO admin team  
* Approval/rejection notification  
* Verified badge on charity profile  
* Listed in public charity directory only after approval

Buyer Trust:

* Phone OTP verification  
* Rating and review system after each purchase  
* Photo upload option for received bag (quality proof)  
* Pre-purchase: bag description \+ allergens info  
* Post-purchase: rate Pickup / Quality / Variety

Charity Accountability:

* Must upload photo or confirm distribution after receiving donation  
* Visible impact stats on public profile  
* Rating system from sellers

---

## **8\. 🔔 Notifications System**

Buyer Notifications:

* Bag is ready for pickup  
* Favorite store has new listing  
* Donation confirmed by charity  
* Order reminders  
* Daily discovery reminders (user-selected days)

Seller Notifications:

* New reservation made  
* Reservation cancelled  
* Donation pickup confirmed by charity  
* New review received  
* Listing about to expire

Charity Notifications:

* New donation incoming (with full details)  
* Pickup window reminder  
* Donation confirmation required reminder  
* New feedback received

---

## **9\. 🤖 Chatbot Assistant**

* Available to buyers in support section  
* Topic selection menu  
* Handles common queries:  
  * How to reserve a bag  
  * How to donate  
  * How pickup works  
  * How to find charities  
  * Payment questions  
* Escalates to human support when needed  
* Conversation history saved  
* Rate support experience at end

---

## **10\. 🗄️ Technical Architecture**

Frontend Mobile: React Native (iOS & Android)

Frontend Web: React.js

Backend: Node.js \+ Express.js

Database: PostgreSQL (recommended for relational data — users, orders, donations, charities) or MongoDB

Authentication: JWT \+ Phone OTP (via Twilio or local SMS gateway)

Maps: Google Maps API or OpenStreetMap (free)

Push Notifications: Firebase Cloud Messaging (FCM)

File Storage: AWS S3 or Supabase Storage (for document uploads, photos)

Hosting: To be decided (Supabase worth exploring as noted in your research)

RTL Support: Built-in from day one via React Native RTL configuration

---

## **11\. 💰 Business Model**

MVP Phase (Now):

* ✅ Completely free for all sellers and charities  
* Goal: build trust, density, and user base in Nablus

Future Monetization:

* 💰 Commission per sale (percentage of each transaction)  
* 📱 Online payments via Reflect & PalPay integration  
* 🌟 Premium seller features (promoted listings, analytics)  
* 🤝 Corporate/NGO partnerships

---

## **12\. 🎨 Brand Identity**

App Name: LeftO

Arabic Name: ليفتو

Tagline: *""*

Visual Style: Warm, community-driven, approachable

Color Palette:

* 🟠 Warm Orange — energy, food, warmth (primary)  
* 🟢 Palestinian Green — local identity, freshness, trust (secondary)  
* 🤍 Soft White — cleanliness, simplicity (background)  
* ⚫ Soft Dark Gray — text and UI elements

Typography: Rounded, friendly fonts (supports Arabic & English)

Iconography: Hand-drawn style icons — human, local, community feel

Tone of Voice: Warm, encouraging, community-focused, locally rooted

---

## **13\. 🚀 MVP Scope (2.5 Months)**

The goal is to build a functional, impressive, and demoable product for the graduation presentation. We will prioritize high impact, core features and defer complex features to post-graduation.

---

### **✅ IN SCOPE — Must Have for MVP**

Authentication & Onboarding

* Animated splash/intro screens  
* Sign up / Sign in (all 3 roles)  
* Phone OTP verification  
* Role selection (Buyer / Seller / Charity)  
* Bilingual Arabic/English from day one (RTL support)

Buyer Side

* Home/Discovery page with all sections  
* Store/Bag details page  
* Reserve/Buy flow (cash on pickup)  
* Donate flow (buy and donate to charity)  
* Browse/Search page with smart filters  
* List view \+ Map view toggle  
* Favorites page with notification toggle  
* Profile page with avatar customization  
* Orders history  
* Donation history  
* Impact stats (CO2e saved, money saved, donations made)  
* Basic chatbot assistant  
* Notifications (push)  
* Settings & account management

Seller Side

* Seller registration \+ document upload  
* Admin approval flow  
* MyStore dashboard  
* Add Surprise Bag listing (restaurants)  
* Add Specific Parcel listing (markets/bakeries)  
* Manage listings (edit, delete, mark sold out)  
* Donation section (donate to charity)  
* Reservation notifications  
* Ratings & reviews view  
* Store settings & profile

Charity Side

* Charity registration \+ document upload  
* Admin approval flow  
* Charity dashboard  
* Incoming donations feed  
* Donation notifications (real-time)  
* Pickup confirmation \+ photo upload proof  
* Feedback & rating for sellers  
* Public charity profile with verified badge

Admin Side

* Basic admin panel (web-based)  
* Review and approve/reject seller applications  
* Review and approve/reject charity applications  
* View all users, listings, donations  
* Basic reporting dashboard

Trust & Verification

* Document upload system  
* Manual admin review workflow  
* Verified badges for sellers and charities  
* Post-purchase rating system (Pickup / Quality / Variety)  
* Charity accountability photo upload

Notifications

* Push notifications via Firebase (FCM)  
* Reservation ready notifications  
* Donation incoming notifications  
* Pickup reminder notifications

---

### **⏳ OUT OF SCOPE — Post MVP / Future Features**

Payments

* Online payment integration (Reflect & PalPay)  
* Commission system for platform monetization  
* Vouchers & discounts system  
* Special rewards program

Delivery

* Home delivery option (pickup only for MVP)

Advanced Features

* Social login (Google / Apple)  
* In-app blog (web view)  
* Recommend a store feature  
* Hidden stores (corporate partnerships)  
* Advanced analytics for sellers  
* Seller response to reviews  
* CO2e detail explainer page (can simplify for MVP)  
* Calendar reminder notifications  
* Corporate/NGO partnership portal

Scaling

* Expansion beyond Nablus  
* Multi-city support  
* Multi-country localization

---

## **14\. 📅 Development Sprint Plan**

Given 2.5 months and 2 developers, here's a realistic sprint breakdown:

---

🗓️ Sprint 1 — Week 1-2: Foundation

* Project setup (React Native, Node.js, DB)  
* Authentication system (sign up, sign in, OTP)  
* Role selection flow  
* Basic navigation structure  
* Database schema design  
* RTL/bilingual setup  
* Admin panel foundation

---

🗓️ Sprint 2 — Week 3-4: Seller Side

* Seller registration & document upload  
* Admin approval workflow  
* MyStore dashboard  
* Add Surprise Bag listing  
* Add Specific Parcel listing  
* Manage listings  
* Seller notifications

---

🗓️ Sprint 3 — Week 5-6: Buyer Side

* Home/Discovery page (all sections)  
* Store/Bag details page  
* Browse/Search page with filters  
* Map view integration  
* Favorites page  
* Reserve/Buy flow

---

🗓️ Sprint 4 — Week 7-8: Charity & Donation Layer

* Charity registration & document upload  
* Charity dashboard  
* Donation flow (buyer → charity)  
* Donation flow (seller → charity)  
* Charity notification system  
* Pickup confirmation \+ photo upload  
* Charity public profile

---

🗓️ Sprint 5 — Week 9-10: Polish & Advanced Features

* Profile page \+ avatar customization  
* Impact stats pages (CO2e, money saved, donations)  
* Donation history  
* Orders history  
* Chatbot assistant (basic)  
* Rating & review system  
* Push notifications (full implementation)  
* Settings & account management

---

🗓️ Sprint 6 — Week 11: Testing & Bug Fixing

* Full end-to-end testing (all 3 user roles)  
* Bug fixing  
* Performance optimization  
* RTL/Arabic language QA  
* Demo data preparation (realistic Nablus stores)  
* Admin panel final polish

---

🗓️ Sprint 7 — Week 12-13 (0.5 month buffer): Presentation Prep

* Final UI polish  
* Demo flow preparation  
* Prepare realistic demo accounts:  
  * 1 restaurant seller (Surprise Bag)  
  * 1 market seller (Specific Parcel)  
  * 1 charity organization  
  * 1 buyer account  
* Record demo video as backup  
* Prepare presentation slides  
* Stress test the app

---

## **15\. 🗄️ Database Schema (High Level)**

Users Table

* user\_id, name, email, phone, role (buyer/seller/charity/admin), language preference, created\_at

Sellers Table

* seller\_id, user\_id, business\_name, business\_type (restaurant/market/bakery), location, documents, status (pending/approved/rejected), verified\_badge, rating

Listings Table

* listing\_id, seller\_id, type (surprise\_bag/specific\_parcel), title, description, category, quantity, original\_price, discounted\_price, pickup\_start, pickup\_end, status (active/sold\_out/expired), created\_at

Orders Table

* order\_id, buyer\_id, listing\_id, quantity, total\_price, type (purchase/donation), charity\_id (nullable), status (reserved/completed/cancelled), created\_at

Charities Table

* charity\_id, user\_id, org\_name, description, region, documents, status (pending/approved/rejected), verified\_badge, rating

Donations Table

* donation\_id, donor\_type (buyer/seller), donor\_id, charity\_id, listing\_id, quantity, status (pending/picked\_up/confirmed), proof\_photo, created\_at

Reviews Table

* review\_id, reviewer\_id, seller\_id, order\_id, rating\_overall, rating\_pickup, rating\_quality, rating\_variety, comment, created\_at

Notifications Table

* notification\_id, user\_id, type, title, body, is\_read, created\_at

---

## **16\. 🌟 What Makes LeftO Stand Out**

For your graduation presentation, make sure to highlight these unique differentiators:

* 🇵🇸 First food waste app built specifically for Palestine  
* 🤲 Three-sided marketplace — not just buyer/seller but charity too  
* 💚 Dual donation mechanic — both buyers AND sellers can donate  
* ✅ Charity accountability layer — photo proof of distribution builds real trust  
* 🌱 Impact tracking — users see their real environmental and social impact  
* 🗣️ Bilingual RTL — built for the Arab world from day one  
* 🏘️ Community driven — Local Heroes, favorites, recommendations  
* 📍 Hyper-local — built for Nablus, by people who know Nablus

---

## **17\. 🔮 Future Roadmap (Post Graduation)**

Phase 2 — Monetization

* Commission per sale system  
* Reflect & PalPay online payment integration  
* Vouchers & discount system  
* Premium seller listings

Phase 3 — Growth

* Expand to Ramallah, Jenin, Hebron  
* Delivery option with volunteer drivers  
* Corporate food donation partnerships  
* NGO integration for large-scale donations

Phase 4 — Scale

* Expand to Jordan, Egypt, Gulf markets  
* Multi-language support (French for North Africa)  
* AI-powered food waste prediction for sellers  
* Advanced analytics dashboard for sellers and charities  
* LeftO Foundation (nonprofit arm)  
*   
* 

---

*PRD Version 1.0 — LeftO Graduation Project* *Built for Nablus, Palestine 🇵🇸* *Two developers | 2.5 months | React Native \+ Node.js*

---

This is your complete PRD\! 🎉

A few final notes:

* 📌 Share this with your supervisor as your project specification document  
* 📌 Use the sprint plan to divide tasks between you and your partner  
* 📌 Start with database schema and authentication — everything builds on top of that  
* 📌 Build with demo day in mind — every feature should be demoable live

You've got this — LeftO is going to be amazing\! 🚀🇵🇸  
