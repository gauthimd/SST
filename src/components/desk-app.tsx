import { useEffect, useMemo, useState } from "react";
import { FUN_JUMP_CENTS, PRODUCTS, money, todayChicago } from "@/lib/catalog";
import {
  addJump,
  addSlot,
  bookSelf,
  claimDesk,
  collectPayment,
  createBooking,
  createLoad,
  createPerson,
  fundWallet,
  getAnalytics,
  getMe,
  isAdmin,
  listJumps,
  loadDesk,
  openMyAccount,
  seedPractice,
  setBookingStatus,
  setLoadPlan,
  setLoadStatus,
  setMembership,
  spendWallet,
  toggleCheckin,
  updatePerson,
  type Analytics,
  type Booking,
  type Desk,
  type JumpEntry,
  type Load,
  type Me,
  type Person,
} from "@/lib/dz";
import { ALTITUDES, TAILS, jumpBlocker, reserveExpires, waiverCurrent } from "@/lib/jumper";

function errText(e: unknown) {
  return e instanceof Error ? e.message : "Something didn't save";
}

export function DeskApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");

  async function refreshMe() {
    setMe(await getMe());
  }

  useEffect(() => {
    refreshMe().catch((e) => setError(errText(e)));
  }, []);

  if (!me) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="h-8 w-40 rounded-md bg-sand" />
      </div>
    );
  }

  if (!me.role) {
    return (
      <CustomerHome
        me={me}
        error={error}
        setError={setError}
        onChange={async () => {
          setError("");
          await refreshMe();
        }}
      />
    );
  }

  return <StaffHome me={me} error={error} setError={setError} />;
}

function CustomerHome({
  me,
  error,
  setError,
  onChange,
}: {
  me: Me;
  error: string;
  setError: (s: string) => void;
  onChange: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<"tandem" | "fun_jumper">("tandem");
  const [productId, setProductId] = useState<string>(PRODUCTS[0].id);
  const [media, setMedia] = useState("none");
  const [date, setDate] = useState(todayChicago());
  const [deposit, setDeposit] = useState("100");
  const [card, setCard] = useState("");
  const [topup, setTopup] = useState("50");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await onChange();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-5 py-6">
      <h1 className="text-4xl">Your account</h1>
      {!me.ownerExists ? (
        <section className="card p-5">
          <h2 className="text-2xl">No one is on the desk yet</h2>
          <p className="mt-2 text-muted">
            If you run the dropzone, claim the admin login. Manifest workers are added after they sign up. This only
            works once.
          </p>
          <button className="btn mt-4" disabled={busy} onClick={() => run(() => claimDesk())}>
            Claim admin
          </button>
        </section>
      ) : null}
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      {!me.person ? (
        <section className="card space-y-3 p-5">
          <h2 className="text-2xl">Open an account</h2>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={kind === "tandem" ? "btn" : "btn btn-ghost"} onClick={() => setKind("tandem")}>
              Tandem
            </button>
            <button
              type="button"
              className={kind === "fun_jumper" ? "btn" : "btn btn-ghost"}
              onClick={() => setKind("fun_jumper")}
            >
              Fun jumper
            </button>
          </div>
          <input className="field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <button className="btn" disabled={busy} onClick={() => run(() => openMyAccount({ data: { kind, name, phone } }))}>
            Save account
          </button>
        </section>
      ) : (
        <>
          <section className="card p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-sea uppercase">{me.person.kind.replace("_", " ")}</p>
            <h2 className="text-3xl">{me.person.name}</h2>
            {me.person.kind === "fun_jumper" ? (
              <p className="mt-2 font-display text-3xl text-sea">{money(me.person.walletCents)} on account</p>
            ) : null}
          </section>
          {me.person.kind !== "fun_jumper" ? (
            <section className="card space-y-3 p-5">
              <h2 className="text-2xl">Hold a tandem with a deposit</h2>
              <p className="text-sm text-muted">
                $100 holds the day and applies to the jump. If weather grounds you, it carries to the new date. Test card
                4242 4242 4242 4242. Nothing is charged.
              </p>
              <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} · {money(p.cents)}
                  </option>
                ))}
              </select>
              <select className="field" value={media} onChange={(e) => setMedia(e.target.value)}>
                <option value="none">No media add-on</option>
                <option value="video">Video only · {money(9900)}</option>
                <option value="photo">Photo and video · {money(11900)}</option>
              </select>
              <p className="text-sm text-muted">Beach and sunset jumps already include photo and video.</p>
              <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="field" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              <input className="field" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value)} />
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    bookSelf({
                      data: {
                        productId,
                        photo: media === "photo",
                        videoOnly: media === "video",
                        date,
                        depositCents: Math.round(Number(deposit) * 100),
                        card,
                      },
                    }),
                  )
                }
              >
                Pay deposit
              </button>
            </section>
          ) : (
            <section className="card space-y-3 p-5">
              <h2 className="text-2xl">Add money</h2>
              <p className="text-sm text-muted">Test card 4242 4242 4242 4242. The balance is what manifest spends when you jump.</p>
              <input className="field" inputMode="decimal" value={topup} onChange={(e) => setTopup(e.target.value)} />
              <input className="field" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value)} />
              <button
                className="btn"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    fundWallet({
                      data: {
                        personId: me.person!.id,
                        amountCents: Math.round(Number(topup) * 100),
                        method: "stripe_test",
                        card,
                      },
                    }),
                  )
                }
              >
                Add to account
              </button>
            </section>
          )}
          <BookingList bookings={me.bookings} />
        </>
      )}
    </div>
  );
}

