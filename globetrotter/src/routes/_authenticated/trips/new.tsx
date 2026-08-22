import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { AITripGeneratorDialog } from "@/components/travel/AITripGeneratorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { citiesQuery, requireUserId } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { Trip } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/trips/new")({
  head: () => ({
    meta: [
      { title: "Plan a new trip — GlobeTrotter" },
      {
        name: "description",
        content: "Name your trip, set the travel dates and an optional budget target.",
      },
      { property: "og:title", content: "Plan a new trip — GlobeTrotter" },
      { property: "og:description", content: "Start a multi-city itinerary in a few seconds." },
    ],
  }),
  component: NewTrip,
});

function NewTrip() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cities = useQuery(citiesQuery());

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const userId = await requireUserId();
      const cover =
        cities.data?.[Math.floor(Math.random() * Math.max(1, cities.data.length))]?.image_url;
      const { data, error } = await supabase
        .from("trips")
        .insert({
          user_id: userId,
          name: name.trim(),
          description: description.trim(),
          start_date: startDate,
          end_date: endDate,
          budget_limit: budget ? Number(budget) : null,
          cover_image_url: cover ?? null,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data as Trip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip created — add your first city");
      router.navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const invalid = !name.trim() || !startDate || !endDate || endDate < startDate;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="New itinerary"
        title="Plan a new trip"
        description="Start with the basics or let Gemini AI generate your entire day-by-day itinerary in seconds."
      />

      {/* AI Generator Spotlight Card */}
      <div className="relative overflow-hidden rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-6 shadow-sm dark:border-indigo-800/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                ✨ Gemini AI Powered
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">Auto-generate with AI</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Skip manual entry! Let Gemini craft a personalized day-by-day schedule with curated
              activities and estimated costs.
            </p>
          </div>
          <AITripGeneratorDialog />
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <span className="relative bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
          Or create manually
        </span>
      </div>

      <form
        className="surface space-y-5 p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalid) create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Trip name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Iberian summer loop"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Slow travel through coastal cities with plenty of food stops."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start">Start date</Label>
            <Input
              id="start"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End date</Label>
            <Input
              id="end"
              type="date"
              required
              min={startDate || undefined}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget target (₹, optional)</Label>
          <Input
            id="budget"
            type="number"
            min={0}
            step={500}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="50000"
          />
        </div>

        {endDate && startDate && endDate < startDate && (
          <p className="text-sm text-destructive">End date must be after the start date.</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={invalid || create.isPending}>
            {create.isPending ? "Creating…" : "Create trip"}
          </Button>
          <Button asChild variant="ghost">
            <Link to="/trips">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
