import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/jumper-info")({ component: JumperPage });

function JumperPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Jumper info"
        title="Before you jump"
        lede="Everything a first-timer needs before a tandem on Mustang Island. The rules are the same ones on the FAQ."
      />
      <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <section className="card p-5">
          <h2 className="text-2xl">What to wear and bring</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-muted leading-relaxed">
            <li>Athletic clothes you can move in. Beach-appropriate is fine.</li>
            <li>Closed-toe shoes. No flip-flops.</li>
            <li>A normal breakfast. Do not arrive empty.</li>
            <li>A valid photo ID. You must be 18.</li>
            <li>The balance of your jump, if the deposit did not cover it.</li>
          </ul>
        </section>
        <section className="card p-5">
          <h2 className="text-2xl">The timeline</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted leading-relaxed">
            <li>Check-in, waiver, weigh-in, and a short briefing: 30–45 minutes.</li>
            <li>Climb in the Cessna 182: about 20 minutes, with the bay, the Gulf, and the island under you.</li>
            <li>Freefall from over two miles up: about a minute.</li>
            <li>Canopy ride: 5–7 minutes. Beach landings finish on the sand.</li>
          </ol>
          <p className="mt-3 text-muted">The whole visit is about 2–3 hours. Tipping is not required. Most people leave $20–$50.</p>
        </section>
        <section className="card p-5">
          <h2 className="text-2xl">Weight and age</h2>
          <p className="mt-2 text-muted leading-relaxed">
            Up to 240 lb is a yes. 240–270 lb is case by case plus a $50 fee. Over 270 lb, call (361) 945-5867 before
            you book. Over 65, check with your doctor first. We do not run AFF or solo-license courses.
          </p>
        </section>
        <p>
          <Link to="/guides/$slug" params={{ slug: "first-tandem-skydive-texas-coast" }} className="text-sea underline">
            Read the full first-jump guide
          </Link>
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
