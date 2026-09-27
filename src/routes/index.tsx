import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PRODUCTS, money } from "@/lib/catalog";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main>
      <section className="bg-deep text-foam">
        <SiteNav tone="deep" />
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-6 md:grid-cols-[1.3fr_0.7fr] md:items-end">
          <div>
            <p className="kicker">Mustang Island · Port Aransas</p>
            <h1 className="mt-3 max-w-xl text-5xl leading-[1.05] text-foam md:text-7xl">
              The Gulf, from two miles up.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-sand">
              Tandem skydives over Mustang Island with USPA-certified instructors. Freefall, then a quiet canopy ride
              with the island and the ship channel underneath you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn">
                Book a deposit
              </Link>
              <a href="#jumps" className="btn btn-ghost border-sand/40 text-foam">
                See the jumps
              </a>
            </div>
          </div>
          <div className="card bg-sea p-5 text-foam">
            <p className="text-sm text-sand">Hangar #1 · Mustang Beach Airport</p>
            <p className="mt-2 font-display text-3xl leading-tight">139 Piper Blvd</p>
            <p className="text-sand">Port Aransas, TX 78373</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden />
                <div>
                  <dt className="text-sand">Call the hangar</dt>
                  <dd>(361) 945-5867</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden />
                <div>
                  <dt className="text-sand">Hours</dt>
                  <dd>Fri–Sun 10am–8pm. Weekdays by appointment.</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-sand" aria-hidden />
                <div>
                  <dt className="text-sand">From Corpus</dt>
                  <dd>About 30 minutes, across the causeway onto the island.</dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
        <div className="h-3 bg-sand" />
      </section>

      <section id="jumps" className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Pick your jump</p>
        <h2 className="mt-2 text-4xl text-ink">Four ways off the island</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.id} className="card flex flex-col justify-between p-5">
              <div>
                <h3 className="text-2xl">{product.label}</h3>
                <p className="mt-2 text-muted leading-relaxed">{product.blurb}</p>
              </div>
              <p className="mt-6 font-display text-3xl text-sea">{money(product.cents)}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Photo and video is {money(11900)} on airport landings, or video only {money(9900)}. Both are included on beach
          and sunset jumps. A deposit holds the day. The rest is collected when you check in.
        </p>
      </section>

      <section className="bg-sea text-foam">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-3">
          <div>
            <ShieldCheck className="size-6 text-sand" aria-hidden />
            <h2 className="mt-3 text-2xl text-foam">18 and a valid ID</h2>
            <p className="mt-2 text-sand leading-relaxed">
              Up to 240 lb is a yes. 240–270 is a check-in call and a $50 fee. Over 270, call ahead so we can say so
              honestly.
            </p>
          </div>
          <div>
            <h2 className="mt-9 text-2xl text-foam md:mt-9">Weather day</h2>
            <p className="mt-2 text-sand leading-relaxed">
              If the wind or the clouds shut the door, you reschedule free or take a full refund of what you paid.
            </p>
          </div>
          <div>
            <h2 className="mt-9 text-2xl text-foam">Since 2010</h2>
            <p className="mt-2 text-sand leading-relaxed">
              USPA-certified instructors, a main and a reserve on every rig, and an airplane maintained to FAA standards.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="card grid gap-6 p-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Manifest</p>
            <h2 className="mt-2 text-4xl">The desk lives here now</h2>
            <p className="mt-3 max-w-xl text-muted leading-relaxed">
              Staff run the load clock, put tandems and fun jumpers on a load, take a deposit, and charge the balance
              when someone walks in. Fun jumpers keep money on their account. Every change is written to the audit log.
              Payments run in Stripe test mode until the live account is connected — card 4242, nothing real moves.
            </p>
          </div>
          <Link to="/desk" className="btn btn-deep">
            Open the manifest
          </Link>
        </div>
      </section>
    </main>
  );
}
