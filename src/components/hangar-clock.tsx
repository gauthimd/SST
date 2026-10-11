import { useEffect, useRef, useState } from "react";
import { loadClock, type Load } from "@/lib/dz";

const WIND_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=27.8339&longitude=-97.0611" +
  "&current=wind_speed_10m,wind_direction_10m,temperature_2m" +
  "&hourly=wind_speed_925hPa,wind_direction_925hPa,temperature_925hPa," +
  "wind_speed_850hPa,wind_direction_850hPa,temperature_850hPa," +
  "wind_speed_700hPa,wind_direction_700hPa,temperature_700hPa" +
  "&daily=sunset&wind_speed_unit=kn&temperature_unit=fahrenheit" +
  "&timezone=America/Chicago&forecast_days=1";

const ALTS = ["Ground", "3,000 ft", "6,000 ft", "10,000 ft"] as const;

type JumperRow = { name: string; ti: string; video: string; notes: string };
type Plane = { x: number; y: number; flip: boolean };

export function HangarClock({ date }: { date: string }) {
  const [loads, setLoads] = useState<Load[]>([]);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [timerOn, setTimerOn] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [winds, setWinds] = useState<Record<string, string>>({
    Ground: "--",
    "3,000 ft": "--",
    "6,000 ft": "--",
    "10,000 ft": "--",
  });
  const [sunset, setSunset] = useState("--");
  const [updated, setUpdated] = useState("Never");
  const [plane, setPlane] = useState<Plane | null>(null);
  const [full, setFull] = useState(false);

  const loadsRef = useRef<Load[]>([]);
  const indexRef = useRef(0);
  const pinnedRef = useRef(false);
  const zeroSinceRef = useRef<number | null>(null);
  const flyingRef = useRef(false);
  const tripsRef = useRef(0);
  const frameRef = useRef(0);
  const timerIds = useRef<number[]>([]);

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const loads = await loadClock({ data: date });
        if (stop) return;
        const sorted = [...loads].sort(byCall);
        const previousId = loadsRef.current[indexRef.current]?.id;
        const same = fingerprint(sorted) === fingerprint(loadsRef.current);
        loadsRef.current = sorted;
        if (!same) {
          if (!pinnedRef.current) indexRef.current = indexByTime(sorted, date);
          else {
            const found = sorted.findIndex((load) => load.id === previousId);
            indexRef.current = found >= 0 ? found : Math.max(0, Math.min(indexRef.current, sorted.length - 1));
          }
          setIndex(indexRef.current);
        }
        setLoads(sorted);
        setError("");
      } catch (e) {
        if (!stop) setError(e instanceof Error ? e.message : "Could not load the manifest");
      }
    }
    void pull();
    const poll = window.setInterval(() => void pull(), 5000);
    return () => {
      stop = true;
      window.clearInterval(poll);
    };
  }, [date]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") void toggleFull();
    }
    function onFull() {
      setFull(Boolean(document.fullscreenElement));
    }
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFull);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFull);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      timerIds.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function later(fn: () => void, ms: number) {
    const id = window.setTimeout(fn, ms);
    timerIds.current.push(id);
  }

  function fly(direction: "right" | "left") {
    if (tripsRef.current >= 2) {
      flyingRef.current = false;
      setPlane(null);
      return;
    }
    const width = window.innerWidth;
    const pass = tripsRef.current * 2 + (direction === "left" ? 1 : 0);
    const y = planeAltitude(pass);
    const from = direction === "right" ? -340 : width + 40;
    const to = direction === "right" ? width + 40 : -340;
    const started = performance.now();
    const step = (time: number) => {
      const p = Math.min(1, (time - started) / 4400);
      setPlane({ x: from + (to - from) * p, y, flip: direction === "left" });
      if (p < 1) {
        frameRef.current = requestAnimationFrame(step);
        return;
      }
      setPlane(null);
      if (direction === "right") later(() => fly("left"), 800);
      else {
        tripsRef.current += 1;
        later(() => fly("right"), 300);
      }
    };
    frameRef.current = requestAnimationFrame(step);
  }

  function startPlane() {
    if (flyingRef.current) return;
    flyingRef.current = true;
    tripsRef.current = 0;
    fly("right");
  }

  function markIfAlreadyZero() {
    const current = loadsRef.current[indexRef.current];
    const remain = current?.callTime ? secondsUntil(new Date(), date, current.callTime) : null;
    zeroSinceRef.current = remain != null && remain <= 0 ? Date.now() : null;
  }

  function go(delta: number) {
    const next = indexRef.current + delta;
    if (next < 0 || next >= loadsRef.current.length) return;
    indexRef.current = next;
    pinnedRef.current = true;
    markIfAlreadyZero();
    setIndex(next);
    setStatus("");
  }

  const current = loads[index];
  const pastDay = date < chicagoDate(now);
  const remain = timerOn && current?.callTime ? secondsUntil(now, date, current.callTime) : null;

  useEffect(() => {
    if (!timerOn || remain == null) return;
    if (pastDay) {
      zeroSinceRef.current = null;
      setStatus("Jump day is over");
      return;
    }
    if (remain > 0) {
      zeroSinceRef.current = null;
      setStatus("");
      return;
    }
    setStatus("LOAD TIME!");
    if (zeroSinceRef.current == null) {
      zeroSinceRef.current = Date.now();
      pinnedRef.current = false;
      startPlane();
      return;
    }
    if (!pinnedRef.current && Date.now() - zeroSinceRef.current >= 60_000) {
      const next = indexRef.current + 1;
      if (next < loadsRef.current.length) {
        indexRef.current = next;
        pinnedRef.current = true;
        markIfAlreadyZero();
        setIndex(next);
        setStatus("");
      }
    }
  }, [now, remain, timerOn, pastDay]);

  const shown = [0, 1, 2, 3].map((offset) => loads[index + offset] ?? null);
  const clock = chicagoClock(now);
  const counting = remain != null && remain > 0;
  const timeText = remain == null ? "00:00" : formatHms(Math.max(0, remain));
  const timeColor = !timerOn || remain == null ? "#ffffff" : remain <= 0 ? "#ff2222" : remain <= 60 ? "#ff4444" : "#ffffff";

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[#003399] text-white lg:overflow-hidden" data-board="hangar">
      <div className="flex min-h-full flex-col lg:h-full lg:min-h-0">
        <h1 className="shrink-0 px-3 py-2 text-center font-['Oswald',sans-serif] text-3xl tracking-wide text-[#00ff88] sm:text-4xl lg:py-[0.6vmin] lg:text-[clamp(1.5rem,4.2vmin,3.6rem)]">
          SKYDIVE SOUTH TEXAS
        </h1>
        <div className="flex flex-col gap-4 px-3 pb-8 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-0 lg:overflow-hidden lg:px-0 lg:pb-0">
          <div className="hidden min-h-0 min-w-0 flex-col overflow-hidden px-3 pb-3 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:flex">
            <img src="/clock/sstlogo.png" alt="Skydive South Texas" className="mx-auto h-auto max-h-[18vmin] w-auto max-w-full object-contain" />
            <div className="mt-2 min-h-0 flex-1">
              <img
                src="/clock/portasatview.png"
                alt="Mustang Island from above"
                className="h-full w-full object-contain"
              />
            </div>
          </div>

          <div className="@container flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden px-1 text-center lg:col-start-2 lg:row-start-1 lg:h-full lg:px-3">
              <p className="font-['Courier_New',monospace] text-4xl text-[#00ccff] sm:text-5xl lg:text-[clamp(1.6rem,14cqh,5.5rem)]">{clock}</p>
              <p className="mt-3 text-2xl font-bold text-[#cccccc] lg:mt-[1cqh] lg:text-[clamp(1rem,7cqh,2.2rem)]">{current ? `Load ${current.loadNumber} Call` : "Load Call"}</p>
              {timerOn ? (
                <p className="mt-2 font-['Courier_New',monospace] text-6xl leading-none font-bold tabular-nums sm:text-7xl lg:mt-[1cqh] lg:text-[clamp(2.6rem,30cqh,10rem)]" style={{ color: timeColor }}>
                  {timeText}
                </p>
              ) : null}
              <p className="mt-2 min-h-8 text-2xl font-bold text-[#ff2222] lg:min-h-[1.2em] lg:text-[clamp(0.9rem,5cqh,1.7rem)]">{status}</p>
              {error ? <p className="mt-1 max-w-sm text-sm text-[#ff8888]">{error}</p> : null}
              <div className="mt-2 flex max-w-full flex-wrap justify-center gap-2 lg:mt-[1cqh]">
                <ClockButton
                  color={timerOn ? "#00ff88" : "#ff8888"}
                  onClick={() => {
                    setTimerOn((on) => {
                      const next = !on;
                      if (next) {
                        pinnedRef.current = false;
                        markIfAlreadyZero();
                        if (zeroSinceRef.current != null) pinnedRef.current = true;
                      } else setStatus("");
                      return next;
                    });
                  }}
                >
                  {timerOn ? "TIMER: ON" : "TIMER: OFF"}
                </ClockButton>
                <ClockButton color="#00ccff" onClick={() => go(-1)}>
                  ◀ PREV
                </ClockButton>
                <ClockButton color="#00ccff" onClick={() => go(1)}>
                  NEXT ▶
                </ClockButton>
                <ClockButton color="#00ccff" onClick={() => void toggleFull()}>
                  {full ? "WINDOW" : "FULL"}
                </ClockButton>
              </div>
              {counting ? null : <p className="sr-only">Countdown {timeText}</p>}
          </div>

          <div className="@container order-3 flex h-auto min-h-0 min-w-0 flex-col items-center overflow-hidden px-1 pb-2 lg:order-none lg:col-start-2 lg:row-start-2 lg:h-full lg:justify-center lg:px-3 lg:pb-3">
              <p className="text-center text-lg font-bold text-[#00ccff] lg:text-[clamp(0.95rem,9cqh,1.7rem)]">WINDS & TEMP — PORT ARANSAS</p>
              <p className="text-sm text-[#88aacc] lg:text-[clamp(0.75rem,5cqh,1rem)]">(arrows point downwind)</p>
              <p className="mb-2 text-xs text-[#88aacc] lg:mb-[1cqh] lg:text-[clamp(0.7rem,4cqh,0.95rem)]">Last update: {updated}</p>
              {ALTS.map((alt) => (
                <p key={alt} className="grid w-full max-w-xl grid-cols-[auto_minmax(0,1fr)] gap-x-3 font-['Courier_New',monospace] text-sm text-white sm:text-base lg:text-[clamp(0.85rem,8cqh,1.8rem)]">
                  <span className="text-right text-[#cccccc]">{alt}:</span>
                  <span className="truncate">{winds[alt]}</span>
                </p>
              ))}
              <p className="mt-3 grid w-full max-w-xl grid-cols-[auto_minmax(0,1fr)] gap-x-3 font-['Courier_New',monospace] text-base lg:mt-[1.5cqh] lg:text-[clamp(0.9rem,8cqh,1.7rem)]">
                <span className="text-right text-[#cccccc]">Sunset today:</span> <span className="truncate text-[#00ff88]">{sunset}</span>
              </p>
              <p className="mt-2 text-xs text-[#6688bb] lg:mt-[1cqh] lg:text-[clamp(0.7rem,4cqh,0.95rem)]">Data source: Open-Meteo</p>
          </div>

          <CardColumn loads={shown} />
        </div>
      </div>

      {plane ? (
        <img
          src="/clock/N2700F.png"
          alt=""
          className="pointer-events-none absolute w-[280px]"
          style={{ left: plane.x, top: plane.y, transform: plane.flip ? "scaleX(-1)" : undefined }}
        />
      ) : null}
      <WindFetcher onWinds={setWinds} onSunset={setSunset} onUpdated={setUpdated} />
    </div>
  );
}

