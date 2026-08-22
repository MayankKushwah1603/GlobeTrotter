import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  Compass,
  Sparkles,
  Wand2,
  Loader2,
  IndianRupee,
  Calendar,
  MapPin,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { citiesQuery, requireUserId } from "@/lib/api";
import { generateAITripItinerary, type AIGeneratedTrip } from "@/lib/gemini";
import type { Trip } from "@/lib/types";

const TRAVEL_STYLES = [
  { id: "Foodie & Culinary", label: "🍜 Food & Street Eats" },
  { id: "Culture & History", label: "🏛️ Culture & Heritage" },
  { id: "Adventure & Outdoors", label: "🏔️ Nature & Adventure" },
  { id: "Relaxed & Leisure", label: "🏖️ Relaxed & Scenic" },
  { id: "Budget Backpacker", label: "🎒 Budget Backpacker" },
  { id: "Nightlife & City Vibes", label: "🌃 Nightlife & City" },
];

const PACING_OPTIONS = [
  { id: "Relaxed (1-2 main activities/day)", label: "Chill (1-2 activities/day)" },
  { id: "Balanced (2-3 curated activities/day)", label: "Balanced (2-3 activities/day)" },
  { id: "Packed & Ambitious (3-4 activities/day)", label: "Fast-Paced (3-4 activities/day)" },
];

const POPULAR_DESTINATIONS = [
  "Tokyo & Kyoto, Japan",
  "Paris, France",
  "Rome & Florence, Italy",
  "Bali, Indonesia",
  "Barcelona, Spain",
  "London, UK",
];

