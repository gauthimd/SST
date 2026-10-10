export const TAILS = ["N2735Q", "N2700F"] as const;

export const ALTITUDES = [
  { ft: 6000, label: "Hop and pop · 6,000 ft" },
  { ft: 10000, label: "Standard · 10,000 ft" },
  { ft: 12000, label: "Fun jumper · 12,000 ft" },
] as const;

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function reserveExpires(repack: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(repack)) return "";
  return addDays(repack, 180);
}

type JumpPerson = {
  kind: string;
  nojump: boolean;
  nojumpNote: string;
  reserveRepackOn: string;
  uspaMemberNumber: string;
  uspaMemberExpires: string;
  waiverSignedOn: string;
};

function iso(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function jumpBlocker(person: JumpPerson, jumpDate: string) {
  if (person.nojump) return person.nojumpNote.trim() || "No-jump flag";
  const jumps = person.kind === "fun_jumper" || person.kind === "instructor" || person.kind === "tandem";
  if (person.kind === "fun_jumper" || person.kind === "instructor") {
    if (!iso(person.reserveRepackOn)) return "No-jump: reserve repack date is missing";
    const exp = reserveExpires(person.reserveRepackOn);
    if (exp < jumpDate) return `No-jump: reserve expired ${exp}`;
    if (!person.uspaMemberNumber.trim() || !iso(person.uspaMemberExpires)) return "No-jump: USPA membership is missing";
    if (person.uspaMemberExpires < jumpDate) return `No-jump: USPA membership expired ${person.uspaMemberExpires}`;
  }
  if (jumps && !waiverCurrent(person.waiverSignedOn, jumpDate)) return "No-jump: waiver is not signed this year";
  return "";
}

export function waiverCurrent(signedOn: string, jumpDate: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(signedOn) && signedOn.slice(0, 4) === jumpDate.slice(0, 4);
}
