import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { FUN_JUMP_CENTS, assertTestCard, quote } from "@/lib/catalog";

export type Role = "owner" | "staff";

export type Person = {
  id: number;
  kind: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  walletCents: number;
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
};

export type Slot = {
  id: number;
  personId: number;
  personName: string;
  role: string;
};

export type Load = {
  id: number;
  loadNumber: number;
  status: string;
  callTime: string;
  notes: string;
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
};

export type Desk = {
  loads: Load[];
  bookings: Booking[];
  people: Person[];
  audit: Audit[];
};

function n(v: unknown) {
  return typeof v === "number" ? v : Number(v ?? 0);
}

function s(v: unknown) {
  return v == null ? "" : String(v);
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
  return role === "owner" || role === "staff" ? role : null;
}

async function requireStaff(userId: string) {
  const role = await roleOf(userId);
  if (!role) throw new Error("Manifest staff only");
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
}): Person {
  return {
    id: n(row.id),
    kind: s(row.kind),
    name: s(row.name),
    email: s(row.email),
    phone: s(row.phone),
    notes: s(row.notes),
    walletCents: n(row.wallet_cents),
  };
}

async function peopleQuery(whereSql: string, arg?: string) {
  const sql = await getSql();
  const q = `
    select p.id, p.kind, p.name, p.email, p.phone, p.notes,
      coalesce((select sum(amount_cents) from ledger l
        where l.person_id = p.id and l.kind in ('wallet_credit', 'wallet_debit')), 0) as wallet_cents
    from people p
    ${whereSql}
    order by p.name
  `;
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
  };
}

const bookingSelect = `
  select b.id, b.person_id, p.name as person_name, b.product, b.jump_date::text as jump_date,
    b.total_cents, b.paid_cents, b.status, b.notes
  from bookings b
  join people p on p.id = b.person_id
`;

function cleanDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Pick a date");
  return date;
}

