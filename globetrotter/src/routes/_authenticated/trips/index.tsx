import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Map, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { TripCard } from "@/components/travel/TripCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tripsQuery } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/trips/")({
  head: () => ({
    meta: [
      { title: "My trips — GlobeTrotter" },
      { name: "description", content: "Every itinerary you've planned, upcoming and completed." },
      { property: "og:title", content: "My trips — GlobeTrotter" },
      {
        property: "og:description",
        content: "Browse, search and continue planning your saved trips.",
      },
    ],
  }),
  component: TripsList,
});

function TripsList() {
  const trips = useQuery(tripsQuery());
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upcoming");

  const today = new Date().toISOString().slice(0, 10);
  const filtered = (trips.data ?? [])
    .filter((trip) => (tab === "upcoming" ? trip.end_date >= today : trip.end_date < today))
    .filter((trip) => trip.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Itineraries"
        title="My trips"
        description="Search your plans, jump back into a build, or start something new."
        actions={
          <Button asChild>
            <Link to="/trips/new">
              <Plus className="size-4" /> New trip
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trips"
          className="sm:max-w-64"
          aria-label="Search trips"
        />
      </div>

      {trips.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-56 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Map className="size-5" />}
          title={tab === "upcoming" ? "No upcoming trips" : "No past trips yet"}
          description="Plan a trip to see it listed here with its cities, dates and budget."
          action={
            <Button asChild>
              <Link to="/trips/new">Plan a trip</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              stopCount={trip.trip_stops.length}
              spend={trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
