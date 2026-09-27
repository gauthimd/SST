import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/faq")({ component: FaqPage });

const FAQS = [
  {
    q: "What's the age requirement?",
    a: "All jumpers must be 18 or older, the legal age for skydiving in Texas. A valid photo ID is required at check-in. If you are over 65, talk with your doctor beforehand. There is no upper age limit if you are in good health.",
  },
  {
    q: "What are the weight limits?",
    a: "Up to 240 lb, you are approved to jump as-is. Between 240 and 270 lb, we look at it case by case at check-in. We can usually take you, and a $50 fee applies. Over 270 lb, call ahead so we can say honestly whether we can take you safely. If skydiving is not the right fit for someone in the group, a scenic flight is the way they still go up.",
  },
  {
    q: "How safe is skydiving?",
    a: "Tandem skydiving is highly regulated. Instructors are USPA-certified. Every rig has a main and a reserve parachute plus an automatic activation device. The aircraft are maintained to FAA standards.",
  },
  {
    q: "Do we go up with our friends?",
    a: "Usually, yes. With two instructors flying we can often send pairs up together. If the schedule does not allow it, the rest of the group watches from the ground.",
  },
  {
    q: "Can I get photos and video?",
    a: "Photo and video is $119. Video only is $99. Both are included on every beach landing and sunset landing.",
  },
  {
    q: "What if the weather is bad?",
    a: "We only fly in good conditions. If weather grounds us, you reschedule free — rebook at no charge up to 24 hours before your slot — or get a full refund up to 72 hours before check-in. A weather delay does not burn your deposit.",
  },
  {
    q: "How long does it take?",
    a: "About 2–3 hours at the dropzone, from check-in to landing. Freefall itself is about a minute, then a few minutes under canopy.",
  },
  {
    q: "Do I need experience?",
    a: "None. You get a short briefing, then you are harnessed to a USPA instructor the whole way.",
  },
  {
    q: "Do you sell gift cards?",
    a: "Yes. They never expire. See the gift card page.",
  },
  {
    q: "Where are you, and when are you open?",
    a: "139 Piper Blvd, Hangar #1, Port Aransas, TX 78373, on Mustang Island, about 30 minutes from Corpus Christi. Friday through Sunday, 10am–8pm. Monday through Thursday by appointment. Text or call (361) 945-5867.",
  },
];

function FaqPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="FAQ"
        title="Pricing, safety, weather"
        lede="The short answers. If yours is not here, call the hangar and a person will walk you through it."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-8">
        {FAQS.map((item) => (
          <article key={item.q} className="card p-5">
            <h2 className="text-2xl">{item.q}</h2>
            <p className="mt-2 text-muted leading-relaxed">{item.a}</p>
          </article>
        ))}
        <p className="text-sm text-muted">
          Gift cards live on the <Link to="/gift-cards" className="text-sea underline">gift card page</Link>. Scenic
          flights are the plan B on the <Link to="/scenic-flights" className="text-sea underline">scenic page</Link>.
        </p>
      </div>
      <SiteFooter />
    </main>
  );
}
