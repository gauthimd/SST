create table if not exists memberships (
  user_id text primary key,
  role text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists people (
  id serial primary key,
  kind text not null check (kind in ('fun_jumper', 'tandem', 'crew')),
  name text not null,
  email text not null default '',
  phone text not null default '',
  notes text not null default '',
  linked_user_id text unique,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists loads (
  id serial primary key,
  jump_date date not null,
  load_number int not null,
  status text not null default 'open' check (status in ('open', 'boarding', 'airborne', 'landed')),
  call_time text not null default '',
  notes text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (jump_date, load_number)
);

create table if not exists slots (
  id serial primary key,
  load_id int not null references loads (id) on delete cascade,
  person_id int not null references people (id),
  role text not null check (role in ('tandem', 'fun_jumper', 'instructor', 'videographer')),
  created_by text not null,
  created_at timestamptz not null default now(),
  unique (load_id, person_id)
);

create table if not exists bookings (
  id serial primary key,
  person_id int not null references people (id),
  product text not null,
  jump_date date not null,
  total_cents int not null,
  paid_cents int not null default 0,
  status text not null default 'reserved' check (status in ('reserved', 'checked_in', 'jumped', 'cancelled')),
  notes text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists ledger (
  id serial primary key,
  person_id int not null references people (id),
  booking_id int references bookings (id),
  amount_cents int not null,
  kind text not null check (kind in ('wallet_credit', 'wallet_debit', 'booking_payment')),
  method text not null,
  note text not null default '',
  actor_user_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id serial primary key,
  actor_user_id text not null,
  action text not null,
  entity text not null,
  entity_id text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists loads_date_idx on loads (jump_date);
create index if not exists bookings_date_idx on bookings (jump_date);
create index if not exists ledger_person_idx on ledger (person_id);
create index if not exists audit_created_idx on audit_log (created_at desc);