function BookingList({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-2xl">Your jumps</h2>
      {bookings.map((b) => (
        <article key={b.id} className="card p-4">
          <p className="font-medium">{b.product}</p>
          <p className="text-sm text-muted">
            {b.jumpDate} · {b.status.replace("_", " ")} · paid {money(b.paidCents)} of {money(b.totalCents)}
          </p>
        </article>
      ))}
    </section>
  );
}

function StaffHome({ me, error, setError }: { me: Me; error: string; setError: (s: string) => void }) {
  const [date, setDate] = useState(todayChicago());
  const [desk, setDesk] = useState<Desk | null>(null);
  const admin = isAdmin(me.role);
  const [tab, setTab] = useState<"loads" | "bookings" | "accounts" | "checkin" | "audit" | "analytics">("loads");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setDesk(await loadDesk({ data: date }));
  }

  useEffect(() => {
    refresh().catch((e) => setError(errText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  const tabs: [typeof tab, string][] = [
    ["loads", "Load clock"],
    ["bookings", "Bookings"],
    ["accounts", "Accounts"],
    ["checkin", "Check-in"],
  ];
  if (admin) {
    tabs.push(["audit", "Audit"], ["analytics", "Analytics"]);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">
            {admin ? "Admin" : "Manifest"}
          </p>
          <h1 className="text-4xl">The desk</h1>
        </div>
        <label className="text-sm">
          Jump day
          <input className="field mt-1" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-coral">{error}</p> : null}
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "btn" : "btn btn-ghost"} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => seedPractice({ data: date }))}>
          Practice day
        </button>
      </div>
      {!desk ? (
        <div className="mt-6 h-40 rounded-xl bg-sand/70" />
      ) : tab === "loads" ? (
        <LoadsPanel desk={desk} busy={busy} run={run} date={date} />
      ) : tab === "bookings" ? (
        <BookingsPanel desk={desk} busy={busy} run={run} date={date} />
      ) : tab === "accounts" ? (
        <AccountsPanel desk={desk} busy={busy} run={run} date={date} admin={admin} />
      ) : tab === "checkin" ? (
        <CheckinPanel desk={desk} busy={busy} run={run} date={date} />
      ) : tab === "analytics" && admin ? (
        <AnalyticsPanel date={date} />
      ) : admin ? (
        <AuditPanel desk={desk} />
      ) : null}
    </div>
  );
}

