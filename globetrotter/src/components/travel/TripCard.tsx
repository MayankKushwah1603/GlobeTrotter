import { Link } from "@tanstack/react-router";
import { CalendarRange, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Trip } from "@/lib/types";
import { currency, dateRange, daysBetween } from "@/lib/format";

const FALLBACK =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=70";

export function TripCard({
  trip,
  stopCount,
  spend,
}: {
  trip: Trip;
  stopCount: number;
  spend?: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const status =
    trip.end_date < today ? "Completed" : trip.start_date <= today ? "In progress" : "Upcoming";

  return (
    <Link
      to="/trips/$tripId"
      params={{ tripId: trip.id }}
      className="surface group block overflow-hidden transition-colors hover:border-primary/40"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
        <img
          src={trip.cover_image_url || FALLBACK}
          alt={`Cover image for ${trip.name}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{trip.name}</h3>
          <Badge variant={status === "Upcoming" ? "default" : "secondary"}>{status}</Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="size-3.5" />
          {dateRange(trip.start_date, trip.end_date)} ·{" "}
          {daysBetween(trip.start_date, trip.end_date)} days
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {stopCount} {stopCount === 1 ? "city" : "cities"}
          {spend != null && ` · ${currency(spend, { compact: true })} logged`}
        </p>
        {trip.description && (
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{trip.description}</p>
        )}
      </div>
    </Link>
  );
}
