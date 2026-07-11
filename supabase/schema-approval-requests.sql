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

alter table public.approval_requests enable row level security;

drop policy if exists "Anyone can create signup approval request"
  on public.approval_requests;

create policy "Anyone can create signup approval request"
  on public.approval_requests
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Authenticated users can read approval requests"
  on public.approval_requests;

create policy "Authenticated users can read approval requests"
  on public.approval_requests
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can update approval requests"
  on public.approval_requests;

create policy "Authenticated users can update approval requests"
  on public.approval_requests
  for update
  to authenticated
  using (true)
  with check (true);
