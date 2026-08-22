import { addDays, format } from "date-fns";
import type { TripDetail } from "./types";
import { toDate } from "./format";

export type DayBudget = {
  date: string;
  label: string;
  cityName: string | null;
  activityCount: number;
  total: number;
};

export type BudgetSummary = {
  categories: { category: string; amount: number }[];
  total: number;
  days: DayBudget[];
  averagePerDay: number;
  dayCount: number;
  overBudgetDays: DayBudget[];
  remaining: number | null;
  status: "under" | "near" | "over" | "unset";
};

export function tripDates(trip: { start_date: string; end_date: string }) {
  const start = toDate(trip.start_date);
  const end = toDate(trip.end_date);
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(format(d, "yyyy-MM-dd"));
  return out;
}

export function computeBudget(trip: TripDetail): BudgetSummary {
  const activityTotal = trip.trip_stops.reduce(
    (sum, stop) =>
      sum + stop.trip_activities.reduce((inner, act) => inner + Number(act.cost_usd), 0),
    0,
  );

  const expenseTotals = new Map<string, number>();
  for (const expense of trip.expenses) {
    expenseTotals.set(
      expense.category,
      (expenseTotals.get(expense.category) ?? 0) + Number(expense.amount),
    );
  }

  const categories = ["Transport", "Accommodation", "Activities", "Meals"].map((category) => ({
    category,
    amount: (expenseTotals.get(category) ?? 0) + (category === "Activities" ? activityTotal : 0),
  }));
  for (const [category, amount] of expenseTotals) {
    if (!categories.some((c) => c.category === category)) categories.push({ category, amount });
  }

  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  const dates = tripDates(trip);
  const dayCount = dates.length;
  const spreadPerDay =
    dayCount > 0 ? (total - activityTotal - dayExpenseTotal(trip)) / dayCount : 0;

  const days: DayBudget[] = dates.map((date) => {
    const stop = trip.trip_stops.find((s) => s.start_date <= date && date <= s.end_date);
    const acts = stop?.trip_activities.filter((a) => a.day_date === date) ?? [];
    const dayExpenses = trip.expenses
      .filter((e) => e.incurred_on === date)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      date,
      label: format(toDate(date), "MMM d"),
      cityName: stop?.city?.name ?? null,
      activityCount: acts.length,
      total:
        acts.reduce((sum, a) => sum + Number(a.cost_usd), 0) +
        dayExpenses +
        Math.max(0, spreadPerDay),
    };
  });

  const averagePerDay = dayCount > 0 ? total / dayCount : 0;
  const overBudgetDays = days.filter((d) => averagePerDay > 0 && d.total > averagePerDay * 1.4);

  const limit = trip.budget_limit == null ? null : Number(trip.budget_limit);
  const remaining = limit == null ? null : limit - total;
  const status: BudgetSummary["status"] =
    limit == null ? "unset" : total > limit ? "over" : total > limit * 0.85 ? "near" : "under";

  return {
    categories,
    total,
    days,
    averagePerDay,
    dayCount,
    overBudgetDays,
    remaining,
    status,
  };
}

function dayExpenseTotal(trip: TripDetail) {
  return trip.expenses.filter((e) => e.incurred_on).reduce((sum, e) => sum + Number(e.amount), 0);
}

export function planningProgress(trip: TripDetail) {
  const stops = trip.trip_stops.length;
  if (stops === 0) return 10;
  const activities = trip.trip_stops.reduce((sum, s) => sum + s.trip_activities.length, 0);
  const dayCount = tripDates(trip).length;
  const coverage = Math.min(1, activities / Math.max(1, dayCount * 2));
  const budgeted = trip.expenses.length > 0 ? 0.15 : 0;
  return Math.min(100, Math.round(30 + coverage * 55 + budgeted * 100));
}