function LoadsPanel({
  desk,
  busy,
  run,
  date,
}: {
  desk: Desk;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  date: string;
}) {
  const [callTime, setCallTime] = useState("10:00");
  const [altitudeFt, setAltitudeFt] = useState(10000);
  const [tailNumber, setTailNumber] = useState<string>(TAILS[0]);

  return (
    <div className="mt-6 space-y-4">
      <LoadClock loads={desk.loads} />
      <form
        className="card grid gap-3 p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => createLoad({ data: { date, callTime, altitudeFt, tailNumber } }));
        }}
      >
        <label className="text-sm">
          Takeoff
          <input className="field mt-1" type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
        </label>
        <label className="text-sm">
          Altitude
          <select className="field mt-1" value={altitudeFt} onChange={(e) => setAltitudeFt(Number(e.target.value))}>
            {ALTITUDES.map((item) => (
              <option key={item.ft} value={item.ft}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Plane
          <select className="field mt-1" value={tailNumber} onChange={(e) => setTailNumber(e.target.value)}>
            {TAILS.map((tail) => (
              <option key={tail} value={tail}>
                {tail}
              </option>
            ))}
          </select>
        </label>
        <button className="btn self-end" disabled={busy}>
          Add load
        </button>
      </form>
      {desk.loads.length === 0 ? <p className="text-muted">No loads this day. Add one, or drop in a practice day.</p> : null}
      {desk.loads.map((load) => (
        <LoadCard key={load.id} load={load} desk={desk} date={date} busy={busy} run={run} />
      ))}
    </div>
  );
}

function LoadCard({
  load,
  desk,
  date,
  busy,
  run,
}: {
  load: Load;
  desk: Desk;
  date: string;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  }) {
  const [callTime, setCallTime] = useState(load.callTime || "10:00");
  const [altitudeFt, setAltitudeFt] = useState(load.altitudeFt || 10000);
  const [tailNumber, setTailNumber] = useState(load.tailNumber || TAILS[0]);
  const [pilotId, setPilotId] = useState(load.pilotId ? String(load.pilotId) : "");
  const [role, setRole] = useState("fun_jumper");
  const [personId, setPersonId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [jumpType, setJumpType] = useState("regular");
  const [media, setMedia] = useState("none");
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const booking = desk.bookings.find((b) => String(b.personId) === personId && b.status !== "cancelled");
    if (!booking) return;
    if (booking.jumpType) setJumpType(booking.jumpType);
    if (booking.media) setMedia(booking.media === "none" ? "none" : booking.media);
  }, [personId, desk.bookings]);
  const pilots = available(desk, "pilot", date);
  const instructors = available(desk, "instructor", date);
  const funJumpers = available(desk, "fun_jumper", date);
  const tandems = desk.people.filter((p) => p.kind === "tandem" && !jumpBlocker(p, date));
  const choices = role === "tandem" ? tandems : role === "fun_jumper" ? funJumpers : role === "instructor" ? instructors : instructors;

  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl">
          Load {load.loadNumber}
          <span className="text-sea"> · {load.callTime || "no takeoff"}</span>
        </h2>
        <p className="text-sm uppercase tracking-wide text-muted">{load.status}</p>
      </div>
      <p className="mt-1 text-sm text-muted">
        {altitudeLabel(load.altitudeFt)}
        {load.tailNumber ? ` · ${load.tailNumber}` : ""}
        {load.pilotName ? ` · ${load.pilotName}` : " · no pilot"}
        {(load.status === "open" || load.status === "boarding") && load.callTime ? ` · ${countdown(load.callTime)}` : ""}
      </p>
      <form
        className="mt-3 grid gap-2 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            setLoadPlan({
              data: { id: load.id, callTime, altitudeFt, tailNumber, pilotId: Number(pilotId || 0) },
            }),
          );
        }}
      >
        <input className="field" type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} aria-label="Takeoff" />
        <select className="field" value={altitudeFt} onChange={(e) => setAltitudeFt(Number(e.target.value))}>
          {ALTITUDES.map((item) => (
            <option key={item.ft} value={item.ft}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="field" value={tailNumber} onChange={(e) => setTailNumber(e.target.value)}>
          {TAILS.map((tail) => (
            <option key={tail} value={tail}>
              {tail}
            </option>
          ))}
        </select>
        <select className="field" value={pilotId} onChange={(e) => setPilotId(e.target.value)}>
          <option value="">Pilot checked in</option>
          {pilots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button className="btn w-fit" disabled={busy}>
          Save load
        </button>
      </form>
      <ul className="mt-3 space-y-1 text-sm">
        {load.slots.map((slot) => (
          <li key={slot.id}>
            {slot.personName} <span className="text-muted">· {slotLabel(slot)}</span>
          </li>
        ))}
        {load.slots.length === 0 ? <li className="text-muted">Empty load</li> : null}
      </ul>
      <form
        className="mt-3 grid gap-2 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            addSlot({
              data: {
                loadId: load.id,
                personId: Number(personId),
                role,
                instructorId: Number(instructorId || 0),
                jumpType: role === "tandem" ? jumpType : "",
                media: role === "tandem" ? media : "",
              },
            }),
          );
        }}
      >
        <select className="field" value={role} onChange={(e) => { setRole(e.target.value); setPersonId(""); }}>
          <option value="fun_jumper">Fun jumper</option>
          <option value="tandem">Tandem</option>
          <option value="instructor">Instructor</option>
          <option value="videographer">Video</option>
        </select>
        <select className="field" required value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">{role === "tandem" ? "Tandem jumper" : "Checked in"}</option>
          {choices.map((p) => (
            <option key={p.id} value={p.id}>
              {optionLabel(p, desk)}
            </option>
          ))}
        </select>
        {role === "tandem" ? (
          <>
            <select className="field" required value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">Tandem instructor</option>
              {instructors.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select className="field" value={jumpType} onChange={(e) => setJumpType(e.target.value)}>
              <option value="regular">Regular</option>
              <option value="beach">Beach</option>
              <option value="sunset">Sunset beach</option>
            </select>
            <select className="field" value={media} onChange={(e) => setMedia(e.target.value)}>
              <option value="none">No video</option>
              <option value="video">Video</option>
              <option value="photo">Photos and video</option>
            </select>
          </>
        ) : null}
        <button className="btn w-fit" disabled={busy}>
          Put on load
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {["open", "boarding", "airborne", "landed"].map((status) => (
          <button
            key={status}
            type="button"
            className="btn btn-ghost min-h-10 capitalize"
            disabled={busy}
            onClick={() => run(() => setLoadStatus({ data: { id: load.id, status } }))}
          >
            {status}
          </button>
        ))}
      </div>
    </article>
  );
}

