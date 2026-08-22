create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  language text not null default 'en',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  region text not null,
  cost_index int not null default 50,
  popularity int not null default 50,
  description text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.cities to anon, authenticated;
grant all on public.cities to service_role;
alter table public.cities enable row level security;
create policy "cities_public_read" on public.cities for select to anon, authenticated using (true);
create index cities_name_idx on public.cities (name);
create index cities_country_idx on public.cities (country);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'Sightseeing',
  duration_minutes int not null default 120,
  cost_usd numeric(10,2) not null default 0,
  image_url text not null default '',
  created_at timestamptz not null default now()
);
grant select on public.activities to anon, authenticated;
grant all on public.activities to service_role;
alter table public.activities enable row level security;
create policy "activities_public_read" on public.activities for select to anon, authenticated using (true);
create index activities_city_idx on public.activities (city_id);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  start_date date not null,
  end_date date not null,
  cover_image_url text,
  budget_limit numeric(10,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.trips to authenticated;
grant select on public.trips to anon;
grant all on public.trips to service_role;
alter table public.trips enable row level security;
create index trips_user_idx on public.trips (user_id);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null unique references public.trips(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.share_links to authenticated;
grant select on public.share_links to anon;
grant all on public.share_links to service_role;
alter table public.share_links enable row level security;
create index share_links_code_idx on public.share_links (code);

create or replace function public.trip_is_shared(_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.share_links where trip_id = _trip_id)
$$;

create or replace function public.owns_trip(_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.trips where id = _trip_id and user_id = auth.uid())
$$;

create policy "trips_select_own" on public.trips for select to authenticated using (auth.uid() = user_id);
create policy "trips_select_shared" on public.trips for select to anon using (public.trip_is_shared(id));
create policy "trips_insert_own" on public.trips for insert to authenticated with check (auth.uid() = user_id);
create policy "trips_update_own" on public.trips for update to authenticated using (auth.uid() = user_id);
create policy "trips_delete_own" on public.trips for delete to authenticated using (auth.uid() = user_id);

create policy "share_select_own" on public.share_links for select to authenticated using (public.owns_trip(trip_id));
create policy "share_select_public" on public.share_links for select to anon using (true);
create policy "share_insert_own" on public.share_links for insert to authenticated with check (public.owns_trip(trip_id));
create policy "share_delete_own" on public.share_links for delete to authenticated using (public.owns_trip(trip_id));

create table public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  position int not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.trip_stops to authenticated;
grant select on public.trip_stops to anon;
grant all on public.trip_stops to service_role;
alter table public.trip_stops enable row level security;
create index trip_stops_trip_idx on public.trip_stops (trip_id);
create policy "stops_select_own" on public.trip_stops for select to authenticated using (public.owns_trip(trip_id));
create policy "stops_select_shared" on public.trip_stops for select to anon using (public.trip_is_shared(trip_id));
create policy "stops_insert_own" on public.trip_stops for insert to authenticated with check (public.owns_trip(trip_id));
create policy "stops_update_own" on public.trip_stops for update to authenticated using (public.owns_trip(trip_id));
create policy "stops_delete_own" on public.trip_stops for delete to authenticated using (public.owns_trip(trip_id));

create table public.trip_activities (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references public.trip_stops(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  title text not null,
  description text not null default '',
  category text not null default 'Sightseeing',
  day_date date not null,
  start_time time,
  duration_minutes int not null default 120,
  cost_usd numeric(10,2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.trip_activities to authenticated;
grant select on public.trip_activities to anon;
grant all on public.trip_activities to service_role;
alter table public.trip_activities enable row level security;
create index trip_activities_stop_idx on public.trip_activities (stop_id);

create or replace function public.owns_stop(_stop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_stops s
    join public.trips t on t.id = s.trip_id
    where s.id = _stop_id and t.user_id = auth.uid()
  )
$$;

create or replace function public.stop_is_shared(_stop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trip_stops s
    join public.share_links l on l.trip_id = s.trip_id
    where s.id = _stop_id
  )
$$;

create policy "tacts_select_own" on public.trip_activities for select to authenticated using (public.owns_stop(stop_id));
create policy "tacts_select_shared" on public.trip_activities for select to anon using (public.stop_is_shared(stop_id));
create policy "tacts_insert_own" on public.trip_activities for insert to authenticated with check (public.owns_stop(stop_id));
create policy "tacts_update_own" on public.trip_activities for update to authenticated using (public.owns_stop(stop_id));
create policy "tacts_delete_own" on public.trip_activities for delete to authenticated using (public.owns_stop(stop_id));

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category text not null,
  amount numeric(10,2) not null default 0,
  note text not null default '',
  incurred_on date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant select on public.expenses to anon;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;
create index expenses_trip_idx on public.expenses (trip_id);
create policy "exp_select_own" on public.expenses for select to authenticated using (public.owns_trip(trip_id));
create policy "exp_select_shared" on public.expenses for select to anon using (public.trip_is_shared(trip_id));
create policy "exp_insert_own" on public.expenses for insert to authenticated with check (public.owns_trip(trip_id));
create policy "exp_update_own" on public.expenses for update to authenticated using (public.owns_trip(trip_id));
create policy "exp_delete_own" on public.expenses for delete to authenticated using (public.owns_trip(trip_id));

create table public.saved_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id uuid not null references public.cities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, city_id)
);
grant select, insert, update, delete on public.saved_destinations to authenticated;
grant all on public.saved_destinations to service_role;
alter table public.saved_destinations enable row level security;
create policy "saved_select_own" on public.saved_destinations for select to authenticated using (auth.uid() = user_id);
create policy "saved_insert_own" on public.saved_destinations for insert to authenticated with check (auth.uid() = user_id);
create policy "saved_delete_own" on public.saved_destinations for delete to authenticated using (auth.uid() = user_id);

insert into public.cities (name, country, region, cost_index, popularity, description, image_url) values
('Paris','France','Western Europe',82,98,'Boulevards, museums and patisseries — the benchmark for a first European trip.','https://picsum.photos/seed/paris-city/1200/800'),
('London','United Kingdom','Western Europe',86,95,'Royal history, world-class theatre and markets that run from Borough to Brick Lane.','https://picsum.photos/seed/london-city/1200/800'),
('Tokyo','Japan','East Asia',74,96,'Neon districts, quiet shrines and the densest good-food map on earth.','https://picsum.photos/seed/tokyo-city/1200/800'),
('Kyoto','Japan','East Asia',68,88,'Temples, bamboo groves and machiya streets that reward slow walking.','https://picsum.photos/seed/kyoto-city/1200/800'),
('Dubai','United Arab Emirates','Middle East',78,84,'Desert skyline, souks and a launchpad for long-haul stopovers.','https://picsum.photos/seed/dubai-city/1200/800'),
('Singapore','Singapore','Southeast Asia',80,89,'Hawker centres, tropical gardens and effortless public transport.','https://picsum.photos/seed/singapore-city/1200/800'),
('Bali','Indonesia','Southeast Asia',42,92,'Rice terraces, surf breaks and temple mornings on Indonesia''s calmest island.','https://picsum.photos/seed/bali-city/1200/800'),
('Barcelona','Spain','Southern Europe',66,93,'Modernist architecture, beach afternoons and late dinners.','https://picsum.photos/seed/barcelona-city/1200/800'),
('Rome','Italy','Southern Europe',70,94,'Two thousand years of layered ruins, plus the best espresso habit you''ll pick up.','https://picsum.photos/seed/rome-city/1200/800'),
('New York','United States','North America',94,97,'Five boroughs, endless neighbourhoods, and a museum for every mood.','https://picsum.photos/seed/newyork-city/1200/800'),
('Mumbai','India','South Asia',38,86,'Art deco seafront, film studios and India''s most restless energy.','https://picsum.photos/seed/mumbai-city/1200/800'),
('Delhi','India','South Asia',34,85,'Mughal monuments, wide colonial avenues and unbeatable street food.','https://picsum.photos/seed/delhi-city/1200/800'),
('Jaipur','India','South Asia',30,80,'The pink city — forts, stepwells and block-printed textiles.','https://picsum.photos/seed/jaipur-city/1200/800'),
('Udaipur','India','South Asia',32,74,'Lake palaces, hilltop sunsets and the gentlest pace in Rajasthan.','https://picsum.photos/seed/udaipur-city/1200/800'),
('Bangkok','Thailand','Southeast Asia',40,90,'River temples, night markets and a food scene that never closes.','https://picsum.photos/seed/bangkok-city/1200/800'),
('Istanbul','Turkey','Middle East',44,91,'Two continents, Ottoman mosques and ferries as daily transport.','https://picsum.photos/seed/istanbul-city/1200/800');