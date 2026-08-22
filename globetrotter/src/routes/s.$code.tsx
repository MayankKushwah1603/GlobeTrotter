import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarRange, MapPin, Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Logo } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
import { TripCalendar } from "@/components/travel/TripCalendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { sharedTripQuery } from "@/lib/api";
import { computeBudget } from "@/lib/budget";
import { currency, dateRange, daysBetween, duration, timeLabel } from "@/lib/format";
import type { TripDetail } from "@/lib/types";

export const Route = createFileRoute("/s/$code")({
  head: () => ({
    meta: [
      { title: "Shared itinerary — GlobeTrotter" },
      {
        name: "description",
        content:
          "A read-only GlobeTrotter itinerary: city stops, the day-by-day schedule and the trip budget.",
      },
      { property: "og:title", content: "Shared itinerary — GlobeTrotter" },
      {
        property: "og:description",
        content: "See the cities, days and costs of this trip plan.",
      },
    ],
  }),
  component: SharedTrip,
});

function SharedTrip() {
  const { code } = Route.useParams();
  const shared = useQuery(sharedTripQuery(code));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Logo />
          <Button asChild size="sm" variant="outline">
            <Link to="/signup">Plan your own trip</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {shared.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : !shared.data ? (
          <EmptyState
            title="This link isn't available"
            description="The itinerary may have been unpublished or the link is incorrect."
            action={
              <Button asChild>
                <Link to="/">Back to GlobeTrotter</Link>
              </Button>
            }
          />
        ) : (
          <SharedView trip={shared.data} />
        )}
      </main>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-5xl px-4 text-xs text-muted-foreground">
          Shared read-only from GlobeTrotter — empowering personalised travel planning.
        </p>
      </footer>
    </div>
  );
}

function SharedView({ trip }: { trip: TripDetail }) {
  const budget = computeBudget(trip);
  const activityCount = trip.trip_stops.reduce((sum, s) => sum + s.trip_activities.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <p className="label-meta mb-2">Shared itinerary</p>
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{trip.name}</h1>
        {trip.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{trip.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Dates"
          value={`${daysBetween(trip.start_date, trip.end_date)} days`}
          hint={dateRange(trip.start_date, trip.end_date)}
          icon={<CalendarRange className="size-4" />}
        />
        <StatCard
          label="Cities"
          value={String(trip.trip_stops.length)}
          hint={trip.trip_stops.map((s) => s.city.name).join(" → ") || "No stops yet"}
          icon={<MapPin className="size-4" />}
        />
        <StatCard
          label="Estimated cost"
          value={currency(budget.total, { compact: true })}
          hint={`${activityCount} activities planned`}
          icon={<Wallet className="size-4" />}
        />
      </div>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold text-foreground">Stops</h2>
        {trip.trip_stops.map((stop, index) => (
          <div key={stop.id} className="surface overflow-hidden">
            <header className="border-b border-border p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {stop.city.name}, {stop.city.country}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {dateRange(stop.start_date, stop.end_date)}
                  </p>
                </div>
              </div>
            </header>
            <ul className="divide-y divide-border">
              {stop.trip_activities.length === 0 ? (
                <li className="p-5 text-sm text-muted-foreground">Nothing scheduled yet.</li>
              ) : (
                stop.trip_activities.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {activity.title}
                        </span>
                        <Badge variant="secondary">{activity.category}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeLabel(activity.start_time)} · {duration(activity.duration_minutes)} ·{" "}
                        {currency(Number(activity.cost_usd), { compact: true })}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Calendar</h2>
        <TripCalendar trip={trip} />
      </section>
    </div>
  );
}
