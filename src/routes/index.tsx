import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { money } from "@/lib/catalog";

export const Route = createFileRoute("/")({ component: Home });

const JUMPS = [
  {
    name: "Tandem skydive",
    when: "Fridays $259 · weekends $279",
    points: ["2+ miles of freefall over the island", "USPA-certified instructor", "Add photo and video for $119, or video only for $99"],
    price: "From $259",
    featured: false,
  },
  {
    name: "Beach landing",
    when: "Sundays",
    points: ["Land on the sand", "Photo and video included, a $119 value", "The jump people drive down for"],
    price: "$499",
    featured: true,
  },
  {
    name: "Sunset beach landing",
    when: "Fridays at 6pm",
    points: ["Everything in the beach landing", "Golden hour over the Gulf", "Photo and video included"],
    price: "$599",
    featured: false,
  },
];

const REVIEWS = [
  {
    quote: "Best experience of my life. The beach landing was absolutely unreal — worth every penny.",
    name: "Jessica M.",
    from: "Corpus Christi, TX",
  },
  {
    quote: "Professional crew, felt completely safe the whole time. The views of the Gulf were incredible.",
    name: "David R.",
    from: "San Antonio, TX",
  },
  {
    quote: "Did the sunset jump for my birthday and I'm still thinking about it. The team made it special.",
    name: "Amanda L.",
    from: "Austin, TX",
  },
];

