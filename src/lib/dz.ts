import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { FUN_JUMP_CENTS, assertTestCard, quote } from "@/lib/catalog";
import { ALTITUDES, TAILS, jumpBlocker, takeoffProblem } from "@/lib/jumper";
import { afterAdd, canFinish, seatCounts, seatRefusal } from "@/lib/load-capacity";

export type Role = "owner" | "admin" | "staff";

export type Person = {
  id: number;
  kind: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  walletCents: number;
  jumpCount: number;
  uspaLicense: string;
  uspaRatings: string;
  uspaMemberNumber: string;
  uspaMemberExpires: string;
  waiverSignedOn: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  reserveRepackOn: string;
  nojump: boolean;
  nojumpNote: string;
};

export type Booking = {
  id: number;
  personId: number;
  personName: string;
  product: string;
  jumpDate: string;
  totalCents: number;
  paidCents: number;
  status: string;
  notes: string;
  jumpType: string;
  media: string;
};

export type Slot = {
  id: number;
  personId: number;
  personName: string;
  role: string;
  instructorId: number;
  instructorName: string;
  jumpType: string;
  media: string;
};

export type Load = {
  id: number;
  loadNumber: number;
  status: string;
  callTime: string;
  notes: string;
  altitudeFt: number;
  tailNumber: string;
  pilotId: number;
  pilotName: string;
  slots: Slot[];
};

export type Audit = {
  id: number;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  at: string;
};

export type Me = {
  role: Role | null;
  ownerExists: boolean;
  person: Person | null;
  bookings: Booking[];
  staffRequest: StaffRequest | null;
};

export type StaffRequest = {
  id: number;
  name: string;
  email: string;
  phone: string;
  staffRole: string;
  status: string;
};

export type Desk = {
  loads: Load[];
  bookings: Booking[];
  people: Person[];
  checkedInIds: number[];
  funJumpIds: number[];
  audit: Audit[];
  staffRequests: StaffRequest[];
};

export type JumpEntry = {
  id: number;
  jumpDate: string;
  altitudeFt: number;
  tailNumber: string;
  role: string;
  note: string;
};

export type Analytics = {
  range: string;
  from: string;
  to: string;
  tandemCents: number;
  funCents: number;
  loads: {
    id: number;
    loadNumber: number;
    jumpDate: string;
    tailNumber: string;
    altitudeFt: number;
    tandemCents: number;
    funCents: number;
  }[];
};

export function isAdmin(role: Role | null) {
  return role === "owner" || role === "admin";
}

export function staffRoleLabel(role: string) {
  if (role === "instructor") return "Tandem instructor";
  if (role === "pilot") return "Pilot";
  if (role === "manifest") return "Manifest";
  return role;
}

function n(v: unknown) {
  return typeof v === "number" ? v : Number(v ?? 0);
}

function s(v: unknown) {
  return v == null ? "" : String(v);
}

function day(v: unknown) {
  if (v == null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const text = String(v);
  return text.length >= 10 ? text.slice(0, 10) : text;
}

function dateOrNull(v: string) {
  const text = (v ?? "").trim();
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("Use a real date");
  return text;
}

async function audit(actor: string, action: string, entity: string, entityId: string, detail: string) {
  const sql = await getSql();
  await sql`insert into audit_log (actor_user_id, action, entity, entity_id, detail)
    values (${actor}, ${action}, ${entity}, ${entityId}, ${detail})`;
}

async function roleOf(userId: string): Promise<Role | null> {
  const sql = await getSql();
  const rows = await sql<{ role: string }>`select role from memberships where user_id = ${userId}`;
  const role = rows[0]?.role;
  if (role === "owner" || role === "admin" || role === "staff") return role;
  return null;
}

async function requireStaff(userId: string) {
  const role = await roleOf(userId);
  if (!role) throw new Error("Manifest staff only");
  return role;
}

async function requireAdmin(userId: string) {
  const role = await requireStaff(userId);
  if (!isAdmin(role)) throw new Error("Admin only");
  return role;
}

async function walletOf(personId: number) {
  const sql = await getSql();
  const rows = await sql<{ cents: unknown }>`
    select coalesce(sum(amount_cents), 0) as cents
    from ledger
    where person_id = ${personId} and kind in ('wallet_credit', 'wallet_debit')
  `;
  return n(rows[0]?.cents);
}

function mapPerson(row: {
  id: unknown;
  kind: unknown;
  name: unknown;
  email: unknown;
  phone: unknown;
  notes: unknown;
  wallet_cents: unknown;
  jump_count: unknown;
  uspa_license: unknown;
  uspa_ratings: unknown;
  uspa_member_number: unknown;
  uspa_member_expires: unknown;
  waiver_signed_on: unknown;
  emergency_name: unknown;
  emergency_relationship: unknown;
  emergency_phone: unknown;
  reserve_repack_on: unknown;
  nojump: unknown;
  nojump_note: unknown;
}): Person {
  return {
    id: n(row.id),
    kind: s(row.kind),
    name: s(row.name),
    email: s(row.email),
    phone: s(row.phone),
    notes: s(row.notes),
    walletCents: n(row.wallet_cents),
    jumpCount: n(row.jump_count),
    uspaLicense: s(row.uspa_license),
    uspaRatings: s(row.uspa_ratings),
    uspaMemberNumber: s(row.uspa_member_number),
    uspaMemberExpires: day(row.uspa_member_expires),
    waiverSignedOn: day(row.waiver_signed_on),
    emergencyName: s(row.emergency_name),
    emergencyRelationship: s(row.emergency_relationship),
    emergencyPhone: s(row.emergency_phone),
    reserveRepackOn: day(row.reserve_repack_on),
    nojump: row.nojump === true || row.nojump === "t" || row.nojump === "true",
    nojumpNote: s(row.nojump_note),
  };
}

const personSelect = `
  select p.id, p.kind, p.name, p.email, p.phone, p.notes,
    p.uspa_license, p.uspa_ratings, p.uspa_member_number, p.uspa_member_expires::text as uspa_member_expires,
    p.waiver_signed_on::text as waiver_signed_on, p.emergency_name, p.emergency_relationship, p.emergency_phone,
    p.reserve_repack_on::text as reserve_repack_on, p.nojump, p.nojump_note,
    coalesce((select sum(amount_cents) from ledger l
      where l.person_id = p.id and l.kind in ('wallet_credit', 'wallet_debit')), 0) as wallet_cents,
    (select count(*) from jump_log j where j.person_id = p.id) as jump_count
  from people p
`;

async function peopleQuery(whereSql: string, arg?: string | number) {
  const sql = await getSql();
  const q = `${personSelect} ${whereSql} order by p.name`;
  const rows = arg
    ? await sql.query<Parameters<typeof mapPerson>[0]>(q, [arg])
    : await sql.query<Parameters<typeof mapPerson>[0]>(q);
  return rows.map(mapPerson);
}

function mapBooking(row: {
  id: unknown;
  person_id: unknown;
  person_name: unknown;
  product: unknown;
  jump_date: unknown;
  total_cents: unknown;
  paid_cents: unknown;
  status: unknown;
  notes: unknown;
  jump_type: unknown;
  media: unknown;
}): Booking {
  return {
    id: n(row.id),
    personId: n(row.person_id),
    personName: s(row.person_name),
    product: s(row.product),
    jumpDate: s(row.jump_date).slice(0, 10),
    totalCents: n(row.total_cents),
    paidCents: n(row.paid_cents),
    status: s(row.status),
    notes: s(row.notes),
    jumpType: s(row.jump_type),
    media: s(row.media),
  };
}

const bookingSelect = `
  select b.id, b.person_id, p.name as person_name, b.product, b.jump_date::text as jump_date,
    b.total_cents, b.paid_cents, b.status, b.notes, b.jump_type, b.media
  from bookings b
  join people p on p.id = b.person_id
`;

function cleanDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a date");
  return date;
}

