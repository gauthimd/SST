import { createFileRoute, Link } from "@tanstack/react-router";
import { InquiryForm } from "@/components/inquiry-form";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/groups")({ component: GroupsPage });

function GroupsPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Groups of 6+"
        title="A private window over the island"
        lede="The hangar, the plane, and the sky, reserved for your group. Spectators can watch from the ground. Beach and sunset landings can be added when the day allows."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="space-y-4 text-muted leading-relaxed">
          <p>
            Group pricing starts at the same per-person rate as an individual jump: $259 on Friday and other weekdays,
            $279 on the weekend for a classic tandem. Discounts depend on party size and how flexible the date is. The
            bigger and more flexible the group, the more room there is on price.
          </p>
          <p>Events can run seven days a week. Spots fill. Parties of 6 or fewer can book straight from the jump page.</p>
          <p>
            Prefer to text? <a className="text-sea underline" href="sms:+13619455867">Message (361) 945-5867</a>. Or
            leave the details and the desk will see them on the manifest audit.
          </p>
          <Link to="/book" className="text-sea underline">
            Booking for six or fewer
          </Link>
        </div>
        <InquiryForm kind="group" submitLabel="Request a group quote" />
      </div>
      <SiteFooter />
    </main>
  );
}