export function AITripGeneratorDialog() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cities = useQuery(citiesQuery());

  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ?? "2026-09-01",
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] ?? "2026-09-06",
  );
  const [budget, setBudget] = useState("50000");
  const [travelStyle, setTravelStyle] = useState(TRAVEL_STYLES[0]?.id ?? "Foodie & Culinary");
  const [pacing, setPacing] = useState(
    PACING_OPTIONS[1]?.id ?? "Balanced (2-3 curated activities/day)",
  );
  const [notes, setNotes] = useState("");
  const [loadingPhase, setLoadingPhase] = useState("");

  const generateMutation = useMutation({
    mutationFn: async () => {
      setLoadingPhase("Consulting Gemini AI travel model...");
      const aiTrip: AIGeneratedTrip = await generateAITripItinerary({
        destination: destination.trim(),
        startDate,
        endDate,
        budget: budget ? Number(budget) : undefined,
        travelStyle,
        pacing,
        additionalNotes: notes.trim(),
      });

      setLoadingPhase("Creating trip and scheduling stops in database...");
      const userId = await requireUserId();

      // Find best cover image from matching city or random
      const matchingCity = cities.data?.find(
        (c) =>
          destination.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(destination.toLowerCase()),
      );
      const coverImage =
        matchingCity?.image_url ||
        cities.data?.[Math.floor(Math.random() * Math.max(1, cities.data?.length || 1))]
          ?.image_url ||
        null;

      // 1. Insert Trip
      const { data: tripData, error: tripError } = await supabase
        .from("trips")
        .insert({
          user_id: userId,
          name: aiTrip.name || `${destination} Trip`,
          description: aiTrip.description || `AI-generated itinerary for ${destination}`,
          start_date: startDate,
          end_date: endDate,
          budget_limit: budget ? Number(budget) : aiTrip.estimatedTotalCost || null,
          cover_image_url: coverImage,
        })
        .select("*")
        .single();

      if (tripError) throw new Error(tripError.message);
      const newTrip = tripData as Trip;

      // 2. Insert Stops & Activities
      setLoadingPhase("Saving curated activities & day schedules...");
      const availableCities = cities.data || [];
      const stopsList = aiTrip.stops || [];

      for (let stopIndex = 0; stopIndex < stopsList.length; stopIndex++) {
        const stop = stopsList[stopIndex];
        if (!stop) continue;

        // Find matching city ID or fallback to first available
        const matchedCity =
          availableCities.find(
            (c) =>
              c.name.toLowerCase() === stop.cityName.toLowerCase() ||
              stop.cityName.toLowerCase().includes(c.name.toLowerCase()) ||
              c.name.toLowerCase().includes(stop.cityName.toLowerCase()),
          ) ||
          matchingCity ||
          availableCities[0];

        if (!matchedCity) continue;

        const { data: stopData, error: stopError } = await supabase
          .from("trip_stops")
          .insert({
            trip_id: newTrip.id,
            city_id: matchedCity.id,
            start_date: stop.startDate || startDate,
            end_date: stop.endDate || endDate,
            notes: stop.notes || `Activities curated in ${stop.cityName}`,
            position: stopIndex,
          })
          .select("id")
          .single();

        if (stopError || !stopData) {
          console.error("Failed to insert stop:", stopError);
          continue;
        }

        // Insert activities for this stop
        if (stop.activities && stop.activities.length > 0) {
          const activitiesToInsert = stop.activities.map((act, actIndex) => ({
            stop_id: stopData.id,
            day_date: act.dayDate || stop.startDate || startDate,
            start_time: act.startTime || "10:00",
            title: act.title,
            description: act.description || "",
            category: act.category || "Sightseeing",
            duration_minutes: act.durationMinutes || 90,
            cost_usd: act.costUsd || 0,
            position: actIndex,
          }));

          const { error: actError } = await supabase
            .from("trip_activities")
            .insert(activitiesToInsert);
          if (actError) {
            console.error("Failed to insert activities:", actError);
          }
        }
      }

      return newTrip;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("✨ AI Itinerary generated and saved!");
      setOpen(false);
      router.navigate({ to: "/trips/$tripId", params: { tripId: trip.id } });
    },
    onError: (error: Error) => {
      setLoadingPhase("");
      toast.error(error.message || "Failed to generate itinerary with AI.");
    },
  });

  const invalid = !destination.trim() || !startDate || !endDate || endDate < startDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white shadow-md transition-all hover:opacity-95 hover:shadow-lg"
        >
          <Sparkles className="size-4 animate-pulse" />
          <span>Generate with Gemini AI</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Wand2 className="size-5 text-indigo-500" />
            <DialogTitle className="text-xl">AI Itinerary Generator</DialogTitle>
          </div>
          <DialogDescription>
            Tell Gemini where and how you want to travel. It will craft a full day-by-day itinerary
            with activities and cost estimates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="ai-destination" className="flex items-center gap-1.5 font-medium">
              <MapPin className="size-3.5 text-muted-foreground" /> Destination or Cities
            </Label>
            <Input
              id="ai-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo & Kyoto, Paris, or Bali"
              disabled={generateMutation.isPending}
            />
            {/* Quick destination tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {POPULAR_DESTINATIONS.map((pop) => (
                <button
                  key={pop}
                  type="button"
                  onClick={() => setDestination(pop)}
                  className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-muted hover:text-foreground"
                >
                  {pop}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="ai-start-date"
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                <Calendar className="size-3 text-muted-foreground" /> Start Date
              </Label>
              <Input
                id="ai-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="ai-end-date"
                className="flex items-center gap-1.5 text-xs font-medium"
              >
                <Calendar className="size-3 text-muted-foreground" /> End Date
              </Label>
              <Input
                id="ai-end-date"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={generateMutation.isPending}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-budget" className="flex items-center gap-1.5 text-xs font-medium">
              <IndianRupee className="size-3 text-muted-foreground" /> Target Budget (₹)
            </Label>
            <Input
              id="ai-budget"
              type="number"
              min={1000}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="50000"
              disabled={generateMutation.isPending}
            />
          </div>

          {/* Travel Style */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Compass className="size-3 text-muted-foreground" /> Travel Style
            </Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setTravelStyle(style.id)}
                  className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                    travelStyle === style.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pacing */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <Zap className="size-3 text-muted-foreground" /> Pacing
            </Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PACING_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPacing(p.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-center text-xs transition-all ${
                    pacing === p.id
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="ai-notes" className="text-xs font-medium">
              Special Requests / Dietary / Must-sees (Optional)
            </Label>
            <Textarea
              id="ai-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vegetarian food only, love hidden coffee shops, avoid early mornings."
              disabled={generateMutation.isPending}
            />
          </div>

          {/* Progress / Status banner */}
          {generateMutation.isPending && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
              <Loader2 className="size-5 animate-spin text-primary shrink-0" />
              <div>
                <p className="font-medium">Crafting your dream itinerary...</p>
                <p className="text-xs text-muted-foreground">
                  {loadingPhase || "Generating with Gemini AI"}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={generateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={invalid || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" /> Generate & Save Trip
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
