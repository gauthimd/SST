import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/photos")({ component: PhotosPage });

const ALBUMS = [
  ["Freefall over the coast", "The exit and the minute above Mustang Island, before the canopy opens."],
  ["Canopy rides and island views", "The quiet part. The island, the ship channel, and the Gulf from under the parachute."],
  ["Beach landings", "Feet in the sand on the Sundays and Friday sunsets we fly those jumps."],
  ["The aircraft and the dropzone", "The Cessna, Hangar #1, and the ramp at Mustang Beach Airport."],
];

function PhotosPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Mustang Island"
        title="Photos and video"
        lede="Freefall, canopy, beach landings, and the dropzone itself. Your own jump's media is the $119 photo-and-video package, or $99 for video only. Beach and sunset jumps include it."
      />
      <div className="mx-auto grid max-w-5xl gap-4 px-5 py-8 md:grid-cols-2">
        {ALBUMS.map(([title, body]) => (
          <article key={title} className="card p-5">
            <h2 className="text-2xl">{title}</h2>
            <p className="mt-2 text-muted leading-relaxed">{body}</p>
          </article>
        ))}
      </div>
      <p className="mx-auto max-w-5xl px-5 pb-10 text-sm text-muted">
        Want it of yourself? <Link to="/book" className="text-sea underline">Add media when you book</Link>.
      </p>
      <SiteFooter />
    </main>
  );
}