function cleanName(name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 2) throw new Error("Name is required");
  return trimmed.slice(0, 80);
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
    return { role, ownerExists: n(owners[0]?.n) > 0, person, bookings };
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
    await requireStaff(context.userId);
    const sql = await getSql();
    const loadRows = await sql.query<{
      id: unknown;
      load_number: unknown;
      status: unknown;
      call_time: unknown;
      notes: unknown;
    }>(
      `select id, load_number, status, call_time, notes from loads where jump_date = $1 order by load_number`,
      [date],
    );
    const slotRows = await sql.query<{
      id: unknown;
      load_id: unknown;
      person_id: unknown;
      person_name: unknown;
      role: unknown;
    }>(
      `select s.id, s.load_id, s.person_id, p.name as person_name, s.role
       from slots s join people p on p.id = s.person_id
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
      slots: slotRows
        .filter((slot) => n(slot.load_id) === n(row.id))
        .map((slot) => ({
          id: n(slot.id),
          personId: n(slot.person_id),
          personName: s(slot.person_name),
          role: s(slot.role),
        })),
    }));
    const bookings = (
      await sql.query<Parameters<typeof mapBooking>[0]>(
        `${bookingSelect} where b.jump_date = $1 order by b.id`,
        [date],
      )
    ).map(mapBooking);
    const people = await peopleQuery("");
    const auditRows = await sql<{
      id: unknown;
      action: unknown;
      entity: unknown;
      entity_id: unknown;
      detail: unknown;
      at: unknown;
    }>`select id, action, entity, entity_id, detail, created_at::text as at
      from audit_log order by id desc limit 40`;
    return {
      loads,
      bookings,
      people,
      audit: auditRows.map((row) => ({
        id: n(row.id),
        action: s(row.action),
        entity: s(row.entity),
        entityId: s(row.entity_id),
        detail: s(row.detail),
        at: s(row.at),
      })),
    };
  });

type NewPerson = { kind: string; name: string; email: string; phone: string; notes: string };

export const createPerson = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: NewPerson): NewPerson => {
    const kind = input.kind === "tandem" || input.kind === "crew" ? input.kind : "fun_jumper";
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
  .validator((input: { date: string; callTime: string; notes: string }) => ({
    date: cleanDate(input.date),
    callTime: /^\d{2}:\d{2}$/.test(input.callTime ?? "") ? input.callTime : "",
    notes: (input.notes ?? "").trim().slice(0, 200),
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
      `insert into loads (jump_date, load_number, call_time, notes, created_by)
       values ($1, $2, $3, $4, $5) returning id`,
      [data.date, loadNumber, data.callTime, data.notes, context.userId],
    );
    const id = n(rows[0]?.id);
    await audit(
      context.userId,
      "create_load",
      "load",
      String(id),
      `Load ${loadNumber} on ${data.date}${data.callTime ? ` call ${data.callTime}` : ""}`,
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
    await audit(context.userId, "load_status", "load", String(data.id), data.status);
    return { ok: true };
  });

export const addSlot = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { loadId: number; personId: number; role: string }) => {
    const role = ["tandem", "fun_jumper", "instructor", "videographer"].includes(input.role)
      ? input.role
      : "tandem";
    return { loadId: n(input.loadId), personId: n(input.personId), role };
  })
  .handler(async ({ context, data }) => {
    await requireStaff(context.userId);
    const sql = await getSql();
    const rows = await sql<{ id: unknown }>`
      insert into slots (load_id, person_id, role, created_by)
      values (${data.loadId}, ${data.personId}, ${data.role}, ${context.userId})
      returning id
    `;
    await audit(
      context.userId,
      "assign_slot",
      "slot",
      String(n(rows[0]?.id)),
      `person ${data.personId} as ${data.role} on load ${data.loadId}`,
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
    if (data.depositCents > priced.total) throw new Error("Deposit is larger than the jump");
    if (data.depositCents > 0 && data.method === "stripe_test") assertTestCard(data.card);
    const sql = await getSql();
    const rows = await sql.query<{ id: unknown }>(
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, notes, created_by)
       values ($1, $2, $3, $4, $5, '', $6) returning id`,
      [data.personId, priced.label, data.date, priced.total, data.depositCents, context.userId],
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
  .validator((input: { kind: string; name: string; phone: string }) => ({
    kind: input.kind === "tandem" ? "tandem" : "fun_jumper",
    name: cleanName(input.name ?? ""),
    phone: (input.phone ?? "").trim().slice(0, 40),
  }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const existing = await sql<{ id: unknown }>`select id from people where linked_user_id = ${context.userId}`;
    if (existing[0]) return { id: n(existing[0].id) };
    const user = await sql<{ email: unknown }>`select email from "user" where id = ${context.userId}`;
    const rows = await sql<{ id: unknown }>`
      insert into people (kind, name, email, phone, linked_user_id, created_by)
      values (${data.kind}, ${data.name}, ${s(user[0]?.email)}, ${data.phone}, ${context.userId}, ${context.userId})
      returning id
    `;
    const id = n(rows[0]?.id);
    await audit(context.userId, "open_account", "person", String(id), `${data.kind}: ${data.name}`);
    return { id };
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
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, created_by)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [personId, priced.label, data.date, priced.total, data.depositCents, context.userId],
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
    const instructor = await sql<{ id: unknown }>`
      insert into people (kind, name, notes, created_by)
      values ('crew', 'Practice · Jordan Hale', 'Sample instructor', ${context.userId}) returning id`;
    const tandem = await sql<{ id: unknown }>`
      insert into people (kind, name, phone, notes, created_by)
      values ('tandem', 'Practice · Maya Chen', '361-555-0142', 'Sample tandem', ${context.userId}) returning id`;
    const jumper = await sql<{ id: unknown }>`
      insert into people (kind, name, notes, created_by)
      values ('fun_jumper', 'Practice · Chris Alvarez', 'Sample fun jumper', ${context.userId}) returning id`;
    const iId = n(instructor[0]?.id);
    const tId = n(tandem[0]?.id);
    const jId = n(jumper[0]?.id);
    const booking = await sql.query<{ id: unknown }>(
      `insert into bookings (person_id, product, jump_date, total_cents, paid_cents, notes, created_by)
       values ($1, 'Beach landing', $2, 49900, 10000, 'practice', $3) returning id`,
      [tId, date, context.userId],
    );
    const bId = n(booking[0]?.id);
    await sql`insert into ledger (person_id, booking_id, amount_cents, kind, method, note, actor_user_id)
      values (${tId}, ${bId}, 10000, 'booking_payment', 'stripe_test', 'Practice deposit', ${context.userId})`;
    await sql`insert into ledger (person_id, amount_cents, kind, method, note, actor_user_id)
      values (${jId}, 10000, 'wallet_credit', 'stripe_test', 'Practice top-up', ${context.userId})`;
    const load1 = await sql.query<{ id: unknown }>(
      `insert into loads (jump_date, load_number, call_time, notes, status, created_by)
       values ($1, coalesce((select max(load_number) from loads where jump_date = $1), 0) + 1, '10:00', 'practice', 'boarding', $2)
       returning id`,
      [date, context.userId],
    );
    const load2 = await sql.query<{ id: unknown }>(
      `insert into loads (jump_date, load_number, call_time, notes, created_by)
       values ($1, coalesce((select max(load_number) from loads where jump_date = $1), 0) + 1, '11:20', 'practice', $2)
       returning id`,
      [date, context.userId],
    );
    const l1 = n(load1[0]?.id);
    const l2 = n(load2[0]?.id);
    await sql`insert into slots (load_id, person_id, role, created_by) values
      (${l1}, ${iId}, 'instructor', ${context.userId}),
      (${l1}, ${tId}, 'tandem', ${context.userId}),
      (${l2}, ${jId}, 'fun_jumper', ${context.userId})`;
    await audit(context.userId, "seed_practice", "day", date, "Loaded practice people, a deposit, and two loads");
    return { ok: true };
  });
