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

export function jumpBlocker(
  person: { kind: string; nojump: boolean; nojumpNote: string; reserveRepackOn: string },
  jumpDate: string,
) {
  if (person.nojump) return person.nojumpNote.trim() || "No-jump flag";
  if (person.kind === "fun_jumper" || person.kind === "instructor") {
    const exp = reserveExpires(person.reserveRepackOn);
    if (exp && exp < jumpDate) return `Reserve expired ${exp}`;
  }
  return "";
}

export function waiverCurrent(signedOn: string, jumpDate: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(signedOn) && signedOn.slice(0, 4) === jumpDate.slice(0, 4);
}