function optionLabel(person: Person, desk: Desk) {
  const booking = desk.bookings.find((b) => b.personId === person.id && b.status !== "cancelled");
  if (!booking || person.kind !== "tandem") return person.name;
  const jump = booking.jumpType === "beach" ? "beach" : booking.jumpType === "sunset" ? "sunset beach" : "regular";
  const media = booking.media === "photo" ? "photos & video" : booking.media === "video" ? "video" : "no media";
  return `${person.name} · ${jump} · ${media}`;
}

function available(desk: Desk, kind: string, date: string) {
  return desk.people.filter(
    (p) => p.kind === kind && desk.checkedInIds.includes(p.id) && !jumpBlocker(p, date),
  );
}

function altitudeLabel(ft: number) {
  return ALTITUDES.find((item) => item.ft === ft)?.label ?? `${ft} ft`;
}

function slotLabel(slot: Load["slots"][number]) {
  const role = slot.role.replaceAll("_", " ");
  if (slot.role !== "tandem") return role;
  const jump = slot.jumpType === "beach" ? "beach" : slot.jumpType === "sunset" ? "sunset beach" : "regular";
  const media = slot.media === "photo" ? "photos & video" : slot.media === "video" ? "video" : "no media";
  return `${jump} · ${media}${slot.instructorName ? ` · ${slot.instructorName}` : ""}`;
}

function countdown(takeoff: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  const [th, tm] = takeoff.split(":").map(Number);
  let diff = th * 3600 + tm * 60 - (get("hour") * 3600 + get("minute") * 60 + get("second"));
  const past = diff < 0;
  diff = Math.abs(diff);
  const hh = Math.floor(diff / 3600);
  const mm = Math.floor((diff % 3600) / 60);
  const ss = diff % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const text = hh > 0 ? `${hh}:${pad(mm)}:${pad(ss)}` : `${mm}:${pad(ss)}`;
  return past ? `${text} past takeoff` : `${text} to takeoff`;
}

