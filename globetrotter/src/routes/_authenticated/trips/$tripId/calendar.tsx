import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { TripCalendar } from "@/components/travel/TripCalendar";
import { tripQuery } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/trips/$tripId/calendar")({
  head: () => ({
    meta: [
      { title: "Trip calendar — GlobeTrotter" },
      {
        name: "description",
        content: "See your whole trip as a calendar: which city each day, and what is scheduled.",
      },
      { property: "og:title", content: "Trip calendar — GlobeTrotter" },
      {
        property: "og:description",
        content: "A month-style view of your stops, activities and free days.",
      },
    ],
  }),
  component: CalendarTab,
});

function CalendarTab() {
  const { tripId } = Route.useParams();
  const trip = useQuery(tripQuery(tripId));
  if (!trip.data) return null;

  if (trip.data.trip_stops.length === 0) {
    return (
      <EmptyState
        icon={<CalendarRange className="size-5" />}
        title="Nothing on the calendar yet"
        description="Add a city stop on the Itinerary tab and your days will appear here."
      />
    );
  }

  return <TripCalendar trip={trip.data} />;
}
