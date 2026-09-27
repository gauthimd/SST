import { useEffect, useMemo, useState } from "react";
import { FUN_JUMP_CENTS, PRODUCTS, money, todayChicago } from "@/lib/catalog";
import {
  addSlot,
  bookSelf,
  claimDesk,
  collectPayment,
  createBooking,
  createLoad,
  createPerson,
  fundWallet,
  getMe,
  loadDesk,
  openMyAccount,
  seedPractice,
  setBookingStatus,
  setLoadStatus,
  spendWallet,
  type Booking,
  type Desk,
  type Load,
  type Me,
} from "@/lib/dz";

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

  return <StaffHome error={error} setError={setError} />;
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
  const [photo, setPhoto] = useState(false);
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
          <p className="mt-2 text-muted">If you run manifest, claim it. You become the owner. This only works once.</p>
          <button className="btn mt-4" disabled={busy} onClick={() => run(() => claimDesk())}>
            Claim the manifest
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
              <p className="text-sm text-muted">Stripe test mode. Use 4242 4242 4242 4242. Any future date, any CVC. No real charge.</p>
              <select className="field" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} · {money(p.cents)}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} />
                Add photo and video ({money(11900)}) — included on beach and sunset
              </label>
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
                        photo,
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

function StaffHome({ error, setError }: { error: string; setError: (s: string) => void }) {
  const [date, setDate] = useState(todayChicago());
  const [desk, setDesk] = useState<Desk | null>(null);
  const [tab, setTab] = useState<"loads" | "bookings" | "accounts" | "audit">("loads");
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

  const tabs = [
    ["loads", "Load clock"],
    ["bookings", "Bookings"],
    ["accounts", "Accounts"],
    ["audit", "Audit"],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Manifest</p>
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
        <AccountsPanel desk={desk} busy={busy} run={run} />
      ) : (
        <AuditPanel desk={desk} />
      )}
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
  const [personId, setPersonId] = useState("");
  const [role, setRole] = useState("tandem");
  const [loadId, setLoadId] = useState("");

  return (
    <div className="mt-6 space-y-4">
      <LoadClock loads={desk.loads} />
      <form
        className="card grid gap-3 p-4 md:grid-cols-[1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => createLoad({ data: { date, callTime, notes: "" } }));
        }}
      >
        <label className="text-sm">
          Call time for the next load
          <input className="field mt-1" type="time" value={callTime} onChange={(e) => setCallTime(e.target.value)} />
        </label>
        <button className="btn self-end" disabled={busy}>
          Add load
        </button>
      </form>
      {desk.loads.length === 0 ? <p className="text-muted">No loads this day. Add one, or drop in a practice day.</p> : null}
      {desk.loads.map((load) => (
        <article key={load.id} className="card p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">
              Load {load.loadNumber}
              {load.callTime ? <span className="text-sea"> · {load.callTime}</span> : null}
            </h2>
            <p className="text-sm uppercase tracking-wide text-muted">{load.status}</p>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            {load.slots.map((slot) => (
              <li key={slot.id}>
                {slot.personName} <span className="text-muted">· {slot.role.replace("_", " ")}</span>
              </li>
            ))}
            {load.slots.length === 0 ? <li className="text-muted">Empty load</li> : null}
          </ul>
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
      ))}
      <form
        className="card grid gap-3 p-4 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(() =>
            addSlot({ data: { loadId: Number(loadId), personId: Number(personId), role } }),
          );
        }}
      >
        <select className="field" value={loadId} onChange={(e) => setLoadId(e.target.value)} required>
          <option value="">Load</option>
          {desk.loads.map((l) => (
            <option key={l.id} value={l.id}>
              Load {l.loadNumber}
            </option>
          ))}
        </select>
        <select className="field" value={personId} onChange={(e) => setPersonId(e.target.value)} required>
          <option value="">Person</option>
          {desk.people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="tandem">Tandem</option>
          <option value="fun_jumper">Fun jumper</option>
          <option value="instructor">Instructor</option>
          <option value="videographer">Video</option>
        </select>
        <button className="btn" disabled={busy}>
          Put on load
        </button>
      </form>
    </div>
  );
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
          ? `Next call is load ${next.loadNumber} at ${next.callTime}${
              remain == null ? "" : remain >= 0 ? ` · ${remain} min` : " · past call"
            }`
          : "No call time set. Add a load and the clock will count to it."}
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
  const [photo, setPhoto] = useState(false);
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
                photo,
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} />
          Photo and video
        </label>
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
}: {
  desk: Desk;
  busy: boolean;
  run: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const [kind, setKind] = useState("tandem");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [personId, setPersonId] = useState("");
  const [amount, setAmount] = useState("30");
  const [card, setCard] = useState("");

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
          <option value="crew">Crew</option>
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
        {desk.people.map((p) => (
          <li key={p.id} className="card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted">
                {p.kind.replace("_", " ")}
                {p.phone ? ` · ${p.phone}` : ""}
              </p>
            </div>
            {p.kind === "fun_jumper" ? <p className="font-display text-2xl text-sea">{money(p.walletCents)}</p> : null}
          </li>
        ))}
      </ul>
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
