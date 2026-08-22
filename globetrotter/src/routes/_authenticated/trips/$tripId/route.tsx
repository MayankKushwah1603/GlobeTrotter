import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { CalendarRange, Clock, MapPin, Wallet } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ShareTripDialog } from "@/components/travel/ShareTripDialog";
import { AddStopDialog } from "@/components/travel/AddStopDialog";
import { AITravelAssistantSheet } from "@/components/travel/AITravelAssistantSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { tripQuery } from "@/lib/api";
import { computeBudget } from "@/lib/budget";
import { currency, dateRange, daysBetween } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/trips/$tripId")({
  component: TripLayout,
});

const TABS = [
  { label: "Itinerary", to: "/trips/$tripId" as const },
  { label: "Calendar", to: "/trips/$tripId/calendar" as const },
  { label: "Budget", to: "/trips/$tripId/budget" as const },
];

function TripLayout() {
  const { tripId } = Route.useParams();
  const trip = useQuery(tripQuery(tripId));

  if (trip.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!trip.data) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          title="Trip not found"
          description="This itinerary may have been deleted."
          action={
            <Button asChild>
              <Link to="/trips">Back to my trips</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const data = trip.data;
  const budget = computeBudget(data);
  const activityCount = data.trip_stops.reduce((sum, s) => sum + s.trip_activities.length, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Trip"
        title={data.name}
        description={
          data.description || "Build the stops, review the days, keep the budget honest."
        }
        actions={
          <>
            <AITravelAssistantSheet trip={data} />
            <ShareTripDialog trip={data} />
            <AddStopDialog trip={data} />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Dates"
          value={`${daysBetween(data.start_date, data.end_date)} days`}
          hint={dateRange(data.start_date, data.end_date)}
          icon={<CalendarRange className="size-4" />}
        />
        <StatCard
          label="Cities"
          value={String(data.trip_stops.length)}
          hint={data.trip_stops.map((s) => s.city.name).join(" → ") || "No stops yet"}
          icon={<MapPin className="size-4" />}
        />
        <StatCard
          label="Activities"
          value={String(activityCount)}
          hint={`${budget.dayCount} planning days`}
          icon={<Clock className="size-4" />}
        />
        <StatCard
          label="Estimated cost"
          value={currency(budget.total, { compact: true })}
          hint={
            data.budget_limit
              ? `${currency(Number(data.budget_limit), { compact: true })} target`
              : "No budget target set"
          }
          tone={
            budget.status === "over" ? "danger" : budget.status === "near" ? "warning" : "default"
          }
          icon={<Wallet className="size-4" />}
        />
      </div>

      <nav className="mt-8 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            params={{ tripId }}
            activeOptions={{ exact: tab.to === "/trips/$tripId" }}
            className="-mb-px border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{
              className: cn("border-primary text-foreground"),
            }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
