import { createFileRoute } from "@tanstack/react-router";
import { InquiryForm } from "@/components/inquiry-form";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/scenic-flights")({ component: ScenicPage });

function ScenicPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Scenic flights"
        title="The same coast, without a parachute"
        lede="A low, unhurried flight over the dunes, the beach, and the open Gulf. The coastline our jumpers fall in love with, at a pace that lets you take it in. No parachute required."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl">What you see</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted leading-relaxed">
            <li>The sweep of Mustang Island and the Port Aransas shoreline.</li>
            <li>Beaches and dunes from an angle you cannot get on the sand.</li>
            <li>The Gulf, the jetties, and boats heading out.</li>
            <li>Sunset light over the water, if you time it.</li>
          </ul>
          <p className="text-muted leading-relaxed">
            Flights are by request, and they are the right plan B when the wind is wrong for jumping but fine for
            flying. Tell us the dates and how many people.
          </p>
          <p>
            <a className="text-sea underline" href="sms:+13619455867">
              Text (361) 945-5867
            </a>
          </p>
        </div>
        <InquiryForm kind="scenic" submitLabel="Request a scenic flight" />
      </div>
      <SiteFooter />
    </main>
  );
}
