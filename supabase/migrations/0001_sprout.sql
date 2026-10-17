-- Sprout: perfil infantil e progresso, um registro de cada por conta.
-- Rode no SQL Editor do Supabase (ou via `supabase db push`).

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid(),
  name text not null check (char_length(btrim(name)) between 1 and 30),
  age integer not null check (age between 1 and 12),
  sex text not null check (sex in ('boy', 'girl')),
  can_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique default auth.uid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists child_profiles_updated_at on public.child_profiles;
create trigger child_profiles_updated_at before update on public.child_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists child_progress_updated_at on public.child_progress;
create trigger child_progress_updated_at before update on public.child_progress
  for each row execute function public.set_updated_at();

alter table public.child_profiles enable row level security;
alter table public.child_progress enable row level security;

-- Somente o próprio usuário autenticado lê/escreve seus dados. Nada para anônimos.
revoke all on public.child_profiles, public.child_progress from anon;
grant select, insert, update, delete on public.child_profiles, public.child_progress to authenticated;

drop policy if exists "own profile" on public.child_profiles;
create policy "own profile" on public.child_profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own progress" on public.child_progress;
create policy "own progress" on public.child_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
