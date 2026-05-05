-- Allow authenticated users to insert their own profile row.
-- The signup trigger handles new users automatically; this policy lets
-- the app lazily create rows for users that pre-existed the trigger.
drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = user_id);
