create schema if not exists app_private;
grant usage on schema app_private to anon, authenticated, service_role;

create or replace function app_private.trip_is_shared(_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.share_links where trip_id = _trip_id)
$$;

create or replace function app_private.owns_trip(_trip_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trips where id = _trip_id and user_id = auth.uid())
$$;

create or replace function app_private.owns_stop(_stop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_stops s
    join public.trips t on t.id = s.trip_id
    where s.id = _stop_id and t.user_id = auth.uid()
  )
$$;

create or replace function app_private.stop_is_shared(_stop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.trip_stops s
    join public.share_links l on l.trip_id = s.trip_id
    where s.id = _stop_id
  )
$$;

create or replace function app_private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop policy "trips_select_shared" on public.trips;
create policy "trips_select_shared" on public.trips for select to anon using (app_private.trip_is_shared(id));

drop policy "share_select_own" on public.share_links;
drop policy "share_insert_own" on public.share_links;
drop policy "share_delete_own" on public.share_links;
create policy "share_select_own" on public.share_links for select to authenticated using (app_private.owns_trip(trip_id));
create policy "share_insert_own" on public.share_links for insert to authenticated with check (app_private.owns_trip(trip_id));
create policy "share_delete_own" on public.share_links for delete to authenticated using (app_private.owns_trip(trip_id));

drop policy "stops_select_own" on public.trip_stops;
drop policy "stops_select_shared" on public.trip_stops;
drop policy "stops_insert_own" on public.trip_stops;
drop policy "stops_update_own" on public.trip_stops;
drop policy "stops_delete_own" on public.trip_stops;
create policy "stops_select_own" on public.trip_stops for select to authenticated using (app_private.owns_trip(trip_id));
create policy "stops_select_shared" on public.trip_stops for select to anon using (app_private.trip_is_shared(trip_id));
create policy "stops_insert_own" on public.trip_stops for insert to authenticated with check (app_private.owns_trip(trip_id));
create policy "stops_update_own" on public.trip_stops for update to authenticated using (app_private.owns_trip(trip_id));
create policy "stops_delete_own" on public.trip_stops for delete to authenticated using (app_private.owns_trip(trip_id));

drop policy "tacts_select_own" on public.trip_activities;
drop policy "tacts_select_shared" on public.trip_activities;
drop policy "tacts_insert_own" on public.trip_activities;
drop policy "tacts_update_own" on public.trip_activities;
drop policy "tacts_delete_own" on public.trip_activities;
create policy "tacts_select_own" on public.trip_activities for select to authenticated using (app_private.owns_stop(stop_id));
create policy "tacts_select_shared" on public.trip_activities for select to anon using (app_private.stop_is_shared(stop_id));
create policy "tacts_insert_own" on public.trip_activities for insert to authenticated with check (app_private.owns_stop(stop_id));
create policy "tacts_update_own" on public.trip_activities for update to authenticated using (app_private.owns_stop(stop_id));
create policy "tacts_delete_own" on public.trip_activities for delete to authenticated using (app_private.owns_stop(stop_id));

drop policy "exp_select_own" on public.expenses;
drop policy "exp_select_shared" on public.expenses;
drop policy "exp_insert_own" on public.expenses;
drop policy "exp_update_own" on public.expenses;
drop policy "exp_delete_own" on public.expenses;
create policy "exp_select_own" on public.expenses for select to authenticated using (app_private.owns_trip(trip_id));
create policy "exp_select_shared" on public.expenses for select to anon using (app_private.trip_is_shared(trip_id));
create policy "exp_insert_own" on public.expenses for insert to authenticated with check (app_private.owns_trip(trip_id));
create policy "exp_update_own" on public.expenses for update to authenticated using (app_private.owns_trip(trip_id));
create policy "exp_delete_own" on public.expenses for delete to authenticated using (app_private.owns_trip(trip_id));

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

drop function if exists public.trip_is_shared(uuid);
drop function if exists public.owns_trip(uuid);
drop function if exists public.owns_stop(uuid);
drop function if exists public.stop_is_shared(uuid);
drop function if exists public.handle_new_user();