function planeAltitude(pass: number) {
  const height = window.innerHeight;
  const planeH = 84;
  const quarter = height / 4;
  const center = height - quarter * (Math.min(pass, 3) + 0.5);
  return Math.max(8, Math.min(center - planeH / 2, height - planeH - 8));
}

function CardColumn({ loads }: { loads: Array<Load | null> }) {
  return (
    <div className="@container order-2 flex min-w-0 flex-col justify-start gap-3 lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:min-h-0 lg:gap-[1.2cqh] lg:overflow-auto lg:px-3 lg:py-2">
      {loads.map((load, i) => (
        <LoadCard key={load?.id ?? `empty-${i}`} load={load} />
      ))}
    </div>
  );
}

function LoadCard({ load }: { load: Load | null }) {
  const rows = load ? jumperRows(load) : [];
  return (
    <article className={`${load ? "" : "hidden lg:block"} shrink-0 rounded-sm border-2 border-[#00ccff] bg-[#001a4d] px-3 py-2`}>
      {!load ? (
        <p className="py-1 text-center text-xl text-[#cccccc]">— no load —</p>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline gap-x-3 text-base lg:text-[clamp(0.8rem,3.4cqh,1.25rem)]">
            <p className="text-xl font-bold text-[#00ff88] lg:text-[clamp(0.95rem,4cqh,1.5rem)]">Load {load.loadNumber}</p>
            <p>Depart {load.callTime || "—"}</p>
            {load.tailNumber ? <p className="text-[#00ccff]">Tail: {load.tailNumber}</p> : null}
            {load.altitudeFt ? <p className="text-[#cccccc]">{load.altitudeFt.toLocaleString()} ft</p> : null}
            <p className="text-[#ffcc66]">Pilot: {load.pilotName ? displayName(load.pilotName) : "—"}</p>
          </div>
          <div className={`mt-2 grid ${LOAD_COLS} text-xs font-bold text-[#88aacc] lg:text-[clamp(0.7rem,2.8cqh,1rem)]`}>
            <span>Skydiver</span>
            <span>TI</span>
            <span className="lg:hidden">Video</span>
            <span className="hidden lg:inline">Photos/Video</span>
            <span>Notes</span>
          </div>
          <div className="my-1 h-px bg-[#004488]" />
          {rows.length === 0 ? (
            <p className="text-lg text-[#cccccc]">(no jumpers listed)</p>
          ) : (
            rows.map((row, i) => (
              <div key={`${row.name}-${i}`} className={`grid ${LOAD_COLS} text-sm leading-6 lg:text-[clamp(0.8rem,3.6cqh,1.35rem)] lg:leading-snug`}>
                <span className="min-w-0 truncate">{row.name}</span>
                <span className="min-w-0 truncate text-[#cccccc]">{row.ti}</span>
                <span className="min-w-0 truncate text-[#cccccc]">{row.video}</span>
                <span className="min-w-0 truncate text-[#aaccff]">{row.notes}</span>
              </div>
            ))
          )}
        </>
      )}
    </article>
  );
}