function shapeFromProduct(productId: string, photo: boolean, videoOnly?: boolean) {
  const jumpType = productId === "beach" ? "beach" : productId === "sunset" ? "sunset" : "regular";
  const media = jumpType !== "regular" || photo ? "photo" : videoOnly ? "video" : "none";
  return { jumpType, media };
}

function cleanName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name is required");
  return trimmed.slice(0, 80);
}

function mapStaffRequest(row: {
  id: unknown;
  name: unknown;
  email: unknown;
  phone: unknown;
  staff_role: unknown;
  status: unknown;
}): StaffRequest {
  return {
    id: n(row.id),
    name: s(row.name),
    email: s(row.email),
    phone: s(row.phone),
    staffRole: s(row.staff_role),
    status: s(row.status),
  };
}

async function myStaffRequest(userId: string) {
  const sql = await getSql();
  const rows = await sql<{
    id: unknown;
    name: unknown;
    email: unknown;
    phone: unknown;
    staff_role: unknown;
    status: unknown;
  }>`select id, name, email, phone, staff_role, status from staff_requests where user_id = ${userId}`;
  return rows[0] ? mapStaffRequest(rows[0]) : null;
}

async function pendingStaffRequests() {
  const sql = await getSql();
  const rows = await sql<{
    id: unknown;
    name: unknown;
    email: unknown;
    phone: unknown;
    staff_role: unknown;
    status: unknown;
  }>`select id, name, email, phone, staff_role, status from staff_requests where status = 'pending' order by id`;
  return rows.map(mapStaffRequest);
}

async function emailAdminsAboutStaff(name: string, email: string, staffRole: string) {
  const sql = await getSql();
  const rows = await sql<{ email: unknown }>`
    select u.email as email
    from memberships m
    join "user" u on u.id = m.user_id
    where m.role in ('owner', 'admin')
  `;
  const label = staffRoleLabel(staffRole);
  const desk = (process.env.BETTER_AUTH_URL || "https://sstwdb.vercel.app").replace(/\/$/, "");
  return sendMail(
    rows.map((row) => s(row.email)),
    `Confirm staff account: ${name}`,
    `${name} (${email || "no email"}) asked for a staff account as a ${label}.\n\nThey are not active until you confirm them. Open ${desk}/desk, go to Accounts, and approve or decline the request.\n\nStaff accounts are only for tandem instructors, pilots, and manifest.`,
  );
}

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Me> => {
    const sql = await getSql();
    const role = await roleOf(context.userId);
    const owners = await sql<{ n: unknown }>`select count(*) as n from memberships where role = 'owner'`;
    const people = await peopleQuery("where p.linked_user_id = $1", context.userId);
    const person = people[0] ?? null;
    const bookings = person
      ? (
          await sql.query<Parameters<typeof mapBooking>[0]>(
            `${bookingSelect} where b.person_id = $1 order by b.jump_date desc, b.id desc`,
            [person.id],
          )
        ).map(mapBooking)
      : [];
    return { role, ownerExists: n(owners[0]?.n) > 0, person, bookings, staffRequest: await myStaffRequest(context.userId) };
  });

export const claimDesk = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const owners = await sql<{ n: unknown }>`select count(*) as n from memberships where role = 'owner'`;
    if (n(owners[0]?.n) > 0) throw new Error("The desk already has an owner");
    await sql`insert into memberships (user_id, role) values (${context.userId}, 'owner')
      on conflict (user_id) do update set role = 'owner'`;
    await audit(context.userId, "claim_desk", "membership", context.userId, "Opened the manifest as owner");
    return { ok: true };
  });

export const loadDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((date: string) => cleanDate(date))
  .handler(async ({ context, data: date }): Promise<Desk> => {
    const role = await requireStaff(context.userId);
    const sql = await getSql();
    const loadRows = await sql.query<{
      id: unknown;
      load_number: unknown;
      status: unknown;
      call_time: unknown;
      notes: unknown;
      altitude_ft: unknown;
      tail_number: unknown;
      pilot_id: unknown;
      pilot_name: unknown;
    }>(
      `select l.id, l.load_number, l.status, l.call_time, l.notes, l.altitude_ft, l.tail_number, l.pilot_id,
         coalesce(pi.name, '') as pilot_name
       from loads l
       left join people pi on pi.id = l.pilot_id
       where l.jump_date = $1
       order by l.load_number`,
      [date],
    );
    const slotRows = await sql.query<{
      id: unknown;
      load_id: unknown;
      person_id: unknown;
      person_name: unknown;
      role: unknown;
      instructor_id: unknown;
      instructor_name: unknown;
      jump_type: unknown;
      media: unknown;
    }>(
      `select s.id, s.load_id, s.person_id, p.name as person_name, s.role,
         s.instructor_id, coalesce(i.name, '') as instructor_name, s.jump_type, s.media
       from slots s
       join people p on p.id = s.person_id
       left join people i on i.id = s.instructor_id
       join loads l on l.id = s.load_id
       where l.jump_date = $1
       order by p.name`,
      [date],
    );
    const loads: Load[] = loadRows.map((row) => ({
      id: n(row.id),
      loadNumber: n(row.load_number),
      status: s(row.status),
      callTime: s(row.call_time),
      notes: s(row.notes),
      altitudeFt: n(row.altitude_ft) || 10000,
      tailNumber: s(row.tail_number),
      pilotId: n(row.pilot_id),
      pilotName: s(row.pilot_name),
      slots: slotRows
        .filter((slot) => n(slot.load_id) === n(row.id))
        .map((slot) => ({
          id: n(slot.id),
          personId: n(slot.person_id),
          personName: s(slot.person_name),
          role: s(slot.role),
          instructorId: n(slot.instructor_id),
          instructorName: s(slot.instructor_name),
          jumpType: s(slot.jump_type),
          media: s(slot.media),
        })),
    }));
    const bookings = (
      await sql.query<Parameters<typeof mapBooking>[0]>(
        `${bookingSelect} where b.jump_date = $1 order by b.id`,
        [date],
      )
    ).map(mapBooking);
    const people = await peopleQuery("");
    const checked = await sql.query<{ person_id: unknown; instructor_in: unknown; fun_jump: unknown }>(
      `select person_id, instructor_in, fun_jump from checkins where jump_date = $1`,
      [date],
    );
    const isOn = (value: unknown) => value === true || value === "t" || value === "true";
    const auditRows = isAdmin(role)
      ? await sql<{
          id: unknown;
          action: unknown;
          entity: unknown;
          entity_id: unknown;
          detail: unknown;
          at: unknown;
        }>`select id, action, entity, entity_id, detail, created_at::text as at
          from audit_log order by id desc limit 80`
      : [];
    return {
      loads,
      bookings,
      people,
      checkedInIds: checked.filter((row) => isOn(row.instructor_in)).map((row) => n(row.person_id)),
      funJumpIds: checked.filter((row) => isOn(row.fun_jump)).map((row) => n(row.person_id)),
      audit: auditRows.map((row) => ({
        id: n(row.id),
        action: s(row.action),
        entity: s(row.entity),
        entityId: s(row.entity_id),
        detail: s(row.detail),
        at: s(row.at),
      })),
      staffRequests: isAdmin(role) ? await pendingStaffRequests() : [],
    };
  });

