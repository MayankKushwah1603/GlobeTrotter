create policy "trips_select_shared_auth" on public.trips for select to authenticated using (app_private.trip_is_shared(id));
create policy "stops_select_shared_auth" on public.trip_stops for select to authenticated using (app_private.trip_is_shared(trip_id));
create policy "tacts_select_shared_auth" on public.trip_activities for select to authenticated using (app_private.stop_is_shared(stop_id));
create policy "exp_select_shared_auth" on public.expenses for select to authenticated using (app_private.trip_is_shared(trip_id));
create policy "share_select_public_auth" on public.share_links for select to authenticated using (true);