function LoadClock({ loads }: { loads: Load[] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const clock = useMemo(() => chicagoClock(now), [now]);
  const next = loads.find((l) => (l.status === "open" || l.status === "boarding") && l.callTime);
  const remain = next ? minutesUntil(clock, next.callTime) : null;
  return (
    <section className="card bg-deep p-5 text-foam">
      <p className="kicker">Load clock · Port Aransas</p>
      <p className="mt-2 font-display text-6xl tabular-nums text-foam">{clock}</p>
      <p className="mt-2 text-sand">
        {next
          ? `Next takeoff is load ${next.loadNumber} at ${next.callTime}${
              remain == null ? "" : remain >= 0 ? ` · ${remain} min` : " · past takeoff"
            }`
          : "No takeoff set. Add a load and the clock counts down to it."}
      </p>
    </section>
  );
}

function chicagoClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

function minutesUntil(clock: string, call: string) {
  const [h, m] = clock.split(":").map(Number);
  const [ch, cm] = call.split(":").map(Number);
  if ([h, m, ch, cm].some((n) => Number.isNaN(n))) return null;
  return ch * 60 + cm - (h * 60 + m);
}

function BookingsPanel({
  desk,
  busy,
  run,
  date,
}: {
  desk: Desk;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  date: string;
}) {
  const [personId, setPersonId] = useState("");
  const [productId, setProductId] = useState<string>(PRODUCTS[0].id);
  const [media, setMedia] = useState("none");
  const [deposit, setDeposit] = useState("100");
  const [method, setMethod] = useState("stripe_test");
  const [card, setCard] = useState("");
  const [payId, setPayId] = useState("");
  const [payAmount, setPayAmount] = useState("");

  return (
    <div className="mt-6 space-y-4">
      <form
        className="card grid gap-3 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            createBooking({
              data: {
                personId: Number(personId),
                productId,
                photo: media === "photo",
                videoOnly: media === "video",
                date,
                depositCents: Math.round(Number(deposit || 0) * 100),
                method,
                card,
              },
            }),
          );
        }}
      >
        <h2 className="text-2xl">New booking</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="field" required value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Person</option>
            {desk.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input className="field" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="Deposit dollars" />
          <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="stripe_test">Stripe test card</option>
            <option value="cash">Cash</option>
            <option value="card_present">Card at the desk</option>
          </select>
        </div>
        <select className="field" value={media} onChange={(e) => setMedia(e.target.value)}>
          <option value="none">No media add-on</option>
          <option value="video">Video only · {money(9900)}</option>
          <option value="photo">Photo and video · {money(11900)}</option>
        </select>
        {method === "stripe_test" ? (
          <input className="field" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value)} />
        ) : null}
        <button className="btn w-fit" disabled={busy}>
          Save booking
        </button>
      </form>
      {desk.bookings.map((b) => {
        const due = b.totalCents - b.paidCents;
        return (
          <article key={b.id} className="card p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <h3 className="text-xl">{b.personName}</h3>
                <p className="text-sm text-muted">
                  {b.product} · {b.status.replaceAll("_", " ")} · due {money(due)}
                </p>
              </div>
              <p className="font-display text-2xl text-sea">{money(b.paidCents)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["checked_in", "jumped", "cancelled"].map((status) => (
                <button
                  key={status}
                  className="btn btn-ghost min-h-10"
                  disabled={busy}
                  onClick={() => run(() => setBookingStatus({ data: { id: b.id, status } }))}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </article>
        );
      })}
      <form
        className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          const booking = desk.bookings.find((b) => String(b.id) === payId);
          const cents = payAmount
            ? Math.round(Number(payAmount) * 100)
            : (booking?.totalCents ?? 0) - (booking?.paidCents ?? 0);
          void run(() => collectPayment({ data: { bookingId: Number(payId), amountCents: cents, method: "card_present", card: "" } }));
        }}
      >
        <select className="field" required value={payId} onChange={(e) => setPayId(e.target.value)}>
          <option value="">Collect balance</option>
          {desk.bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.personName} · due {money(b.totalCents - b.paidCents)}
            </option>
          ))}
        </select>
        <input className="field" placeholder="Dollars, blank = full balance" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
        <button className="btn" disabled={busy}>
          Charge at desk
        </button>
      </form>
    </div>
  );
}