type NewPerson = { kind: string; name: string; email: string; phone: string; notes: string };

export const createPerson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: NewPerson): NewPerson => {
    const kind = ["tandem", "instructor", "pilot", "crew"].includes(input.kind) ? input.kind : "fun_jumper";
    return {
      kind,
      name: cleanName(input.name ?? ""),
      email: (input.email ?? "").trim().slice(0, 120),
      phone: (input.phone ?? "").trim().slice(0, 40),
      notes: (input.notes ?? "").trim().slice(0, 400),
    };
  })
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: unknown }>`
      insert into people (kind, name, email, phone, notes, created_by)
      values (${data.kind}, ${data.name}, ${data.email}, ${data.phone}, ${data.notes}, ${context.userId})
      returning id
    `;
    const id = n(rows[0]?.id);
    await audit(context.userId, "create_person", "person", String(id), `${data.kind}: ${data.name}`);
    return { id };
  });

export const createLoad = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { date: string; callTime: string; altitudeFt: number; tailNumber: string }) => ({
    date: cleanDate(input.date),
    callTime: /^\d{2}:\d{2}$/.test(input.callTime ?? "") ? input.callTime : "",
    altitudeFt: ALTITUDES.some((item) => item.ft === n(input.altitudeFt)) ? n(input.altitudeFt) : 10000,
    tailNumber: (TAILS as readonly string[]).includes(input.tailNumber) ? input.tailNumber : "",
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const max = await sql.query<{ n: unknown }>(
      `select coalesce(max(load_number), 0) as n from loads where jump_date = $1`,
      [data.date],
    );
    const loadNumber = n(max[0]?.n) + 1;
    const rows = await sql.query<{ id: unknown }>(
      `insert into loads (jump_date, load_number, call_time, altitude_ft, tail_number, notes, created_by)
       values ($1, $2, $3, $4, $5, '', $6) returning id`,
      [data.date, loadNumber, data.callTime, data.altitudeFt, data.tailNumber, context.userId],
    );
    const id = n(rows[0]?.id);
    await audit(
      context.userId,
      "create_load",
      "load",
      String(id),
      `Load ${loadNumber} on ${data.date} takeoff ${data.callTime || "unset"} ${data.altitudeFt}ft ${data.tailNumber}`,
    );
    return { id, loadNumber };
  });

