import { createFileRoute } from "@tanstack/react-router";
import { InquiryForm } from "@/components/inquiry-form";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/gift-cards")({ component: GiftPage });

function GiftPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Gift cards"
        title="A jump that does not expire"
        lede="Gift cards are for tandem skydives over Mustang Island. They never expire, so a weather day or a busy calendar does not waste the gift."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2">
        <div className="space-y-3 text-muted leading-relaxed">
          <p>Classic tandem is $259 on Friday and weekdays, $279 on weekends. Beach landing is $499. Sunset beach landing is $599.</p>
          <p>The person who jumps still has to be 18 with a photo ID, and the weight rules on the FAQ still apply.</p>
          <p>
            Text <a className="text-sea underline" href="sms:+13619455867">(361) 945-5867</a> if you want one today, or
            leave a note and the desk will follow up.
          </p>
        </div>
        <InquiryForm kind="gift" submitLabel="Ask for a gift card" />
      </div>
      <SiteFooter />
    </main>
  );
}
