create temporary table practice_dupes as
select p.id as dupe_id, k.keep_id
from people p
join (
  select name, min(id) as keep_id
  from people
  where name like 'Practice · %'
  group by name
  having count(*) > 1
) k on k.name = p.name and p.id <> k.keep_id;

delete from checkins c
using practice_dupes d
where c.person_id = d.dupe_id
  and exists (
    select 1 from checkins kept
    where kept.person_id = d.keep_id and kept.jump_date = c.jump_date
  );

update checkins c
set person_id = d.keep_id
from practice_dupes d
where c.person_id = d.dupe_id;

delete from slots s
using practice_dupes d
where s.person_id = d.dupe_id
  and exists (
    select 1 from slots kept
    where kept.load_id = s.load_id and kept.person_id = d.keep_id
  );

update slots s
set person_id = d.keep_id
from practice_dupes d
where s.person_id = d.dupe_id;

update slots s
set instructor_id = d.keep_id
from practice_dupes d
where s.instructor_id = d.dupe_id;

update bookings b
set person_id = d.keep_id
from practice_dupes d
where b.person_id = d.dupe_id;

update ledger l
set person_id = d.keep_id
from practice_dupes d
where l.person_id = d.dupe_id;

update jump_log j
set person_id = d.keep_id
from practice_dupes d
where j.person_id = d.dupe_id;

update loads l
set pilot_id = d.keep_id
from practice_dupes d
where l.pilot_id = d.dupe_id;

delete from people p
using practice_dupes d
where p.id = d.dupe_id;

create unique index if not exists people_practice_name_idx
  on people (name)
  where name like 'Practice · %';