function AccountsPanel({
  desk,
  busy,
  run,
  date,
  admin,
}: {
  desk: Desk;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  date: string;
  admin: boolean;
}) {
  const [kind, setKind] = useState("tandem");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [personId, setPersonId] = useState("");
  const [amount, setAmount] = useState("30");
  const [card, setCard] = useState("");
  const [selected, setSelected] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantRole, setGrantRole] = useState("staff");

  return (
    <div className="mt-6 space-y-4">
      <form
        className="card grid gap-3 p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => createPerson({ data: { kind, name, email, phone, notes: "" } }));
        }}
      >
        <h2 className="text-2xl md:col-span-2">New account</h2>
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="tandem">Tandem</option>
          <option value="fun_jumper">Fun jumper</option>
          <option value="instructor">Tandem instructor</option>
          <option value="pilot">Pilot</option>
        </select>
        <input className="field" placeholder="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn w-fit" disabled={busy}>
          Create
        </button>
      </form>
      <form
        className="card grid gap-3 p-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            fundWallet({
              data: { personId: Number(personId), amountCents: Math.round(Number(amount) * 100), method: "stripe_test", card },
            }),
          );
        }}
      >
        <h2 className="text-2xl md:col-span-2">Add jumper money</h2>
        <select className="field" required value={personId} onChange={(e) => setPersonId(e.target.value)}>
          <option value="">Fun jumper</option>
          {desk.people
            .filter((p) => p.kind === "fun_jumper")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {money(p.walletCents)}
              </option>
            ))}
        </select>
        <input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className="field md:col-span-2" placeholder="4242 4242 4242 4242" value={card} onChange={(e) => setCard(e.target.value)} />
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button className="btn" disabled={busy}>
            Test-card top-up
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !personId}
            onClick={() =>
              run(() =>
                spendWallet({
                  data: { personId: Number(personId), amountCents: FUN_JUMP_CENTS, note: "Jump ticket" },
                }),
              )
            }
          >
            Take a {money(FUN_JUMP_CENTS)} jump ticket
          </button>
        </div>
      </form>
      <ul className="space-y-2">
        {desk.people.map((p) => {
          const block = jumpBlocker(p, date);
          return (
            <li key={p.id}>
              <button
                type="button"
                className="card flex w-full items-center justify-between gap-3 p-4 text-left"
                onClick={() => setSelected(String(p.id))}
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted">
                    {kindLabel(p.kind)}
                    {p.phone ? ` · ${p.phone}` : ""} · {p.jumpCount} jumps
                    {block ? ` · ${block}` : ""}
                    {!waiverCurrent(p.waiverSignedOn, date) && p.kind !== "pilot" ? " · waiver not signed this year" : ""}
                  </p>
                </div>
                {p.kind === "fun_jumper" ? <p className="font-display text-2xl text-sea">{money(p.walletCents)}</p> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {desk.people.find((p) => String(p.id) === selected) ? (
        <ProfileEditor person={desk.people.find((p) => String(p.id) === selected)!} busy={busy} run={run} date={date} />
      ) : null}
      {admin ? (
        <form
          className="card grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => setMembership({ data: { email: grantEmail, role: grantRole } }));
          }}
        >
          <h2 className="text-2xl md:col-span-3">Desk logins</h2>
          <p className="text-sm text-muted md:col-span-3">
            They create an account on the sign-in page first. Manifest workers run loads and accounts. Admins also get
            the audit trail and analytics.
          </p>
          <input className="field" type="email" required placeholder="Email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
          <select className="field" value={grantRole} onChange={(e) => setGrantRole(e.target.value)}>
            <option value="staff">Manifest</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn" disabled={busy}>
            Grant
          </button>
        </form>
      ) : null}
    </div>
  );
}

function kindLabel(kind: string) {
  if (kind === "fun_jumper") return "Fun jumper";
  if (kind === "instructor") return "Instructor";
  if (kind === "pilot") return "Pilot";
  if (kind === "tandem") return "Tandem";
  return kind.replaceAll("_", " ");
}

function ProfileEditor({
  person,
  busy,
  run,
  date,
}: {
  person: Person;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  date: string;
}) {
  const [form, setForm] = useState(person);
  const [jumps, setJumps] = useState<JumpEntry[]>([]);
  const [logDate, setLogDate] = useState(date);
  const [logNote, setLogNote] = useState("");
  const rig = person.kind === "fun_jumper" || person.kind === "instructor";
  useEffect(() => {
    setForm(person);
  }, [person]);
  useEffect(() => {
    listJumps({ data: person.id }).then(setJumps).catch(() => setJumps([]));
  }, [person.id, person.jumpCount]);
  const exp = reserveExpires(form.reserveRepackOn);
  const block = jumpBlocker(form, date);
  function set<K extends keyof Person>(key: K, value: Person[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() =>
          updatePerson({
            data: {
              id: person.id,
              uspaLicense: form.uspaLicense,
              uspaRatings: form.uspaRatings,
              uspaMemberNumber: form.uspaMemberNumber,
              uspaMemberExpires: form.uspaMemberExpires,
              waiverSignedOn: form.waiverSignedOn,
              emergencyName: form.emergencyName,
              emergencyRelationship: form.emergencyRelationship,
              emergencyPhone: form.emergencyPhone,
              reserveRepackOn: form.reserveRepackOn,
              notes: form.notes,
              nojump: form.nojump,
              nojumpNote: form.nojumpNote,
            },
          }),
        );
      }}
    >
      <h2 className="text-2xl">{person.name}</h2>
      {block ? <p className="text-sm text-coral">{block}</p> : null}
      <p className="text-sm text-muted">
        Waiver {waiverCurrent(form.waiverSignedOn, date) ? "signed this year" : "not signed this year"}.
        {person.kind === "tandem" ? " Tandem jump type and media are set on the load, from their booking." : ""}
      </p>
      <label className="block text-sm">
        Waiver signed
        <input className="field mt-1" type="date" value={form.waiverSignedOn} onChange={(e) => set("waiverSignedOn", e.target.value)} />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <input className="field" placeholder="Emergency name" value={form.emergencyName} onChange={(e) => set("emergencyName", e.target.value)} />
        <input className="field" placeholder="Relationship" value={form.emergencyRelationship} onChange={(e) => set("emergencyRelationship", e.target.value)} />
        <input className="field" placeholder="Emergency phone" value={form.emergencyPhone} onChange={(e) => set("emergencyPhone", e.target.value)} />
      </div>
      {rig ? (
        <div className="grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="USPA license number" value={form.uspaLicense} onChange={(e) => set("uspaLicense", e.target.value)} />
          <input className="field" placeholder="Ratings held" value={form.uspaRatings} onChange={(e) => set("uspaRatings", e.target.value)} />
          <input className="field" placeholder="USPA membership number" value={form.uspaMemberNumber} onChange={(e) => set("uspaMemberNumber", e.target.value)} />
          <label className="text-sm">
            Membership expires
            <input className="field mt-1" type="date" value={form.uspaMemberExpires} onChange={(e) => set("uspaMemberExpires", e.target.value)} />
          </label>
          <label className="text-sm">
            Reserve repack
            <input className="field mt-1" type="date" value={form.reserveRepackOn} onChange={(e) => set("reserveRepackOn", e.target.value)} />
          </label>
          <p className="self-end text-sm text-muted">{exp ? `Reserve expires ${exp} (180 days)` : "No repack date yet"}</p>
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.nojump} onChange={(e) => set("nojump", e.target.checked)} />
        No-jump flag
      </label>
      <input className="field" placeholder="Why they cannot jump" value={form.nojumpNote} onChange={(e) => set("nojumpNote", e.target.value)} />
      <textarea className="field min-h-20" placeholder="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      <button className="btn" disabled={busy}>
        Save record
      </button>
      <div className="border-t border-line pt-3">
        <h3 className="text-xl">Jump log</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {jumps.length === 0 ? <li className="text-muted">No jumps logged yet. Marking a load landed writes one for everyone on it.</li> : null}
          {jumps.map((jump) => (
            <li key={jump.id}>
              {jump.jumpDate} · {jump.role || "jump"}
              {jump.altitudeFt ? ` · ${jump.altitudeFt} ft` : ""}
              {jump.tailNumber ? ` · ${jump.tailNumber}` : ""}
              {jump.note ? ` · ${jump.note}` : ""}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="field w-auto" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
          <input className="field w-auto" placeholder="Note" value={logNote} onChange={(e) => setLogNote(e.target.value)} />
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await addJump({ data: { personId: person.id, jumpDate: logDate, altitudeFt: 10000, tailNumber: "", note: logNote } });
                setJumps(await listJumps({ data: person.id }));
              })
            }
          >
            Add past jump
          </button>
        </div>
      </div>
    </form>
  );
}

