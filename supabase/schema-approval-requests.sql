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

alter table public.approval_requests
  add column if not exists auth_user_id text,
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists status text not null default 'pending',
  add column if not exists requested_role text,
  add column if not exists reports_to text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists denied_at timestamptz,
  add column if not exists denied_by text;

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

alter table public.profiles
  add column if not exists name text,
  add column if not exists email text,
  add column if not exists role text,
  add column if not exists reports_to text,
  add column if not exists status text not null default 'active',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_email_idx
  on public.profiles (lower(email));

create index if not exists profiles_status_idx
  on public.profiles (status);

create table if not exists public.daily_reports (
  id text primary key,
  user_id text not null,
  date date not null,
  today_work text not null,
  tomorrow_plan text not null,
  roadblocks text,
  files_reviewed integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_reports
  add column if not exists user_id text,
  add column if not exists date date,
  add column if not exists today_work text,
  add column if not exists tomorrow_plan text,
  add column if not exists roadblocks text,
  add column if not exists files_reviewed integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists daily_reports_user_date_idx
  on public.daily_reports (user_id, date);

create index if not exists daily_reports_date_idx
  on public.daily_reports (date);

create table if not exists public.notifications (
  id text primary key,
  type text not null,
  message text not null,
  read boolean not null default false,
  target_profile_id text,
  freelancer_id text,
  task_id text,
  meta_key text,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists type text,
  add column if not exists message text,
  add column if not exists read boolean not null default false,
  add column if not exists target_profile_id text,
  add column if not exists freelancer_id text,
  add column if not exists task_id text,
  add column if not exists meta_key text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists notifications_target_profile_idx
  on public.notifications (target_profile_id);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at);

alter table public.approval_requests enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_reports enable row level security;
alter table public.notifications enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.approval_requests to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;
grant select, insert, update on public.daily_reports to anon, authenticated;
grant select, insert, update on public.notifications to anon, authenticated;

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

drop policy if exists "Frontend can read daily reports"
  on public.daily_reports;

create policy "Frontend can read daily reports"
  on public.daily_reports
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Frontend can create daily reports"
  on public.daily_reports;

create policy "Frontend can create daily reports"
  on public.daily_reports
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Frontend can update daily reports"
  on public.daily_reports;

create policy "Frontend can update daily reports"
  on public.daily_reports
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Frontend can read notifications"
  on public.notifications;

create policy "Frontend can read notifications"
  on public.notifications
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Frontend can create notifications"
  on public.notifications;

create policy "Frontend can create notifications"
  on public.notifications
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Frontend can update notifications"
  on public.notifications;

create policy "Frontend can update notifications"
  on public.notifications
  for update
  to anon, authenticated
  using (true)
  with check (true);
