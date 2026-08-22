import { differenceInCalendarDays, format, parseISO } from "date-fns";

export function currency(amount: number, opts?: { compact?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.compact ? 0 : amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function toDate(value: string) {
  return parseISO(value.length > 10 ? value : `${value}T00:00:00`);
}

export function shortDate(value: string) {
  return format(toDate(value), "MMM d");
}

export function longDate(value: string) {
  return format(toDate(value), "EEEE, MMMM d, yyyy");
}

export function dateRange(start: string, end: string) {
  const s = toDate(start);
  const e = toDate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  return `${format(s, "MMM d")} – ${format(e, sameYear ? "MMM d, yyyy" : "MMM d, yyyy")}`;
}

export function nightsBetween(start: string, end: string) {
  return Math.max(0, differenceInCalendarDays(toDate(end), toDate(start)));
}

export function daysBetween(start: string, end: string) {
  return nightsBetween(start, end) + 1;
}

export function duration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hours`;
}

export function timeLabel(value: string | null) {
  if (!value) return "—";
  const [h, m] = value.split(":");
  return `${h?.padStart(2, "0")}:${m ?? "00"}`;
}

export function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}