export const setLoadStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; status: string }) => {
    const status = input.status;
    if (!["open", "boarding", "airborne", "landed"].includes(status)) throw new Error("Bad status");
    return { id: n(input.id), status };
  })
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update loads set status = ${data.status} where id = ${data.id}`;
    if (data.status === "landed") {
      await sql.query(
        `insert into jump_log (person_id, jump_date, load_id, altitude_ft, tail_number, role, note, created_by)
         select s.person_id, l.jump_date, l.id, l.altitude_ft, l.tail_number, s.role, '', $2
         from slots s
         join loads l on l.id = s.load_id
         where l.id = $1
           and not exists (
             select 1 from jump_log j where j.load_id = l.id and j.person_id = s.person_id
           )`,
        [data.id, context.userId],
      );
    }
    await audit(context.userId, "load_status", "load", String(data.id), data.status);
    return { ok: true };
  });

export const addSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: { loadId: number; personId: number; role: string; instructorId?: number; jumpType?: string; media?: string }) => {
      const role = ["tandem", "fun_jumper", "instructor", "videographer"].includes(input.role) ? input.role : "tandem";
      const jumpType = ["regular", "beach", "sunset"].includes(input.jumpType ?? "") ? input.jumpType! : "";
      const media = ["none", "video", "photo"].includes(input.media ?? "") ? input.media! : "";
      return {
        loadId: n(input.loadId),
        personId: n(input.personId),
        role,
        instructorId: n(input.instructorId),
        jumpType,
        media,
      };
    },
  )
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const loads = await sql<{ jump_date: unknown }>`select jump_date::text as jump_date from loads where id = ${data.loadId}`;
    const jumpDate = day(loads[0]?.jump_date);
    if (!jumpDate) throw new Error("Load not found");
    const people = await peopleQuery("where p.id = $1", data.personId);
    const person = people[0];
    if (!person) throw new Error("Person not found");
    const block = jumpBlocker(person, jumpDate, data.role);
    if (block) throw new Error(`${person.name} cannot jump: ${block}`);
    const seated = await sql<{ person_id: unknown; role: unknown; instructor_id: unknown }>`
      select person_id, role, instructor_id from slots where load_id = ${data.loadId}
    `;
    if (seated.some((slot) => n(slot.person_id) === data.personId)) throw new Error(`${person.name} is already on this load`);
    if (data.role === "fun_jumper" && seated.some((slot) => n(slot.instructor_id) === data.personId)) {
      throw new Error(`${person.name} is already the instructor on this load`);
    }
    const elsewhere = await sql<{ id: unknown }>`
      select l.id
      from slots s
      join loads l on l.id = s.load_id
      where l.jump_date = ${jumpDate}
        and l.status <> 'landed'
        and l.id <> ${data.loadId}
        and s.person_id = ${data.personId}
      limit 1
    `;
    if (elsewhere[0]) throw new Error(`${person.name} is already on a load`);
    if (data.role === "videographer" || data.role === "instructor") {
      throw new Error(
        data.role === "videographer"
          ? "Video rides with the tandem instructor. It is not another seat."
          : "Pick the tandem instructor when you add the student. An instructor is not a seat by themselves.",
      );
    }
    const counts = seatCounts(seated.map((slot) => ({ role: s(slot.role) })));
    const checked = await sql.query<{ fun_jump: unknown; instructor_in: unknown }>(
      `select fun_jump, instructor_in from checkins where person_id = $1 and jump_date = $2`,
      [data.personId, jumpDate],
    );
    const checkedOn = (value: unknown) => value === true || value === "t" || value === "true";
    if (data.role === "fun_jumper" && person.kind === "instructor") {
      if (!checked[0] || !checkedOn(checked[0].fun_jump)) throw new Error("Check them in as a fun jumper first");
    } else if ((data.role === "fun_jumper" || data.role === "instructor") && !checked[0]) {
      throw new Error("Check them in for this day first");
    }
    if (data.role === "instructor" && !checkedOn(checked[0]?.instructor_in)) {
      throw new Error("Check them in as an instructor first");
    }
    let instructorId: number | null = null;
    if (data.role === "tandem") {
      if (!data.instructorId) throw new Error("Pick a tandem instructor");
      if (!data.jumpType) throw new Error("Pick regular, beach, or sunset");
      const instructors = await peopleQuery("where p.id = $1", data.instructorId);
      const instructor = instructors[0];
      if (!instructor || instructor.kind !== "instructor") throw new Error("That instructor is not on the list");
      const instructorIn = await sql.query(
        `select person_id from checkins where person_id = $1 and jump_date = $2 and instructor_in`,
        [data.instructorId, jumpDate],
      );
      if (!instructorIn[0]) throw new Error("That instructor is not checked in");
      const instructorBlock = jumpBlocker(instructor, jumpDate, "instructor");
      if (instructorBlock) throw new Error(`${instructor.name} cannot jump: ${instructorBlock}`);
      if (instructor.id === data.personId) throw new Error("The student and the instructor have to be two people");
      if (seated.some((slot) => slot.role === "tandem" && n(slot.instructor_id) === data.instructorId)) {
        throw new Error(`${instructor.name} already has a student on this load`);
      }
      const instructorSeat = seated.find((slot) => n(slot.person_id) === data.instructorId);
      if (instructorSeat && s(instructorSeat.role) !== "instructor") {
        throw new Error(`${instructor.name} is already on this load as a fun jumper`);
      }
      const instructorOnLoad = Boolean(instructorSeat);
      if (!instructorOnLoad) {
        const instructorElsewhere = await sql<{ id: unknown }>`
          select l.id
          from slots s
          join loads l on l.id = s.load_id
          where l.jump_date = ${jumpDate}
            and l.status <> 'landed'
            and s.person_id = ${data.instructorId}
            and s.role = 'fun_jumper'
          limit 1
        `;
        if (instructorElsewhere[0]) throw new Error(`${instructor.name} is still a fun jumper on a load that has not landed`);
      }
      const next = afterAdd(counts, instructorOnLoad ? "tandem" : "tandem_with_instructor");
      if (!canFinish(next)) throw new Error(seatRefusal(counts));
      instructorId = data.instructorId;
    } else {
      const next = afterAdd(counts, data.role === "instructor" ? "instructor" : "fun_jumper");
      if (!canFinish(next)) throw new Error(seatRefusal(counts));
    }
    const rows = await sql<{ id: unknown }>`
      insert into slots (load_id, person_id, role, instructor_id, jump_type, media, created_by)
      values (${data.loadId}, ${data.personId}, ${data.role}, ${instructorId}, ${data.jumpType}, ${data.media}, ${context.userId})
      returning id
    `;
    if (instructorId) {
      const onLoad = await sql<{ id: unknown }>`
        select id from slots where load_id = ${data.loadId} and person_id = ${instructorId}`;
      if (!onLoad[0]) {
        await sql`insert into slots (load_id, person_id, role, created_by)
          values (${data.loadId}, ${instructorId}, 'instructor', ${context.userId})`;
      }
    }
    await audit(
      context.userId,
      "assign_slot",
      "slot",
      String(n(rows[0]?.id)),
      `person ${data.personId} as ${data.role} on load ${data.loadId}`,
    );
    return { ok: true };
  });

export const removeSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slotId: number }) => ({ slotId: n(input.slotId) }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const slots = await sql<{
      id: unknown;
      load_id: unknown;
      person_id: unknown;
      instructor_id: unknown;
      role: unknown;
      status: unknown;
      person_name: unknown;
    }>`
      select s.id, s.load_id, s.person_id, s.instructor_id, s.role, l.status, p.name as person_name
      from slots s
      join loads l on l.id = s.load_id
      join people p on p.id = s.person_id
      where s.id = ${data.slotId}
    `;
    const slot = slots[0];
    if (!slot) throw new Error("That person is already off the load");
    if (s(slot.status) === "airborne" || s(slot.status) === "landed") {
      throw new Error("The plane is already airborne. You can't take someone off this load.");
    }
    const loadId = n(slot.load_id);
    const personId = n(slot.person_id);
    const role = s(slot.role);
    const removed = [s(slot.person_name)];
    if (role === "tandem") {
      const instructorId = n(slot.instructor_id);
      await sql`delete from slots where id = ${data.slotId}`;
      if (instructorId) {
        const stillPaired = await sql<{ id: unknown }>`
          select id from slots
          where load_id = ${loadId} and role = 'tandem' and instructor_id = ${instructorId}
          limit 1
        `;
        if (!stillPaired[0]) {
          const instructor = await sql<{ name: unknown }>`
            select p.name from slots s
            join people p on p.id = s.person_id
            where s.load_id = ${loadId} and s.role = 'instructor' and s.person_id = ${instructorId}
          `;
          if (instructor[0]) removed.push(s(instructor[0].name));
          await sql`delete from slots where load_id = ${loadId} and role = 'instructor' and person_id = ${instructorId}`;
        }
      }
    } else if (role === "instructor") {
      const students = await sql<{ name: unknown }>`
        select p.name
        from slots s
        join people p on p.id = s.person_id
        where s.load_id = ${loadId} and s.role = 'tandem' and s.instructor_id = ${personId}
      `;
      for (const student of students) removed.push(s(student.name));
      await sql`delete from slots where load_id = ${loadId} and role = 'tandem' and instructor_id = ${personId}`;
      await sql`delete from slots where id = ${data.slotId}`;
    } else {
      await sql`delete from slots where id = ${data.slotId}`;
    }
    await audit(
      context.userId,
      "remove_slot",
      "slot",
      String(data.slotId),
      `${removed.join(" and ")} off load ${loadId}`,
    );
    return { ok: true };
  });

type NewBooking = {
  personId: number;
  productId: string;
  photo: boolean;
  videoOnly?: boolean;
  date: string;
  depositCents: number;
  method: string;
  card: string;
};

export const createBooking = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: NewBooking): NewBooking => ({
    personId: n(input.personId),
    productId: input.productId,
    photo: Boolean(input.photo),
    videoOnly: Boolean(input.videoOnly) && !input.photo,
    date: cleanDate(input.date),
    depositCents: Math.max(0, Math.round(n(input.depositCents))),
    method: input.method === "cash" || input.method === "card_present" ? input.method : "stripe_test",
    card: input.card ?? "",
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const priced = quote(data.productId, data.photo, data.videoOnly);
    const shape = shapeFromProduct(data.productId, data.photo, data.videoOnly);
    if (data.depositCents > priced.total) throw new Error("Deposit is larger than the jump");
    if (data.depositCents > 0 && data.method === "stripe_test") assertTestCard(data.card);
    const sql = await getSql();
    const rows = await sql.query<{ id: unknown }>(
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, notes, jump_type, media, created_by)
       values ($1, $2, $3, $4, $5, '', $6, $7, $8) returning id`,
      [data.personId, priced.label, data.date, priced.total, data.depositCents, shape.jumpType, shape.media, context.userId],
    );
    const id = n(rows[0]?.id);
    if (data.depositCents > 0) {
      await sql`insert into ledger (person_id, booking_id, amount_cents, kind, method, note, actor_user_id)
        values (${data.personId}, ${id}, ${data.depositCents}, 'booking_payment', ${data.method}, 'Deposit', ${context.userId})`;
    }
    await audit(
      context.userId,
      "create_booking",
      "booking",
      String(id),
      `${priced.label} on ${data.date}, deposit ${data.depositCents}`,
    );
    return { id };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; status: string }) => {
    if (!["reserved", "checked_in", "jumped", "cancelled"].includes(input.status)) {
      throw new Error("Bad status");
    }
    return { id: n(input.id), status: input.status };
  })
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update bookings set status = ${data.status} where id = ${data.id}`;
    await audit(context.userId, "booking_status", "booking", String(data.id), data.status);
    return { ok: true };
  });

export const collectPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { bookingId: number; amountCents: number; method: string; card: string }) => ({
    bookingId: n(input.bookingId),
    amountCents: Math.round(n(input.amountCents)),
    method: input.method === "cash" || input.method === "card_present" ? input.method : "stripe_test",
    card: input.card ?? "",
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    if (data.amountCents === 0) throw new Error("Enter an amount");
    if (data.method === "stripe_test" && data.amountCents > 0) assertTestCard(data.card);
    const sql = await getSql();
    const rows = await sql<{ total_cents: unknown; paid_cents: unknown; person_id: unknown }>`
      select total_cents, paid_cents, person_id from bookings where id = ${data.bookingId}
    `;
    const row = rows[0];
    if (!row) throw new Error("Booking not found");
    const next = n(row.paid_cents) + data.amountCents;
    if (next < 0 || next > n(row.total_cents)) throw new Error("That amount doesn't fit the balance");
    await sql`update bookings set paid_cents = ${next} where id = ${data.bookingId}`;
    await sql`insert into ledger (person_id, booking_id, amount_cents, kind, method, note, actor_user_id)
      values (${n(row.person_id)}, ${data.bookingId}, ${data.amountCents}, 'booking_payment', ${data.method},
        ${data.amountCents < 0 ? "Refund" : "On-site payment"}, ${context.userId})`;
    await audit(
      context.userId,
      data.amountCents < 0 ? "refund" : "collect",
      "booking",
      String(data.bookingId),
      `${data.method} ${data.amountCents}`,
    );
    return { ok: true };
  });

export const fundWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { personId: number; amountCents: number; method: string; card: string }) => ({
    personId: n(input.personId),
    amountCents: Math.round(n(input.amountCents)),
    method: input.method === "cash" ? "cash" : "stripe_test",
    card: input.card ?? "",
  }))
  .handler(async ({ context, data }) => {
    const role = await roleOf(context.userId);
    if (data.amountCents < 500) throw new Error("Minimum top-up is $5");
    if (data.method === "stripe_test") assertTestCard(data.card);
    const sql = await getSql();
    const people = await sql<{ id: unknown; kind: unknown; linked_user_id: unknown; name: unknown }>`
      select id, kind, linked_user_id, name from people where id = ${data.personId}
    `;
    const person = people[0];
    if (!person) throw new Error("Account not found");
    if (s(person.kind) !== "fun_jumper") throw new Error("Only fun jumper accounts hold a balance");
    const linked = s(person.linked_user_id);
    if (!role && linked !== context.userId) throw new Error("That account isn't yours");
    if (!role && data.method === "cash") throw new Error("Cash is taken at the desk");
    await sql`insert into ledger (person_id, amount_cents, kind, method, note, actor_user_id)
      values (${data.personId}, ${data.amountCents}, 'wallet_credit', ${data.method}, 'Account top-up', ${context.userId})`;
    await audit(context.userId, "fund_wallet", "person", String(data.personId), `${data.method} ${data.amountCents}`);
    return { ok: true };
  });

export const spendWallet = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { personId: number; amountCents: number; note: string }) => ({
    personId: n(input.personId),
    amountCents: Math.round(n(input.amountCents || FUN_JUMP_CENTS)),
    note: (input.note ?? "Jump ticket").trim().slice(0, 160),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    if (data.amountCents <= 0) throw new Error("Enter an amount");
    const balance = await walletOf(data.personId);
    if (balance < data.amountCents) throw new Error("Not enough in the account");
    const sql = await getSql();
    await sql`insert into ledger (person_id, amount_cents, kind, method, note, actor_user_id)
      values (${data.personId}, ${-data.amountCents}, 'wallet_debit', 'account', ${data.note}, ${context.userId})`;
    await audit(context.userId, "spend_wallet", "person", String(data.personId), `${data.note} ${data.amountCents}`);
    return { ok: true };
  });

export const openMyAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { kind: string; name: string; phone: string }) => {
    const allowed = ["tandem", "fun_jumper", "instructor", "pilot", "manifest"];
    return {
      kind: allowed.includes(input.kind) ? input.kind : "fun_jumper",
      name: cleanName(input.name ?? ""),
      phone: (input.phone ?? "").trim().slice(0, 40),
    };
  })
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ id: unknown }>`select id from people where linked_user_id = ${context.userId}`;
    if (existing[0]) return { id: n(existing[0].id), pending: false };
    const user = await sql<{ email: unknown }>`select email from "user" where id = ${context.userId}`;
    const email = s(user[0]?.email);
    if (data.kind === "instructor" || data.kind === "pilot" || data.kind === "manifest") {
      const prior = await sql<{ status: unknown }>`select status from staff_requests where user_id = ${context.userId}`;
      if (s(prior[0]?.status) === "approved") throw new Error("This staff account is already confirmed");
      await sql`insert into staff_requests (user_id, name, email, phone, staff_role, status)
        values (${context.userId}, ${data.name}, ${email}, ${data.phone}, ${data.kind}, 'pending')
        on conflict (user_id) do update
          set name = ${data.name}, email = ${email}, phone = ${data.phone}, staff_role = ${data.kind}, status = 'pending'`;
      await audit(context.userId, "staff_request", "staff_request", context.userId, `${data.kind}: ${data.name}`);
      const emailed = await emailAdminsAboutStaff(data.name, email, data.kind);
      return { id: 0, pending: true, emailed };
    }
    const rows = await sql<{ id: unknown }>`
      insert into people (kind, name, email, phone, linked_user_id, created_by)
      values (${data.kind}, ${data.name}, ${email}, ${data.phone}, ${context.userId}, ${context.userId})
      returning id
    `;
    const id = n(rows[0]?.id);
    await audit(context.userId, "open_account", "person", String(id), `${data.kind}: ${data.name}`);
    return { id, pending: false, emailed: false };
  });

export const bookSelf = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { productId: string; photo: boolean; videoOnly?: boolean; date: string; depositCents: number; card: string }) => ({
    productId: input.productId,
    photo: Boolean(input.photo),
    videoOnly: Boolean(input.videoOnly) && !input.photo,
    date: cleanDate(input.date),
    depositCents: Math.round(n(input.depositCents)),
    card: input.card ?? "",
  }))
  .handler(async ({ context, data }) => {
    const priced = quote(data.productId, data.photo, data.videoOnly);
    const shape = shapeFromProduct(data.productId, data.photo, data.videoOnly);
    if (data.depositCents < 10000) throw new Error("A $100 deposit holds the slot. It applies to the jump.");
    if (data.depositCents > priced.total) throw new Error("Deposit is larger than the jump");
    assertTestCard(data.card);
    const sql = await getSql();
    const mine = await sql<{ id: unknown; kind: unknown }>`
      select id, kind from people where linked_user_id = ${context.userId}
    `;
    let personId = n(mine[0]?.id);
    if (!personId) throw new Error("Open an account first");
    if (s(mine[0]?.kind) !== "tandem") {
      await sql`update people set kind = 'tandem' where id = ${personId}`;
    }
    const rows = await sql.query<{ id: unknown }>(
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, jump_type, media, created_by)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [personId, priced.label, data.date, priced.total, data.depositCents, shape.jumpType, shape.media, context.userId],
    );
    const id = n(rows[0]?.id);
    await sql`insert into ledger (person_id, booking_id, amount_cents, kind, method, note, actor_user_id)
      values (${personId}, ${id}, ${data.depositCents}, 'booking_payment', 'stripe_test', 'Online deposit', ${context.userId})`;
    await audit(context.userId, "self_book", "booking", String(id), `${priced.label} deposit ${data.depositCents}`);
    return { id };
  });

export const seedPractice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((date: string) => cleanDate(date))
  .handler(async ({ context, data: date }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const already = await sql.query<{ id: unknown }>(
      `select id from loads where jump_date = $1 and notes = 'practice' limit 1`,
      [date],
    );
    if (already[0]) throw new Error("Practice loads are already on this day");
    const names = [
      "Practice · Jordan Hale",
      "Practice · Sam Ortiz",
      "Practice · Maya Chen",
      "Practice · Chris Alvarez",
    ];
    const found = await sql<{ id: unknown; name: unknown }>`
      select id, name from people where name in ('Practice · Jordan Hale', 'Practice · Sam Ortiz', 'Practice · Maya Chen', 'Practice · Chris Alvarez')
      order by id
    `;
    const byName = new Map<string, number>();
    for (const row of found) if (!byName.has(s(row.name))) byName.set(s(row.name), n(row.id));
    async function practiceId(name: string, insert: () => Promise<number>) {
      return byName.get(name) ?? insert();
    }
    const iId = await practiceId(names[0], async () => {
      const rows = await sql<{ id: unknown }>`
        insert into people (kind, name, notes, uspa_license, created_by)
        values ('instructor', 'Practice · Jordan Hale', 'Sample instructor', 'D-99901', ${context.userId}) returning id`;
      return n(rows[0]?.id);
    });
    const pId = await practiceId(names[1], async () => {
      const rows = await sql<{ id: unknown }>`
        insert into people (kind, name, notes, created_by)
        values ('pilot', 'Practice · Sam Ortiz', 'Sample pilot', ${context.userId}) returning id`;
      return n(rows[0]?.id);
    });
    const tId = await practiceId(names[2], async () => {
      const rows = await sql<{ id: unknown }>`
        insert into people (kind, name, phone, notes, created_by)
        values ('tandem', 'Practice · Maya Chen', '361-555-0142', 'Sample tandem', ${context.userId}) returning id`;
      return n(rows[0]?.id);
    });
    const jId = await practiceId(names[3], async () => {
      const rows = await sql<{ id: unknown }>`
        insert into people (kind, name, notes, reserve_repack_on, waiver_signed_on, created_by)
        values ('fun_jumper', 'Practice · Chris Alvarez', 'Sample fun jumper', ${date}, ${date}, ${context.userId}) returning id`;
      return n(rows[0]?.id);
    });
    await sql`insert into checkins (person_id, jump_date, created_by) values
      (${iId}, ${date}, ${context.userId}),
      (${pId}, ${date}, ${context.userId}),
      (${jId}, ${date}, ${context.userId})`;
    const booking = await sql.query<{ id: unknown }>(
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, notes, jump_type, media, created_by)
       values ($1, 'Beach landing', $2, 49900, 10000, 'practice', 'beach', 'photo', $3) returning id`,
      [tId, date, context.userId],
    );
    const bId = n(booking[0]?.id);
    await sql`insert into ledger (person_id, booking_id, amount_cents, kind, method, note, actor_user_id)
      values (${tId}, ${bId}, 10000, 'booking_payment', 'stripe_test', 'Practice deposit', ${context.userId})`;
    await sql`insert into ledger (person_id, amount_cents, kind, method, note, actor_user_id)
      values (${jId}, 10000, 'wallet_credit', 'stripe_test', 'Practice top-up', ${context.userId})`;
    const load1 = await sql.query<{ id: unknown }>(
      `insert into loads (jump_date, load_number, call_time, notes, status, altitude_ft, tail_number, pilot_id, created_by)
       values ($1, coalesce((select max(load_number) from loads where jump_date = $1), 0) + 1, '10:00', 'practice', 'boarding', 10000, 'N2735Q', $2, $3)
       returning id`,
      [date, pId, context.userId],
    );
    const load2 = await sql.query<{ id: unknown }>(
      `insert into loads (jump_date, load_number, call_time, notes, altitude_ft, tail_number, created_by)
       values ($1, coalesce((select max(load_number) from loads where jump_date = $1), 0) + 1, '11:20', 'practice', 12000, 'N2700F', $2)
       returning id`,
      [date, context.userId],
    );
    const l1 = n(load1[0]?.id);
    const l2 = n(load2[0]?.id);
    await sql`insert into slots (load_id, person_id, role, instructor_id, jump_type, media, created_by) values
      (${l1}, ${iId}, 'instructor', null, '', '', ${context.userId}),
      (${l1}, ${tId}, 'tandem', ${iId}, 'beach', 'photo', ${context.userId}),
      (${l2}, ${jId}, 'fun_jumper', null, '', '', ${context.userId})`;
    await audit(context.userId, "seed_practice", "day", date, "Loaded practice people, a deposit, and two loads");
    return { ok: true };
  });

