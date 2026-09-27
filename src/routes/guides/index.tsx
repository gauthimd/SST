import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { GUIDES } from "@/lib/guides";

export const Route = createFileRoute("/guides/")({ component: GuidesIndex });

function GuidesIndex() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Guides"
        title="Before you drive down"
        lede="The practical pages from the current site: the first jump, beach landings, cost, the drive, and a weekend on the island."
      />
      <ul className="mx-auto max-w-3xl space-y-3 px-5 py-8">
        {GUIDES.map((guide) => (
          <li key={guide.slug}>
            <Link to="/guides/$slug" params={{ slug: guide.slug }} className="card block p-5">
              <h2 className="text-2xl">{guide.title}</h2>
              <p className="mt-2 text-muted">{guide.lede}</p>
            </Link>
          </li>
        ))}
      </ul>
      <SiteFooter />
    </main>
  );
}
