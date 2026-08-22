import { format, getDay } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { tripDates } from "@/lib/budget";
import { currency, timeLabel, toDate } from "@/lib/format";
import type { TripDetail } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarDay = {
  date: string;
  cityName: string | null;
  items: { id: string; title: string; start_time: string | null; cost_usd: number }[];
};

export function TripCalendar({ trip }: { trip: TripDetail }) {
  const days: CalendarDay[] = tripDates(trip).map((date) => {
    const stop = trip.trip_stops.find((s) => s.start_date <= date && date <= s.end_date);
    return {
      date,
      cityName: stop?.city?.name ?? null,
      items: (stop?.trip_activities ?? []).filter((a) => a.day_date === date),
    };
  });

  const first = days[0];
  const leadingBlanks = first ? (getDay(toDate(first.date)) + 6) % 7 : 0;

  return (
    <div className="space-y-6">
      <div className="surface overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-secondary/60">
          {WEEKDAYS.map((day) => (
            <div key={day} className="label-meta px-2 py-2 text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div
              key={`blank-${i}`}
              className="min-h-24 border-b border-r border-border bg-muted/30"
            />
          ))}
          {days.map((day) => (
            <div
              key={day.date}
              className={cn(
                "min-h-24 border-b border-r border-border p-2 align-top",
                day.items.length === 0 && "bg-muted/20",
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {format(toDate(day.date), "d")}
                </span>
                <span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                  {day.cityName ?? "Free"}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {day.items.slice(0, 3).map((item) => (
                  <li
                    key={item.id}
                    className="truncate rounded bg-accent px-1.5 py-1 text-[11px] leading-tight text-accent-foreground"
                    title={item.title}
                  >
                    {item.start_time ? `${timeLabel(item.start_time)} ` : ""}
                    {item.title}
                  </li>
                ))}
                {day.items.length > 3 && (
                  <li className="px-1.5 text-[11px] text-muted-foreground">
                    +{day.items.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Day by day</h2>
        {days.map((day) => (
          <div
            key={day.date}
            className="surface flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6"
          >
            <div className="sm:w-40 shrink-0">
              <p className="text-sm font-medium text-foreground">
                {format(toDate(day.date), "EEE, MMM d")}
              </p>
              <p className="text-xs text-muted-foreground">{day.cityName ?? "No city assigned"}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {day.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Open day — nothing scheduled.</p>
              ) : (
                day.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground">
                      <span className="tabular-nums text-muted-foreground">
                        {timeLabel(item.start_time)}
                      </span>{" "}
                      {item.title}
                    </span>
                    <Badge variant="secondary">
                      {currency(Number(item.cost_usd), { compact: true })}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
