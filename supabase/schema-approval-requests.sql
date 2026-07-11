create table if not exists public.approval_requests (
  id text primary key,
  auth_user_id text,
  name text not null,
  email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'denied')),
  requested_role text,
  reports_to text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text,
  denied_at timestamptz,
  denied_by text
);

create index if not exists approval_requests_status_idx
  on public.approval_requests (status);

create index if not exists approval_requests_email_idx
  on public.approval_requests (lower(email));

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  email text not null,
  role text not null
    check (role in ('admin', 'manager', 'associate', 'executive')),
  reports_to text,
  status text not null default 'active'
    check (status in ('active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx
  on public.profiles (lower(email));

create index if not exists profiles_status_idx
  on public.profiles (status);

alter table public.approval_requests enable row level security;
alter table public.profiles enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.approval_requests to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;

drop policy if exists "Anyone can create signup approval request"
  on public.approval_requests;

create policy "Anyone can create signup approval request"
  on public.approval_requests
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Authenticated users can read approval requests"
  on public.approval_requests;

drop policy if exists "Frontend can read approval requests"
  on public.approval_requests;

create policy "Frontend can read approval requests"
  on public.approval_requests
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can update approval requests"
  on public.approval_requests;

drop policy if exists "Frontend can update approval requests"
  on public.approval_requests;

create policy "Frontend can update approval requests"
  on public.approval_requests
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Frontend can read profiles"
  on public.profiles;

create policy "Frontend can read profiles"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Frontend can create profiles"
  on public.profiles;

create policy "Frontend can create profiles"
  on public.profiles
  for insert
  to anon, authenticated
  with check (status in ('active', 'removed'));

drop policy if exists "Frontend can update profiles"
  on public.profiles;

create policy "Frontend can update profiles"
  on public.profiles
  for update
  to anon, authenticated
  using (true)
  with check (status in ('active', 'removed'));
