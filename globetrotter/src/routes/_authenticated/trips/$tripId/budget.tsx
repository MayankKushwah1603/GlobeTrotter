import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { tripQuery } from "@/lib/api";
import { computeBudget } from "@/lib/budget";
import { currency, shortDate } from "@/lib/format";
import { EXPENSE_CATEGORIES, type TripDetail } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/trips/$tripId/budget")({
  head: () => ({
    meta: [
      { title: "Trip budget — GlobeTrotter" },
      {
        name: "description",
        content:
          "Track trip spend by category and by day, set a budget target and catch the days that blow it.",
      },
      { property: "og:title", content: "Trip budget — GlobeTrotter" },
      {
        property: "og:description",
        content: "Category breakdown, per-day spend and budget alerts for your itinerary.",
      },
    ],
  }),
  component: BudgetTab,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function BudgetTab() {
  const { tripId } = Route.useParams();
  const trip = useQuery(tripQuery(tripId));
  if (!trip.data) return null;
  return <BudgetView trip={trip.data} />;
}

function BudgetView({ trip }: { trip: TripDetail }) {
  const budget = computeBudget(trip);
  const limit = trip.budget_limit == null ? null : Number(trip.budget_limit);
  const pieData = budget.categories.filter((c) => c.amount > 0);

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-meta">Estimated total</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
              {currency(budget.total)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {currency(budget.averagePerDay)} average per day over {budget.dayCount} days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BudgetTargetDialog trip={trip} />
            <AddExpenseDialog trip={trip} />
          </div>
        </div>

        {limit != null && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Target {currency(limit)} ·{" "}
                {budget.remaining != null && budget.remaining >= 0
                  ? `${currency(budget.remaining)} left`
                  : `${currency(Math.abs(budget.remaining ?? 0))} over`}
              </span>
              <Badge
                variant={
                  budget.status === "over"
                    ? "destructive"
                    : budget.status === "near"
                      ? "secondary"
                      : "outline"
                }
              >
                {budget.status === "over"
                  ? "Over budget"
                  : budget.status === "near"
                    ? "Close to target"
                    : "On track"}
              </Badge>
            </div>
            <Progress
              value={Math.min(100, limit > 0 ? (budget.total / limit) * 100 : 0)}
              className="mt-3"
            />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Spend by category</h2>
          {pieData.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              Add activities or expenses to see the breakdown.
            </p>
          ) : (
            <>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={50}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => currency(Number(value))}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2">
                {pieData.map((entry, index) => (
                  <li key={entry.category} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {entry.category}
                    </span>
                    <span className="tabular-nums text-foreground">
                      {currency(entry.amount)} ·{" "}
                      {Math.round((entry.amount / Math.max(1, budget.total)) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-sm font-semibold text-foreground">Spend per day</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budget.days} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(value: number) => currency(Number(value), { compact: true })}
                />
                <Tooltip
                  formatter={(value: number) => currency(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: "12px",
                  }}
                />
                {budget.averagePerDay > 0 && (
                  <ReferenceLine
                    y={budget.averagePerDay}
                    stroke="var(--color-muted-foreground)"
                    strokeDasharray="4 4"
                  />
                )}
                <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {budget.overBudgetDays.length > 0 ? (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <span>
                Heavy days:{" "}
                {budget.overBudgetDays
                  .map((day) => `${day.label} (${currency(day.total, { compact: true })})`)
                  .join(", ")}
                . Consider moving an activity to a lighter day.
              </span>
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Spending is evenly spread across the trip.
            </p>
          )}
        </div>
      </div>

      <ExpenseList trip={trip} />
    </div>
  );
}

function ExpenseList({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["trip", trip.id] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Manual expenses</h2>
        <AddExpenseDialog trip={trip} />
      </div>
      {trip.expenses.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          Activity costs are counted automatically. Add flights, hotels or meals here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {trip.expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {expense.note || expense.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {expense.category}
                  {expense.incurred_on ? ` · ${shortDate(expense.incurred_on)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm tabular-nums text-foreground">
                  {currency(Number(expense.amount))}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete expense"
                  onClick={() => remove.mutate(expense.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddExpenseDialog({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter an amount above zero.");
      const { error } = await supabase.from("expenses").insert({
        trip_id: trip.id,
        category,
        amount: value,
        note,
        incurred_on: date || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Expense added");
      setOpen(false);
      setAmount("");
      setNote("");
      setDate("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" /> Add expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
          <DialogDescription>
            Flights, hotels, meals — anything not already covered by a scheduled activity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="expense-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount (₹)</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              step="10"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="1500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-note">Note</Label>
            <Input
              id="expense-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Return flight"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expense-date">Date (optional)</Label>
            <Input
              id="expense-date"
              type="date"
              min={trip.start_date}
              max={trip.end_date}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Add expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BudgetTargetDialog({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(trip.budget_limit ? String(trip.budget_limit) : "");

  const save = useMutation({
    mutationFn: async () => {
      const parsed = value.trim() === "" ? null : Number(value);
      if (parsed != null && (!Number.isFinite(parsed) || parsed <= 0))
        throw new Error("Enter a target above zero, or leave it blank.");
      const { error } = await supabase
        .from("trips")
        .update({ budget_limit: parsed })
        .eq("id", trip.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Budget target saved");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          {trip.budget_limit ? "Edit target" : "Set target"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Budget target</DialogTitle>
          <DialogDescription>
            We will warn you as the estimated total approaches this number.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="budget-target">Target (₹)</Label>
          <Input
            id="budget-target"
            type="number"
            min="0"
            step="500"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="50000"
          />
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save target"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
