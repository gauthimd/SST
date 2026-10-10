/** Pilot is not a seat. The other four seats only finish as one of these loads. */
export const LOAD_PATTERNS = [
  { instructors: 2, tandems: 2, funJumpers: 0 },
  { instructors: 1, tandems: 1, funJumpers: 2 },
  { instructors: 0, tandems: 0, funJumpers: 4 },
] as const;

export type SeatCounts = {
  instructors: number;
  tandems: number;
  funJumpers: number;
  others: number;
};

export function seatCounts(slots: { role: string }[]): SeatCounts {
  return {
    instructors: slots.filter((slot) => slot.role === "instructor").length,
    tandems: slots.filter((slot) => slot.role === "tandem").length,
    funJumpers: slots.filter((slot) => slot.role === "fun_jumper").length,
    others: slots.filter((slot) => slot.role !== "instructor" && slot.role !== "tandem" && slot.role !== "fun_jumper").length,
  };
}

export function passengerCount(counts: SeatCounts) {
  return counts.instructors + counts.tandems + counts.funJumpers + counts.others;
}

export function canFinish(counts: SeatCounts) {
  if (counts.others > 0) return false;
  return LOAD_PATTERNS.some(
    (end) => counts.instructors <= end.instructors && counts.tandems <= end.tandems && counts.funJumpers <= end.funJumpers,
  );
}

export function isFull(counts: SeatCounts) {
  if (passengerCount(counts) >= 4) return true;
  return LOAD_PATTERNS.some(
    (end) =>
      counts.instructors === end.instructors && counts.tandems === end.tandems && counts.funJumpers === end.funJumpers,
  );
}

export function afterAdd(counts: SeatCounts, add: "fun_jumper" | "instructor" | "tandem" | "tandem_with_instructor"): SeatCounts {
  if (add === "fun_jumper") return { ...counts, funJumpers: counts.funJumpers + 1 };
  if (add === "instructor") return { ...counts, instructors: counts.instructors + 1 };
  if (add === "tandem") return { ...counts, tandems: counts.tandems + 1 };
  return { ...counts, instructors: counts.instructors + 1, tandems: counts.tandems + 1 };
}

export function seatRefusal(counts: SeatCounts) {
  if (isFull(counts)) return "This load is full. The plane holds the pilot plus 4 people.";
  return "That mix doesn't fit. A load is 2 instructors and 2 tandem students, 1 instructor with 1 tandem student and 2 fun jumpers, or 4 fun jumpers.";
}
