alter table checkins add column if not exists instructor_in boolean not null default true;
alter table checkins add column if not exists fun_jump boolean not null default false;