function CheckinPanel({
  desk,
  busy,
  run,
  date,
}: {
  desk: Desk;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  date: string;
}) {
  const groups = [
    ["fun_jumper", "Fun jumpers"],
    ["instructor", "Tandem instructors"],
    ["pilot", "Pilots"],
  ] as const;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {groups.map(([kind, title]) => (
        <section key={kind} className="card p-4">
          <h2 className="text-2xl">{title}</h2>
          <ul className="mt-3 space-y-2">
            {desk.people.filter((p) => p.kind === kind).length === 0 ? <li className="text-sm text-muted">None yet.</li> : null}
            {desk.people
              .filter((p) => p.kind === kind)
              .map((p) => {
                const on = desk.checkedInIds.includes(p.id);
                const block = jumpBlocker(p, date);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm">
                      {p.name}
                      {block ? <span className="block text-coral">{block}</span> : null}
                      {!block && (kind === "fun_jumper" || kind === "instructor") && !p.reserveRepackOn ? (
                        <span className="block text-muted">No reserve date</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      className={on ? "btn" : "btn btn-ghost"}
                      disabled={busy}
                      onClick={() => run(() => toggleCheckin({ data: { personId: p.id, date, on: !on } }))}
                    >
                      {on ? "In" : "Out"}
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AnalyticsPanel({ date }: { date: string }) {
  const [range, setRange] = useState("day");
  const [report, setReport] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    getAnalytics({ data: { range, date } })
      .then((next) => {
        setReport(next);
        setError("");
      })
      .catch((e) => setError(errText(e)));
  }, [range, date]);
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          ["day", "Day"],
          ["week", "Week"],
          ["month", "Month"],
          ["year", "Year"],
        ].map(([id, label]) => (
          <button key={id} type="button" className={range === id ? "btn" : "btn btn-ghost"} onClick={() => setRange(id)}>
            {label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-coral">{error}</p> : null}
      {report ? (
        <>
          <p className="text-sm text-muted">
            {report.from} to {report.to}. Tandem money is deposits and on-site payments. Fun jumper money adds jump
            tickets pulled from accounts.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="card p-4">
              <p className="text-sm text-muted">Tandem</p>
              <p className="font-display text-4xl text-sea">{money(report.tandemCents)}</p>
            </article>
            <article className="card p-4">
              <p className="text-sm text-muted">Fun jumper</p>
              <p className="font-display text-4xl text-sea">{money(report.funCents)}</p>
            </article>
            <article className="card p-4">
              <p className="text-sm text-muted">Together</p>
              <p className="font-display text-4xl">{money(report.tandemCents + report.funCents)}</p>
            </article>
          </div>
          <ul className="space-y-2">
            {report.loads.length === 0 ? <li className="text-muted">No loads in this window.</li> : null}
            {report.loads.map((load) => (
              <li key={load.id} className="card flex flex-wrap items-baseline justify-between gap-2 p-4">
                <p>
                  {load.jumpDate} · Load {load.loadNumber}
                  <span className="text-muted">
                    {" "}
                    · {load.tailNumber || "no plane"} · {load.altitudeFt} ft
                  </span>
                </p>
                <p className="text-sm">
                  Booked tandem {money(load.tandemCents)} · booked fun {money(load.funCents)}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function AuditPanel({ desk }: { desk: Desk }) {
  return (
    <ol className="mt-6 space-y-2">
      {desk.audit.length === 0 ? <p className="text-muted">Nothing recorded yet.</p> : null}
      {desk.audit.map((row) => (
        <li key={row.id} className="card p-4">
          <p className="text-sm font-medium">
            {row.action.replaceAll("_", " ")} · {row.entity} {row.entityId}
          </p>
          <p className="text-sm text-muted">{row.detail}</p>
          <p className="mt-1 text-xs text-muted">{row.at}</p>
        </li>
      ))}
    </ol>
  );
}
