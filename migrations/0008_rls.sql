-- The app uses the database password from the server. The public Supabase API
-- must not be able to read or change these tables.
do $$
declare
  r record;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format('alter table %I.%I enable row level security', r.schema_name, r.table_name);
    execute format('revoke all on table %I.%I from anon, authenticated', r.schema_name, r.table_name);
  end loop;
end $$;