type ProfileInput = {
  id: number;
  uspaLicense: string;
  uspaRatings: string;
  uspaMemberNumber: string;
  uspaMemberExpires: string;
  waiverSignedOn: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  reserveRepackOn: string;
  notes: string;
  nojump: boolean;
  nojumpNote: string;
};

export const updatePerson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: ProfileInput): ProfileInput => ({
    id: n(input.id),
    uspaLicense: (input.uspaLicense ?? "").trim().slice(0, 40),
    uspaRatings: (input.uspaRatings ?? "").trim().slice(0, 120),
    uspaMemberNumber: (input.uspaMemberNumber ?? "").trim().slice(0, 40),
    uspaMemberExpires: (input.uspaMemberExpires ?? "").trim(),
    waiverSignedOn: (input.waiverSignedOn ?? "").trim(),
    emergencyName: (input.emergencyName ?? "").trim().slice(0, 80),
    emergencyRelationship: (input.emergencyRelationship ?? "").trim().slice(0, 40),
    emergencyPhone: (input.emergencyPhone ?? "").trim().slice(0, 40),
    reserveRepackOn: (input.reserveRepackOn ?? "").trim(),
    notes: (input.notes ?? "").trim().slice(0, 400),
    nojump: Boolean(input.nojump),
    nojumpNote: (input.nojumpNote ?? "").trim().slice(0, 240),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`update people set
      uspa_license = ${data.uspaLicense},
      uspa_ratings = ${data.uspaRatings},
      uspa_member_number = ${data.uspaMemberNumber},
      uspa_member_expires = ${dateOrNull(data.uspaMemberExpires)},
      waiver_signed_on = ${dateOrNull(data.waiverSignedOn)},
      emergency_name = ${data.emergencyName},
      emergency_relationship = ${data.emergencyRelationship},
      emergency_phone = ${data.emergencyPhone},
      reserve_repack_on = ${dateOrNull(data.reserveRepackOn)},
      notes = ${data.notes},
      nojump = ${data.nojump},
      nojump_note = ${data.nojumpNote}
      where id = ${data.id}`;
    await audit(context.userId, "update_person", "person", String(data.id), data.nojump ? `No-jump: ${data.nojumpNote}` : "Profile updated");
    return { ok: true };
  });

