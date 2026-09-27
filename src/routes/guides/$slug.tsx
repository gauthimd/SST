import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { guideBySlug } from "@/lib/guides";

export const Route = createFileRoute("/guides/$slug")({ component: GuidePage });

function GuidePage() {
  const { slug } = Route.useParams();
  const guide = guideBySlug(slug);
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      {guide ? (
        <>
          <PageIntro kicker="Guide" title={guide.title} lede={guide.lede} />
          <div className="mx-auto max-w-3xl space-y-6 px-5 py-8">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl">{section.heading}</h2>
                <p className="mt-2 text-muted leading-relaxed">{section.body}</p>
              </section>
            ))}
            <Link to="/book" className="btn">
              Book your jump
            </Link>
          </div>
        </>
      ) : (
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h1 className="text-4xl">That guide is not on this site</h1>
          <Link to="/guides" className="btn mt-6">
            All guides
          </Link>
        </div>
      )}
      <SiteFooter />
    </main>
  );
}
