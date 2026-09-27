alter table memberships drop constraint if exists memberships_role_check;
alter table memberships add constraint memberships_role_check check (role in ('owner', 'admin', 'staff'));

alter table people drop constraint if exists people_kind_check;
alter table people add constraint people_kind_check check (kind in ('fun_jumper', 'tandem', 'instructor', 'pilot', 'crew'));

alter table people add column uspa_license text not null default '';
alter table people add column uspa_ratings text not null default '';
alter table people add column uspa_member_number text not null default '';
alter table people add column uspa_member_expires date;
alter table people add column waiver_signed_on date;
alter table people add column emergency_name text not null default '';
alter table people add column emergency_relationship text not null default '';
alter table people add column emergency_phone text not null default '';
alter table people add column reserve_repack_on date;
alter table people add column nojump boolean not null default false;
alter table people add column nojump_note text not null default '';

alter table loads add column altitude_ft int not null default 10000;
alter table loads add column tail_number text not null default '';
alter table loads add column pilot_id int references people (id);

alter table slots add column instructor_id int references people (id);
alter table slots add column jump_type text not null default '';
alter table slots add column media text not null default '';

alter table bookings add column jump_type text not null default 'regular';
alter table bookings add column media text not null default 'none';
alter table bookings drop constraint if exists bookings_jump_type_check;
alter table bookings add constraint bookings_jump_type_check check (jump_type in ('regular', 'beach', 'sunset'));
alter table bookings drop constraint if exists bookings_media_check;
alter table bookings add constraint bookings_media_check check (media in ('none', 'video', 'photo'));

create table if not exists jump_log (
  id serial primary key,
  person_id int not null references people (id),
  jump_date date not null,
  load_id int references loads (id) on delete set null,
  altitude_ft int,
  tail_number text not null default '',
  role text not null default '',
  note text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists checkins (
  person_id int not null references people (id) on delete cascade,
  jump_date date not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  primary key (person_id, jump_date)
);

create index if not exists jump_log_person_idx on jump_log (person_id, jump_date desc);