function Home() {
  return (
    <main>
      <section className="bg-deep text-foam">
        <SiteNav tone="deep" />
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-6">
          <p className="kicker">Mustang Island · Port Aransas, TX</p>
          <h1 className="mt-3 max-w-3xl text-5xl leading-[1.02] text-foam md:text-7xl">Jump the Gulf Coast</h1>
          <p className="mt-4 max-w-xl text-lg text-sand">
            Beach landings. Sunset jumps. Tandem skydiving over Mustang Island, with Gulf views you will not get at an
            inland dropzone. About 30 minutes from Corpus Christi.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/book" className="btn">
              Book your jump
            </Link>
            <a href="#jumps" className="btn btn-ghost border-sand/40 text-foam">
              See jump options
            </a>
            <p className="text-sand">From {money(25900)}</p>
          </div>
        </div>
        <dl className="grid border-t border-white/10 sm:grid-cols-4">
          {[
            ["#2 in Port A", "Tripadvisor Travelers' Choice 2025"],
            ["Est. 2010", "16 years on Mustang Island"],
            ["12,000+", "Tandems flown over the Gulf"],
            ["30 min", "From Corpus Christi"],
          ].map(([stat, label]) => (
            <div key={stat} className="px-5 py-4">
              <dt className="font-display text-2xl text-foam">{stat}</dt>
              <dd className="text-sm text-sand">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="jumps" className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Choose your adventure</p>
        <h2 className="mt-2 text-4xl">Pick your jump</h2>
        <p className="mt-3 max-w-2xl text-muted leading-relaxed">
          Every jump is a tandem with a USPA-certified instructor. Add HD photo and video to relive the exit, the
          freefall, the canopy, and the landing.
        </p>
        <p className="mt-3 text-sm">
          <a
            className="text-sea underline"
            href="https://www.tripadvisor.com/Attraction_Review-g56476-d4471283-Reviews-Skydive_South_Texas_Mustang_Island_Skydiving-Port_Aransas_Texas.html"
          >
            4.95 from 460+ reviews on Tripadvisor and Google
          </a>
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {JUMPS.map((jump) => (
            <article key={jump.name} className={`card flex flex-col p-5 ${jump.featured ? "bg-sea text-foam" : ""}`}>
              {jump.featured ? <p className="text-xs font-semibold tracking-[0.14em] text-sand uppercase">Most popular</p> : null}
              <h3 className={`text-2xl ${jump.featured ? "text-foam" : ""}`}>{jump.name}</h3>
              <p className={`mt-1 text-sm ${jump.featured ? "text-sand" : "text-muted"}`}>{jump.when}</p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed">
                {jump.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p className={`mt-6 font-display text-4xl ${jump.featured ? "text-foam" : "text-sea"}`}>{jump.price}</p>
              <Link
                to="/book"
                className="btn mt-4 w-fit"
                style={jump.featured ? { background: "var(--color-foam)", color: "var(--color-deep)" } : undefined}
              >
                Book
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          If weather grounds the jump, you reschedule free or we refund you in full. A $100 deposit holds the slot and
          applies to the total.
        </p>
      </section>

      <section className="bg-sea text-foam">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="kicker">Why jump with us</p>
          <h2 className="mt-2 text-4xl text-foam">The most scenic jump in Texas</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              ["Safety first", "USPA-certified tandem instructors. Every rig has a main, a reserve, and an automatic activation device. The airplane is maintained to FAA standards."],
              ["The view", "Mustang Island, the Gulf, and miles of coastline. An inland dropzone cannot match it."],
              ["Beach landings", "Land on the sand on select days. Very few dropzones can offer that."],
              ["Since 2010", "Calling Mustang Island home for 15-plus years, with thousands of first-time jumpers."],
            ].map(([title, body]) => (
              <div key={title}>
                <h3 className="text-2xl text-foam">{title}</h3>
                <p className="mt-2 text-sand leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">The experience</p>
          <h2 className="mt-2 text-4xl">From the plane to the sand</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Suit up, meet your instructor, and climb to altitude over the Texas Gulf Coast. Then it is 2+ miles of
            freefall before the canopy opens and you float back toward Mustang Island. No experience needed. Your
            instructor handles the jump. You enjoy the ride.
          </p>
          <Link to="/jumper-info" className="btn mt-6">
            What to expect
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Capture the thrill</p>
          <h2 className="mt-2 text-4xl">Relive every second</h2>
          <p className="mt-4 text-muted leading-relaxed">
            Photo and video is {money(11900)}. Video only is {money(9900)}. You get the exit, freefall, canopy, and
            landing. Both are included on every beach and sunset jump.
          </p>
          <div className="card mt-6 p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Groups of 6+</p>
            <h3 className="mt-2 text-2xl">Bring the whole crew</h3>
            <p className="mt-2 text-muted leading-relaxed">
              A private window over Mustang Island. Spectators welcome. Bring catering and make a day of it.
            </p>
            <Link to="/groups" className="btn mt-4">
              Plan a group event
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">4.95 from 460+ reviews</p>
          <h2 className="mt-2 text-4xl">Jumpers love it</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {REVIEWS.map((review) => (
              <figure key={review.name} className="card p-5">
                <p className="text-xs font-semibold tracking-[0.14em] text-sea uppercase">Five stars</p>
                <blockquote className="mt-3 leading-relaxed">“{review.quote}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted">
                  {review.name} · {review.from}
                </figcaption>
              </figure>
            ))}
          </div>
          <Link to="/testimonials" className="mt-6 inline-block text-sea underline">
            More reviews
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1.2fr_0.8fr] md:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Find us</p>
          <h2 className="mt-2 text-4xl">Mustang Beach Airport, Port Aransas</h2>
          <p className="mt-3 text-muted leading-relaxed">
            139 Piper Blvd, Hangar #1, Port Aransas, TX 78373. About 30 minutes from Corpus Christi. Open Friday through
            Sunday, 10am–8pm. Monday through Thursday by appointment.
          </p>
          <p className="mt-3">
            <a className="text-sea underline" href="tel:+13619455867">
              (361) 945-5867
            </a>
          </p>
          <p className="mt-4 text-sm text-muted">
            Driving from Austin or San Antonio?{" "}
            <Link to="/guides/$slug" params={{ slug: "gulf-coast-skydive-worth-the-drive" }} className="text-sea underline">
              See if the trip is worth it
            </Link>
            , or check{" "}
            <Link to="/guides/$slug" params={{ slug: "skydiving-cost-texas" }} className="text-sea underline">
              what a Texas skydive costs
            </Link>
            .
          </p>
        </div>
        <div className="card bg-deep p-6 text-foam">
          <h2 className="text-3xl text-foam">Ready to fly?</h2>
          <p className="mt-3 text-sand">Book a deposit online. Gift cards never expire.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/book" className="btn">
              Book your jump
            </Link>
            <Link to="/gift-cards" className="btn btn-ghost border-sand/40 text-foam">
              Gift cards
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
