import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { CityCard } from "@/components/travel/CityCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { savedDestinationsQuery } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved places — GlobeTrotter" },
      { name: "description", content: "The destinations you bookmarked for a future itinerary." },
      { property: "og:title", content: "Saved places — GlobeTrotter" },
      { property: "og:description", content: "Your shortlist of cities to build trips around." },
    ],
  }),
  component: SavedPlaces,
});

function SavedPlaces() {
  const saved = useQuery(savedDestinationsQuery());
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_destinations").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-destinations"] });
      toast.success("Removed from saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Shortlist"
        title="Saved places"
        description="Cities you've bookmarked while exploring. Add one to a trip when you're ready."
      />

      {saved.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg" />
          ))}
        </div>
      ) : (saved.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Bookmark className="size-5" />}
          title="Nothing saved yet"
          description="Browse the city catalog and bookmark the destinations you're considering."
          action={
            <Button asChild>
              <Link to="/explore/cities">Explore cities</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(saved.data ?? []).map((row) => (
            <CityCard
              key={row.id}
              city={row.city}
              saved
              onToggleSave={() => remove.mutate(row.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
