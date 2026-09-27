import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { PRODUCTS, money } from "@/lib/catalog";

export const Route = createFileRoute("/book")({ component: BookPage });

function BookPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Book"
        title="Hold your jump"
        lede="Pick the jump, leave a $100 deposit, and the desk puts you on the day. The deposit applies to the total. If weather grounds the plane, it carries to the new date."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-8">
        {PRODUCTS.map((product) => (
          <article key={product.id} className="card flex flex-wrap items-end justify-between gap-3 p-5">
            <div>
              <h2 className="text-2xl">{product.label}</h2>
              <p className="mt-1 text-muted">{product.blurb}</p>
            </div>
            <p className="font-display text-3xl text-sea">{money(product.cents)}</p>
          </article>
        ))}
        <section className="card p-5">
          <h2 className="text-2xl">How the day works</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted leading-relaxed">
            <li>Sign in and pay the $100 deposit with the test card until live Stripe is connected.</li>
            <li>Arrive at Hangar #1, meet your instructor, and gear up. Plan on 2–3 hours.</li>
            <li>Climb out over the Gulf, freefall, and fly the canopy back to the island or the beach.</li>
          </ol>
          <p className="mt-4 text-sm text-muted">
            Balance is collected at check-in: cash, card at the desk, or the rest of the deposit flow. Groups of 6 or
            fewer can book here. Larger groups should{" "}
            <Link to="/groups" className="text-sea underline">
              request a private window
            </Link>
            .
          </p>
          <Link to="/login" className="btn mt-5">
            Sign in and pay the deposit
          </Link>
        </section>
        <section>
          <h2 className="text-2xl">Weather</h2>
          <p className="mt-2 text-muted leading-relaxed">
            If we cannot fly, you reschedule free — rebook up to 24 hours ahead — or take a full refund up to 72 hours
            before check-in. Gift cards never expire, so there is no reason to force a jump.
          </p>
        </section>
      </div>
      <SiteFooter />
    </main>
  );
}
