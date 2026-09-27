import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/merch")({ component: MerchPage });

const ITEMS = [
  ["Kids Heavy Cotton Tee", "$25"],
  ["Kid's Jersey Tank Top", "$25"],
  ["Unisex Softstyle T-Shirt", "$29"],
  ["Unisex Jersey Tank", "$30"],
  ["Women's Long Sleeve V-neck", "$38"],
  ["Unisex Performance Long Sleeve Jersey", "$60"],
];

function MerchPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Merch"
        title="Official dropzone apparel"
        lede="Rep the jump on Mustang Island. Text the hangar to order a size. The online cart comes over with the domain."
      />
      <ul className="mx-auto max-w-3xl space-y-3 px-5 py-8">
        {ITEMS.map(([name, price]) => (
          <li key={name} className="card flex items-center justify-between gap-4 p-4">
            <span>{name}</span>
            <span className="font-display text-2xl text-sea">{price}</span>
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-3xl px-5 pb-10">
        <a className="text-sea underline" href="sms:+13619455867">
          Text (361) 945-5867 to order
        </a>
      </p>
      <SiteFooter />
    </main>
  );
}
