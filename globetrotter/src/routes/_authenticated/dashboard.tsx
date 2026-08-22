import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarRange, Compass, Map, Plus, Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { CityCard } from "@/components/travel/CityCard";
import { TripCard } from "@/components/travel/TripCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { citiesQuery, tripsQuery } from "@/lib/api";
import { currency, daysBetween } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Trip overview — GlobeTrotter" },
      {
        name: "description",
        content: "Your upcoming trips, planning progress and budget snapshot.",
      },
      { property: "og:title", content: "Trip overview — GlobeTrotter" },
      {
        property: "og:description",
        content: "See upcoming trips, spend so far and recommended destinations.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const trips = useQuery(tripsQuery());
  const cities = useQuery(citiesQuery());

  const today = new Date().toISOString().slice(0, 10);
  const all = trips.data ?? [];
  const upcoming = all.filter((trip) => trip.end_date >= today);
  const past = all.filter((trip) => trip.end_date < today);
  const totalSpend = all.reduce(
    (sum, trip) => sum + trip.expenses.reduce((inner, e) => inner + Number(e.amount), 0),
    0,
  );
  const travelDays = upcoming.reduce(
    (sum, trip) => sum + daysBetween(trip.start_date, trip.end_date),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Overview"
        title="Your travel desk"
        description="A snapshot of what's planned, what it costs and where to go next."
        actions={
          <Button asChild>
            <Link to="/trips/new">
              <Plus className="size-4" /> Plan new trip
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Upcoming trips"
          value={String(upcoming.length)}
          icon={<Map className="size-4" />}
        />
        <StatCard
          label="Planned travel days"
          value={String(travelDays)}
          icon={<CalendarRange className="size-4" />}
        />
        <StatCard
          label="Logged expenses"
          value={currency(totalSpend, { compact: true })}
          icon={<Wallet className="size-4" />}
        />
        <StatCard
          label="Completed trips"
          value={String(past.length)}
          icon={<Compass className="size-4" />}
        />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-foreground">Upcoming trips</h2>
          <Link to="/trips" className="text-sm text-primary hover:underline">
            View all trips
          </Link>
        </div>
        {trips.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-lg" />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon={<Map className="size-5" />}
            title="No trips planned yet"
            description="Create your first itinerary — add cities, dates and the activities you care about."
            action={
              <Button asChild>
                <Link to="/trips/new">Plan your first trip</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.slice(0, 6).map((trip) => (
              <TripCard key={trip.id} trip={trip} stopCount={trip.trip_stops.length} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-foreground">Popular right now</h2>
          <Link to="/explore/cities" className="text-sm text-primary hover:underline">
            Explore cities
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(cities.data ?? []).slice(0, 4).map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </section>
    </div>
  );
}
