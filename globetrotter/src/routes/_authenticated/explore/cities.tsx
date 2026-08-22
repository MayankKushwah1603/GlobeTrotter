import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { CityCard } from "@/components/travel/CityCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { citiesQuery, requireUserId, savedDestinationsQuery } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/explore/cities")({
  head: () => ({
    meta: [
      { title: "Explore cities — GlobeTrotter" },
      {
        name: "description",
        content: "Browse destinations by region and cost index, and save the ones you love.",
      },
      { property: "og:title", content: "Explore cities — GlobeTrotter" },
      {
        property: "og:description",
        content: "Search destinations by region, popularity and cost of travel.",
      },
    ],
  }),
  component: ExploreCities,
});

function ExploreCities() {
  const cities = useQuery(citiesQuery());
  const saved = useQuery(savedDestinationsQuery());
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("all");
  const [cost, setCost] = useState("all");

  const regions = useMemo(
    () => Array.from(new Set((cities.data ?? []).map((city) => city.region))).sort(),
    [cities.data],
  );

  const savedIds = new Set((saved.data ?? []).map((row) => row.city_id));

  const toggleSave = useMutation({
    mutationFn: async (cityId: string) => {
      const userId = await requireUserId();
      if (savedIds.has(cityId)) {
        const { error } = await supabase
          .from("saved_destinations")
          .delete()
          .eq("city_id", cityId)
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
        return "removed" as const;
      }
      const { error } = await supabase
        .from("saved_destinations")
        .insert({ city_id: cityId, user_id: userId });
      if (error) throw new Error(error.message);
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["saved-destinations"] });
      toast.success(result === "added" ? "Saved to your places" : "Removed from saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = (cities.data ?? [])
    .filter((city) => region === "all" || city.region === region)
    .filter((city) => cost === "all" || String(city.cost_index) === cost)
    .filter((city) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        city.name.toLowerCase().includes(q) ||
        city.country.toLowerCase().includes(q) ||
        city.region.toLowerCase().includes(q)
      );
    });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Discover"
        title="Explore cities"
        description="Filter by region and cost index to find the next stop on your route."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search city, country or region"
          aria-label="Search cities"
        />
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger aria-label="Filter by region">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cost} onValueChange={setCost}>
          <SelectTrigger aria-label="Filter by cost index">
            <SelectValue placeholder="Cost index" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any cost</SelectItem>
            {[1, 2, 3, 4, 5].map((value) => (
              <SelectItem key={value} value={String(value)}>
                Cost index {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {cities.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              saved={savedIds.has(city.id)}
              onToggleSave={() => toggleSave.mutate(city.id)}
            />
          ))}
        </div>
      )}

      {!cities.isLoading && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No cities match those filters.
        </p>
      )}
    </div>
  );
}