function ClockButton({ color, onClick, children }: { color: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      className="rounded border border-[#0044aa] bg-[#002266] px-3 py-2 text-base font-bold lg:px-[0.9rem] lg:py-[0.45rem] lg:text-[clamp(0.75rem,4cqh,1.05rem)]"
      style={{ color }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function WindFetcher({
  onWinds,
  onSunset,
  onUpdated,
}: {
  onWinds: (winds: Record<string, string>) => void;
  onSunset: (sunset: string) => void;
  onUpdated: (updated: string) => void;
}) {
  useEffect(() => {
    let stop = false;
    async function pull() {
      try {
        const response = await fetch(WIND_URL);
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (stop) return;
        const current = data.current ?? {};
        const hourly = data.hourly ?? {};
        const at = (key: string) => {
          const values = hourly[key];
          return Array.isArray(values) ? values[0] : null;
        };
        onWinds({
          Ground: windLine(current.wind_speed_10m, current.wind_direction_10m, current.temperature_2m),
          "3,000 ft": windLine(at("wind_speed_925hPa"), at("wind_direction_925hPa"), at("temperature_925hPa")),
          "6,000 ft": windLine(at("wind_speed_850hPa"), at("wind_direction_850hPa"), at("temperature_850hPa")),
          "10,000 ft": windLine(at("wind_speed_700hPa"), at("wind_direction_700hPa"), at("temperature_700hPa")),
        });
        onSunset(sunsetLabel(data.daily?.sunset?.[0]));
        onUpdated(chicagoClock(new Date()));
      } catch (e) {
        if (!stop) onUpdated(e instanceof Error ? `Error (${e.message.slice(0, 40)})` : "Error");
      }
    }
    void pull();
    const id = window.setInterval(() => void pull(), 300_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [onSunset, onUpdated, onWinds]);
  return null;
}

function jumperRows(load: Load): JumperRow[] {
  return load.slots.flatMap((slot) => {
    if (slot.role === "tandem") {
      const kind = slot.jumpType === "beach" ? "Beach" : slot.jumpType === "sunset" ? "Sunset" : "";
      const notes = [kind, slot.note.trim()].filter(Boolean).join(" · ");
      return [{ name: displayName(slot.personName), ti: displayName(slot.instructorName), video: mediaMark(slot.media), notes }];
    }
    if (slot.role === "fun_jumper") return [{ name: displayName(slot.personName), ti: "", video: "", notes: "FJ" }];
    return [];
  });
}

function displayName(name: string) {
  return name.replace(/^Practice\s*·\s*/, "").trim();
}

function mediaMark(media: string) {
  if (media === "photo") return "P/V";
  if (media === "video") return "V";
  return "N";
}

const LOAD_COLS = "grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]";

function byCall(a: Load, b: Load) {
  const at = a.callTime || "99:99";
  const bt = b.callTime || "99:99";
  if (at !== bt) return at < bt ? -1 : 1;
  return a.loadNumber - b.loadNumber;
}

function fingerprint(loads: Load[]) {
  return loads
    .map(
      (load) =>
        `${load.id}:${load.status}:${load.callTime}:${load.tailNumber}:${load.pilotName}:${load.altitudeFt}:${load.slots
          .map((slot) => `${slot.id},${slot.personName},${slot.role},${slot.instructorName},${slot.media},${slot.jumpType},${slot.note}`)
          .join("|")}`,
    )
    .join("||");
}

function indexByTime(loads: Load[], jumpDate: string, now = new Date()) {
  if (jumpDate < chicagoDate(now)) return 0;
  const found = loads.findIndex((load) => {
    if (!load.callTime || load.status === "landed") return false;
    const remain = secondsUntil(now, jumpDate, load.callTime);
    return remain != null && remain >= 0;
  });
  if (found >= 0) return found;
  return Math.max(0, loads.length - 1);
}

function secondsUntil(now: Date, jumpDate: string, call: string) {
  const parts = chicagoParts(now);
  const [h, m] = call.split(":").map(Number);
  if ([h, m, parts.h, parts.m].some((n) => Number.isNaN(n))) return null;
  const callSeconds = h * 3600 + m * 60;
  const nowSeconds = parts.h * 3600 + parts.m * 60 + parts.s;
  return callSeconds - nowSeconds + daysBetween(chicagoDate(now), jumpDate) * 86400;
}

function daysBetween(fromIso: string, toIso: string) {
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

function chicagoDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function formatHms(total: number) {
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

function chicagoParts(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  return { h: get("hour"), m: get("minute"), s: get("second") };
}

function chicagoClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h12",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = get("hour").padStart(2, "0");
  const period = get("dayPeriod").toUpperCase();
  return `${hour}:${get("minute")}:${get("second")} ${period}`;
}

function windLine(speed: unknown, direction: unknown, temp: unknown) {
  if (typeof speed !== "number" || typeof direction !== "number") return "--";
  const arrow = downwindArrow(direction);
  const tempText = typeof temp === "number" ? `${Math.round(temp)}°F` : "--";
  return `${arrow}  ${Math.round(speed)} kts   ${tempText}`;
}

function downwindArrow(degrees: number) {
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const downwind = (degrees + 180) % 360;
  return arrows[Math.floor((downwind + 22.5) % 360 / 45)] ?? "·";
}

function sunsetLabel(value: unknown) {
  if (typeof value !== "string" || !value.includes("T")) return "--";
  const [hourText, minuteText] = value.split("T")[1].slice(0, 5).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return "--";
  const period = hour < 12 ? "AM" : "PM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

function toggleFull() {
  if (document.fullscreenElement) return document.exitFullscreen();
  return document.documentElement.requestFullscreen();
}
