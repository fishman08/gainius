-- profiles: one row per user, populated by the onboarding questionnaire.
-- Adapted to the existing Gainius project: reuses public.update_updated_at()
-- and uses an idempotent signup trigger that won't clash with whatever
-- existing flows already populate public.users.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,

  primary_goal text check (primary_goal in
    ('lose_fat','build_muscle','get_stronger','improve_endurance','general_fitness','mobility')),
  experience_level text check (experience_level in ('beginner','intermediate','advanced')),
  preferred_style text check (preferred_style in
    ('strength','hypertrophy','hiit','calisthenics','yoga_mobility','mix')),
  days_per_week int check (days_per_week between 2 and 6),
  session_minutes text check (session_minutes in ('20-30','30-45','45-60','60+')),
  training_location text check (training_location in
    ('home_no_equipment','home_with_equipment','gym','mix')),
  available_equipment text[] not null default '{}',
  injuries text[] not null default '{}',
  injury_notes text,
  date_of_birth date,
  sex_at_birth text check (sex_at_birth in ('male','female')),
  height_cm numeric(5,1) check (height_cm between 100 and 250),
  weight_kg numeric(5,1) check (weight_kg between 30 and 300),
  activity_level text check (activity_level in ('sedentary','light','moderate','very_active')),
  units_preference text not null default 'metric'
    check (units_preference in ('metric','imperial')),

  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Maintain updated_at via the existing function.
drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

-- Auto-create a profile row when a new auth user signs up.
-- Idempotent: if a profile row already exists, do nothing.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();

-- Row-level security: a user can only read or update their own profile.
alter table public.profiles enable row level security;

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- INSERT is intentionally restricted to the trigger (no client INSERT policy).
