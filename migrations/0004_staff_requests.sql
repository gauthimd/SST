create table if not exists staff_requests (
  id serial primary key,
  user_id text not null unique,
  name text not null,
  email text not null default '',
  phone text not null default '',
  staff_role text not null check (staff_role in ('instructor', 'pilot', 'manifest')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);