export const toggleCheckin = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { personId: number; date: string; on: boolean; funJump?: boolean }) => ({
    personId: n(input.personId),
    date: cleanDate(input.date),
    on: Boolean(input.on),
    funJump: Boolean(input.funJump),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const people = await peopleQuery("where p.id = $1", data.personId);
    const person = people[0];
    if (!person) throw new Error("Person not found");
    if (data.funJump) {
      if (person.kind !== "instructor") throw new Error("Only a tandem instructor can check in as a fun jumper");
      if (data.on) {
        const block = jumpBlocker(person, data.date, "fun_jumper");
        if (block) throw new Error(block);
        await sql`insert into checkins (person_id, jump_date, created_by, instructor_in, fun_jump)
          values (${data.personId}, ${data.date}, ${context.userId}, false, true)
          on conflict (person_id, jump_date) do update set fun_jump = true`;
      } else {
        await sql`update checkins set fun_jump = false where person_id = ${data.personId} and jump_date = ${data.date}`;
        await sql`delete from checkins
          where person_id = ${data.personId} and jump_date = ${data.date} and instructor_in = false and fun_jump = false`;
      }
      await audit(context.userId, data.on ? "check_in_fun_jump" : "check_out_fun_jump", "person", String(data.personId), data.date);
      return { ok: true };
    }
    if (person.kind === "instructor") {
      if (data.on) {
        await sql`insert into checkins (person_id, jump_date, created_by, instructor_in)
          values (${data.personId}, ${data.date}, ${context.userId}, true)
          on conflict (person_id, jump_date) do update set instructor_in = true`;
      } else {
        await sql`update checkins set instructor_in = false where person_id = ${data.personId} and jump_date = ${data.date}`;
        await sql`delete from checkins
          where person_id = ${data.personId} and jump_date = ${data.date} and instructor_in = false and fun_jump = false`;
      }
    } else if (data.on) {
      await sql`insert into checkins (person_id, jump_date, created_by)
        values (${data.personId}, ${data.date}, ${context.userId})
        on conflict (person_id, jump_date) do nothing`;
    } else {
      await sql`delete from checkins where person_id = ${data.personId} and jump_date = ${data.date}`;
    }
    await audit(context.userId, data.on ? "check_in" : "check_out", "person", String(data.personId), data.date);
    return { ok: true };
  });

