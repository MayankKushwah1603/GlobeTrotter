import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Activity, City, Expense, Trip, TripDetail } from "./types";

const TRIP_DETAIL_SELECT = `
  *,
  share_links (code),
  expenses (*),
  trip_stops (
    *,
    city:cities (*),
    trip_activities (*)
  )
`;

function normalizeShareLinks(value: unknown): { code: string }[] {
  if (!value) return [];
  return Array.isArray(value) ? (value as { code: string }[]) : [value as { code: string }];
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const citiesQuery = () =>
  queryOptions({
    queryKey: ["cities"],
    staleTime: 1000 * 60 * 30,
    queryFn: async () =>
      unwrap<City[]>(
        await supabase.from("cities").select("*").order("popularity", { ascending: false }),
      ),
  });

export const cityQuery = (cityId: string) =>
  queryOptions({
    queryKey: ["city", cityId],
    queryFn: async () =>
      unwrap<City>(await supabase.from("cities").select("*").eq("id", cityId).single()),
  });

export const cityActivitiesQuery = (cityId: string) =>
  queryOptions({
    queryKey: ["city-activities", cityId],
    enabled: Boolean(cityId),
    queryFn: async () =>
      unwrap<Activity[]>(
        await supabase.from("activities").select("*").eq("city_id", cityId).order("title"),
      ),
  });

export const tripsQuery = () =>
  queryOptions({
    queryKey: ["trips"],
    queryFn: async () =>
      unwrap<(Trip & { trip_stops: { id: string }[]; expenses: Expense[] })[]>(
        await supabase
          .from("trips")
          .select("*, trip_stops (id), expenses (*)")
          .order("start_date", { ascending: true }),
      ),
  });

export const tripQuery = (tripId: string) =>
  queryOptions({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      const trip = unwrap<TripDetail>(
        await supabase.from("trips").select(TRIP_DETAIL_SELECT).eq("id", tripId).single(),
      );
      trip.share_links = normalizeShareLinks(trip.share_links);
      trip.trip_stops = trip.trip_stops ?? [];
      trip.expenses = trip.expenses ?? [];
      trip.trip_stops.sort((a, b) => a.position - b.position);
      for (const stop of trip.trip_stops) {
        stop.trip_activities.sort(
          (a, b) =>
            a.day_date.localeCompare(b.day_date) ||
            (a.start_time ?? "").localeCompare(b.start_time ?? "") ||
            a.position - b.position,
        );
      }
      return trip;
    },
  });

export const sharedTripQuery = (code: string) =>
  queryOptions({
    queryKey: ["shared-trip", code],
    retry: false,
    queryFn: async (): Promise<TripDetail | null> => {
      const link = await supabase
        .from("share_links")
        .select("trip_id")
        .eq("code", code)
        .maybeSingle();
      if (link.error) throw new Error(link.error.message);
      if (!link.data) return null;

      const res = await supabase
        .from("trips")
        .select(TRIP_DETAIL_SELECT)
        .eq("id", link.data.trip_id)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      const trip = res.data as TripDetail | null;
      if (!trip) return null;

      trip.share_links = normalizeShareLinks(trip.share_links);
      trip.trip_stops = trip.trip_stops ?? [];
      trip.expenses = trip.expenses ?? [];
      trip.trip_stops.sort((a, b) => a.position - b.position);
      for (const stop of trip.trip_stops) {
        stop.trip_activities.sort(
          (a, b) =>
            a.day_date.localeCompare(b.day_date) ||
            (a.start_time ?? "").localeCompare(b.start_time ?? "") ||
            a.position - b.position,
        );
      }
      return trip;
    },
  });

export const savedDestinationsQuery = () =>
  queryOptions({
    queryKey: ["saved-destinations"],
    queryFn: async () =>
      unwrap<{ id: string; city_id: string; city: City }[]>(
        await supabase
          .from("saved_destinations")
          .select("id, city_id, city:cities (*)")
          .order("created_at", { ascending: false }),
      ),
  });

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    enabled: Boolean(userId),
    queryFn: async () =>
      unwrap<{
        id: string;
        full_name: string;
        email: string | null;
        avatar_url: string | null;
        language: string;
      }>(await supabase.from("profiles").select("*").eq("id", userId).single()),
  });

export async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("You need to be signed in.");
  return data.user.id;
}

export function shareCode() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
}
