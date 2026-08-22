import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { AddActivityDialog } from "@/components/travel/AddActivityDialog";
import { AddStopDialog } from "@/components/travel/AddStopDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { tripQuery } from "@/lib/api";
import { planningProgress, tripDates } from "@/lib/budget";
import { currency, dateRange, duration, shortDate, timeLabel } from "@/lib/format";
import type { TripDetail, TripStop } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/trips/$tripId/")({
  head: () => ({
    meta: [
      { title: "Itinerary builder — GlobeTrotter" },
      {
        name: "description",
        content:
          "Build your day-by-day itinerary: add city stops, schedule activities and watch the budget.",
      },
      { property: "og:title", content: "Itinerary builder — GlobeTrotter" },
      {
        property: "og:description",
        content: "City stops, daily activities and live budget for your trip.",
      },
    ],
  }),
  component: ItineraryTab,
});

function ItineraryTab() {
  const { tripId } = Route.useParams();
  const trip = useQuery(tripQuery(tripId));
  if (!trip.data) return null;
  return <Itinerary trip={trip.data} />;
}

function Itinerary({ trip }: { trip: TripDetail }) {
  const progress = planningProgress(trip);

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Planning progress</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-3" />
      </div>

      {trip.trip_stops.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="No cities yet"
          description="Add your first city stop to start scheduling days and activities."
          action={<AddStopDialog trip={trip} />}
        />
      ) : (
        trip.trip_stops.map((stop, index) => (
          <StopSection
            key={stop.id}
            trip={trip}
            stop={stop}
            index={index}
            isFirst={index === 0}
            isLast={index === trip.trip_stops.length - 1}
          />
        ))
      )}
    </div>
  );
}

function StopSection({
  trip,
  stop,
  index,
  isFirst,
  isLast,
}: {
  trip: TripDetail;
  stop: TripStop;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const queryClient = useQueryClient();
  const days = tripDates({ start_date: stop.start_date, end_date: stop.end_date });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });

  const removeStop = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trip_stops").delete().eq("id", stop.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Stop removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const move = useMutation({
    mutationFn: async (direction: -1 | 1) => {
      const neighbour = trip.trip_stops[index + direction];
      if (!neighbour) return;
      const updates = [
        supabase.from("trip_stops").update({ position: neighbour.position }).eq("id", stop.id),
        supabase.from("trip_stops").update({ position: stop.position }).eq("id", neighbour.id),
      ];
      const results = await Promise.all(updates);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw new Error(failed.error.message);
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const removeActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trip_activities").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const stopCost = stop.trip_activities.reduce((sum, a) => sum + Number(a.cost_usd), 0);

  return (
    <section className="surface overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {stop.city.name}, {stop.city.country}
            </h2>
            <p className="text-xs text-muted-foreground">
              {dateRange(stop.start_date, stop.end_date)} · {days.length} days ·{" "}
              {currency(stopCost, { compact: true })} in activities
            </p>
            {stop.notes && <p className="mt-2 text-xs text-muted-foreground">{stop.notes}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            disabled={isFirst || move.isPending}
            aria-label={`Move ${stop.city.name} earlier`}
            onClick={() => move.mutate(-1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={isLast || move.isPending}
            aria-label={`Move ${stop.city.name} later`}
            onClick={() => move.mutate(1)}
          >
            <ArrowDown className="size-4" />
          </Button>
          <AddActivityDialog tripId={trip.id} stop={stop} days={days} />
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Remove ${stop.city.name} from itinerary`}
            onClick={() => removeStop.mutate()}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </header>

      <div className="divide-y divide-border">
        {days.map((day) => {
          const items = stop.trip_activities.filter((activity) => activity.day_date === day);
          return (
            <div key={day} className="grid gap-3 p-5 sm:grid-cols-[7rem_1fr]">
              <div>
                <p className="text-sm font-medium text-foreground">{shortDate(day)}</p>
                <p className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "activity" : "activities"}
                </p>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
                ) : (
                  items.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border px-3 py-2.5"
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
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${activity.title}`}
                        onClick={() => removeActivity.mutate(activity.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
