# 🌍 GlobeTrotter — Personalized Travel Planning

> Plan smarter. Travel better. Explore more. ✈️

**GlobeTrotter** is a personalized travel planning web application that helps users create and manage multi-city trips, build day-by-day itineraries, organize activities, track travel expenses, monitor budgets, and share read-only trip plans with others.

---

## ✨ Features

### 🔐 Authentication
- Email & password authentication
- Google Sign-In
- Secure user sessions with Supabase Authentication
- Protected authenticated routes

### 🗺️ Trip Planning
- Create and manage multiple trips
- Set trip name, description, dates, and budget
- Plan multi-city journeys
- Add and reorder cities/stops
- Add notes for individual destinations

### 📅 Day-by-Day Itinerary
- Organize activities by date
- Set activity start times
- Track activity duration
- Categorize activities
- Automatically calculate activity costs
- View the complete itinerary in a calendar

### 🏙️ Destination Explorer
- Explore available cities
- View city information and descriptions
- Browse activities available in each city
- Save destinations for future trips

### 💰 Budget Management
- Set a budget target for each trip
- Track manual expenses
- Categorize expenses:
  - Transport
  - Accommodation
  - Activities
  - Meals
- Automatically include activity costs
- View total spending
- Calculate average daily spending
- Track remaining budget
- Identify trips that are near or over budget
- Visualize spending using charts

### 🔗 Trip Sharing
- Generate unique public share links
- Share itineraries with other people
- Public users can view shared trips without editing access
- Shared itinerary includes:
  - Trip details
  - Cities/stops
  - Activities
  - Calendar information

### 📊 Dashboard
- Upcoming trips overview
- Planning progress
- Budget snapshots
- Popular destinations
- Quick access to trip planning

---

## 🛠️ Tech Stack

### Frontend
- **React 19**
- **TypeScript**
- **TanStack Start**
- **TanStack Router**
- **TanStack Query**
- **Vite 8**
- **Tailwind CSS 4**
- **Radix UI**
- **Lucide React**
- **Recharts**

### Backend & Database
- **Supabase**
- **PostgreSQL**
- **Supabase Authentication**
- **Row Level Security (RLS)**

### Form & Utility Libraries
- React Hook Form
- Zod
- date-fns
- Sonner
- clsx
- tailwind-merge

---

## 🏗️ Project Architecture

```text
globetrotter/
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   │
│   ├── assets/
│   │   └── hero-coast.jpg
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── travel/
│   │   └── ui/
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── useAuth.ts
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── auth-attacher.ts
│   │       ├── auth-middleware.ts
│   │       ├── client.ts
│   │       ├── client.server.ts
│   │       └── types.ts
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── budget.ts
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── format.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   │
│   ├── routes/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── s.$code.tsx
│   │   │
│   │   └── _authenticated/
│   │       ├── dashboard.tsx
│   │       ├── saved.tsx
│   │       ├── settings.tsx
│   │       │
│   │       ├── explore/
│   │       │   └── cities.tsx
│   │       │
│   │       └── trips/
│   │           ├── index.tsx
│   │           ├── new.tsx
│   │           └── $tripId/
│   │               ├── index.tsx
│   │               ├── budget.tsx
│   │               ├── calendar.tsx
│   │               └── route.tsx
│   │
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
│
├── supabase/
│   └── migrations/
│       ├── database migrations
│       └── Row Level Security policies
│
├── .env
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
