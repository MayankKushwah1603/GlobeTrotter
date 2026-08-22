# GlobeTrotter — Personalized Travel Planning

Plan multi-city trips, build day-by-day itineraries, track budgets, and share
read-only trip links.

## Features

- Email/password authentication
- Gemini AI auto-itinerary generation & smart travel assistant
- Multi-city trips with ordered stops and per-day activities
- Activity library across 16 cities with durations and costs
- Budget tracking: targets, expenses, category and daily-spend charts
- Calendar view of the whole trip
- Public share links (`/s/<code>`) for read-only itineraries

## Stack

React 19, TypeScript, TanStack Start (Router + Query), Vite 8, Tailwind CSS 4,
Radix UI, Recharts, PostgreSQL (Supabase) with row-level security.

## Run locally

Requires Node.js 20+.

```sh
npm install
npm run dev
```

Then open http://localhost:8080

The database credentials are already in `.env` (publishable key only, safe for
the client). To point at your own PostgreSQL/Supabase instance, update `.env`
and apply the SQL in `supabase/migrations/` in order.

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — lint

## Database

`supabase/migrations/` holds the full relational schema: profiles, cities,
activities, trips, trip_stops, trip_activities, expenses, saved_destinations,
share_links — plus RLS policies and seed data.