export const setLoadPlan = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; callTime: string; altitudeFt: number; tailNumber: string; pilotId: number }) => ({
    id: n(input.id),
    callTime: /^\d{2}:\d{2}$/.test(input.callTime ?? "") ? input.callTime : "",
    altitudeFt: ALTITUDES.some((item) => item.ft === n(input.altitudeFt)) ? n(input.altitudeFt) : 10000,
    tailNumber: (TAILS as readonly string[]).includes(input.tailNumber) ? input.tailNumber : "",
    pilotId: n(input.pilotId),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const loads = await sql<{ jump_date: unknown }>`select jump_date::text as jump_date from loads where id = ${data.id}`;
    const jumpDate = day(loads[0]?.jump_date);
    if (!jumpDate) throw new Error("Load not found");
    if (!data.pilotId) throw new Error("Pick a pilot");
    const timeProblem = takeoffProblem(jumpDate, data.callTime);
    if (timeProblem) throw new Error(timeProblem);
    let pilotId: number | null = null;
    if (data.pilotId) {
      const pilots = await peopleQuery("where p.id = $1", data.pilotId);
      const pilot = pilots[0];
      if (!pilot || pilot.kind !== "pilot") throw new Error("Pick a pilot");
      const checked = await sql.query(
        `select person_id from checkins where person_id = $1 and jump_date = $2`,
        [data.pilotId, jumpDate],
      );
      if (!checked[0]) throw new Error("That pilot is not checked in");
      pilotId = data.pilotId;
    }
    await sql`update loads set
      call_time = ${data.callTime},
      altitude_ft = ${data.altitudeFt},
      tail_number = ${data.tailNumber},
      pilot_id = ${pilotId}
      where id = ${data.id}`;
    await audit(
      context.userId,
      "load_plan",
      "load",
      String(data.id),
      `${data.callTime} ${data.altitudeFt}ft ${data.tailNumber} pilot ${pilotId ?? "none"}`,
    );
    return { ok: true };
  });

export const listJumps = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((personId: number) => n(personId))
  .handler(async ({ context, data: personId }): Promise<JumpEntry[]> => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: unknown;
      jump_date: unknown;
      altitude_ft: unknown;
      tail_number: unknown;
      role: unknown;
      note: unknown;
    }>`select id, jump_date::text as jump_date, altitude_ft, tail_number, role, note
      from jump_log where person_id = ${personId} order by jump_date desc, id desc limit 200`;
    return rows.map((row) => ({
      id: n(row.id),
      jumpDate: day(row.jump_date),
      altitudeFt: n(row.altitude_ft),
      tailNumber: s(row.tail_number),
      role: s(row.role),
      note: s(row.note),
    }));
  });

