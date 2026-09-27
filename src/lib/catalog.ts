export const PRODUCTS = [
  { id: "tandem_fri", label: "Tandem · Friday", cents: 25900, blurb: "Freefall over Mustang Island, then a glide back to the airport." },
  { id: "tandem_wknd", label: "Tandem · Weekend", cents: 27900, blurb: "Saturday and Sunday. Same coast, busier sky." },
  { id: "beach", label: "Beach landing", cents: 49900, blurb: "Sundays. Photo and video included. Feet in the sand." },
  { id: "sunset", label: "Sunset beach landing", cents: 59900, blurb: "Fridays at 6pm. Photo and video included." },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];

export const FUN_JUMP_CENTS = 3000;
export const PHOTO_CENTS = 11900;
export const TEST_CARD = "4242424242424242";

export function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function productById(id: string) {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

export function quote(productId: string, photo: boolean) {
  const product = productById(productId);
  if (!product) throw new Error("Pick a jump");
  const included = productId === "beach" || productId === "sunset";
  const extra = photo && !included ? PHOTO_CENTS : 0;
  return {
    label: included || !photo ? product.label : `${product.label} + photo & video`,
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
