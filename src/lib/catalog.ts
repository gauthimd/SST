export const PRODUCTS = [
  {
    id: "tandem_fri",
    label: "Tandem · Friday",
    cents: 25900,
    blurb: "Weekday and Friday rate. Two-plus miles of freefall over Mustang Island with a USPA instructor.",
  },
  {
    id: "tandem_wknd",
    label: "Tandem · Weekend",
    cents: 27900,
    blurb: "Saturday and Sunday. Same Gulf Coast jump, weekend rate.",
  },
  {
    id: "beach",
    label: "Beach landing",
    cents: 49900,
    blurb: "Sundays, when conditions allow. You land on the sand. Photo and video included.",
  },
  {
    id: "sunset",
    label: "Sunset beach landing",
    cents: 59900,
    blurb: "Fridays at 6pm. The beach landing under a Gulf sunset. Photo and video included.",
  },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];

export const FUN_JUMP_CENTS = 3000;
export const PHOTO_CENTS = 11900;
export const VIDEO_CENTS = 9900;
export const DEPOSIT_CENTS = 10000;
export const TEST_CARD = "4242424242424242";

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function productById(id: string) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function quote(productId: string, photo: boolean, videoOnly = false) {
  const product = productById(productId);
  if (!product) throw new Error("Pick a jump");
  const included = productId === "beach" || productId === "sunset";
  let extra = 0;
  let suffix = "";
  if (!included && photo) {
    extra = PHOTO_CENTS;
    suffix = " + photo & video";
  } else if (!included && videoOnly) {
    extra = VIDEO_CENTS;
    suffix = " + video";
  }
  return {
    label: suffix ? `${product.label}${suffix}` : product.label,
    total: product.cents + extra,
  };
}

export function assertTestCard(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits !== TEST_CARD) {
    throw new Error("Test mode only. Use card 4242 4242 4242 4242 — nothing is charged.");
  }
}

export function todayChicago() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