export const addJump = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { personId: number; jumpDate: string; altitudeFt: number; tailNumber: string; note: string }) => ({
    personId: n(input.personId),
    jumpDate: cleanDate(input.jumpDate),
    altitudeFt: ALTITUDES.some((item) => item.ft === n(input.altitudeFt)) ? n(input.altitudeFt) : 10000,
    tailNumber: (input.tailNumber ?? "").trim().slice(0, 12),
    note: (input.note ?? "").trim().slice(0, 160),
  }))
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    await sql`insert into jump_log (person_id, jump_date, altitude_ft, tail_number, role, note, created_by)
      values (${data.personId}, ${data.jumpDate}, ${data.altitudeFt}, ${data.tailNumber}, 'logged', ${data.note}, ${context.userId})`;
    await audit(context.userId, "log_jump", "person", String(data.personId), data.jumpDate);
    return { ok: true };
  });

export const setMembership = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; role: string }) => {
    const role = input.role === "admin" ? "admin" : "staff";
    const email = (input.email ?? "").trim().toLowerCase().slice(0, 120);
    if (!email.includes("@")) throw new Error("Enter the email they used to sign up");
    return { email, role };
  })
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const users = await sql<{ id: unknown }>`select id from "user" where lower(email) = ${data.email}`;
    const userId = s(users[0]?.id);
    if (!userId) throw new Error("No login with that email yet. They sign up first.");
    if (userId === context.userId && data.role !== "admin") {
      const owners = await sql<{ n: unknown }>`select count(*) as n from memberships where role in ('owner', 'admin')`;
      if (n(owners[0]?.n) <= 1) throw new Error("Keep at least one admin");
    }
    await sql`insert into memberships (user_id, role) values (${userId}, ${data.role})
      on conflict (user_id) do update set role = ${data.role}`;
    await audit(context.userId, "set_membership", "membership", userId, `${data.email} ${data.role}`);
    return { ok: true };
  });

export const decideStaffRequest = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; approve: boolean }) => ({
    id: n(input.id),
    approve: Boolean(input.approve),
  }))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: unknown;
      user_id: unknown;
      name: unknown;
      email: unknown;
      phone: unknown;
      staff_role: unknown;
      status: unknown;
    }>`select id, user_id, name, email, phone, staff_role, status from staff_requests where id = ${data.id}`;
    const request = rows[0];
    if (!request) throw new Error("That request is gone");
    if (s(request.status) !== "pending") throw new Error("That request was already answered");
    if (!data.approve) {
      await sql`update staff_requests set status = 'declined' where id = ${data.id}`;
      await audit(context.userId, "decline_staff", "staff_request", String(data.id), s(request.email));
      return { ok: true };
    }
    const staffRole = s(request.staff_role);
    const kind = staffRole === "manifest" ? "crew" : staffRole;
    const userId = s(request.user_id);
    const linked = await sql<{ id: unknown }>`select id from people where linked_user_id = ${userId}`;
    if (!linked[0]) {
      await sql`insert into people (kind, name, email, phone, linked_user_id, created_by)
        values (${kind}, ${s(request.name)}, ${s(request.email)}, ${s(request.phone)}, ${userId}, ${context.userId})`;
    }
    if (staffRole === "manifest") {
      await sql`insert into memberships (user_id, role) values (${userId}, 'staff')
        on conflict (user_id) do nothing`;
    }
    await sql`update staff_requests set status = 'approved' where id = ${data.id}`;
    await audit(context.userId, "approve_staff", "staff_request", String(data.id), `${s(request.email)} ${staffRole}`);
    return { ok: true };
  });

function periodBounds(range: string, date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const iso = (value: Date) => value.toISOString().slice(0, 10);
  if (range === "week") {
    const weekday = dt.getUTCDay();
    const monday = new Date(dt);
    monday.setUTCDate(dt.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    return { from: iso(monday), to: iso(sunday) };
  }
  if (range === "month") {
    return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
  }
  if (range === "year") return { from: `${y}-01-01`, to: `${y}-12-31` };
  return { from: date, to: date };
}

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { range: string; date: string }) => ({
    range: ["week", "month", "year"].includes(input.range) ? input.range : "day",
    date: cleanDate(input.date),
  }))
  .handler(async ({ context, data }): Promise<Analytics> => {
    await requireAdmin(context.userId);
    const { from, to } = periodBounds(data.range, data.date);
    const sql = await getSql();
    const payments = await sql.query<{ tandem_cents: unknown; fun_cents: unknown }>(
      `select
         coalesce(sum(case when p.kind = 'fun_jumper' then l.amount_cents else 0 end), 0) as fun_cents,
         coalesce(sum(case when p.kind <> 'fun_jumper' then l.amount_cents else 0 end), 0) as tandem_cents
       from ledger l
       join people p on p.id = l.person_id
       left join bookings b on b.id = l.booking_id
       where l.kind = 'booking_payment'
         and coalesce(b.jump_date, l.created_at::date) between $1 and $2`,
      [from, to],
    );
    const tickets = await sql.query<{ cents: unknown }>(
      `select coalesce(sum(-l.amount_cents), 0) as cents
       from ledger l
       join people p on p.id = l.person_id
       where l.kind = 'wallet_debit' and p.kind = 'fun_jumper'
         and l.created_at::date between $1 and $2`,
      [from, to],
    );
    const loadRows = await sql.query<{
      id: unknown;
      load_number: unknown;
      jump_date: unknown;
      tail_number: unknown;
      altitude_ft: unknown;
      tandem_cents: unknown;
      fun_cents: unknown;
    }>(
      `select l.id, l.load_number, l.jump_date::text as jump_date, l.tail_number, l.altitude_ft,
         coalesce(sum(case when p.kind = 'tandem' then b.paid_cents else 0 end), 0) as tandem_cents,
         coalesce(sum(case when p.kind = 'fun_jumper' then b.paid_cents else 0 end), 0) as fun_cents
       from loads l
       left join slots s on s.load_id = l.id
       left join people p on p.id = s.person_id
       left join lateral (
         select paid_cents from bookings b
         where b.person_id = s.person_id and b.jump_date = l.jump_date and b.status <> 'cancelled'
         order by b.id desc limit 1
       ) b on true
       where l.jump_date between $1 and $2
       group by l.id
       order by l.jump_date, l.load_number`,
      [from, to],
    );
    return {
      range: data.range,
      from,
      to,
      tandemCents: n(payments[0]?.tandem_cents),
      funCents: n(payments[0]?.fun_cents) + n(tickets[0]?.cents),
      loads: loadRows.map((row) => ({
        id: n(row.id),
        loadNumber: n(row.load_number),
        jumpDate: day(row.jump_date),
        tailNumber: s(row.tail_number),
        altitudeFt: n(row.altitude_ft),
        tandemCents: n(row.tandem_cents),
        funCents: n(row.fun_cents),
      })),
    };
  });
