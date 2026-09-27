import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro, SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/testimonials")({ component: ReviewsPage });

const REVIEWS = [
  ["Best experience of my life. The beach landing was absolutely unreal — worth every penny.", "Jessica M.", "Corpus Christi, TX"],
  ["Professional crew, felt completely safe the whole time. The views of the Gulf were incredible.", "David R.", "San Antonio, TX"],
  ["Did the sunset jump for my birthday and I'm still thinking about it. The team made it special.", "Amanda L.", "Austin, TX"],
];

function ReviewsPage() {
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <PageIntro
        kicker="Reviews"
        title="4.95 from 460+ reviews"
        lede="Tripadvisor Travelers' Choice 2025, and the same stories we hear in the hangar."
      />
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-8">
        {REVIEWS.map(([quote, name, from]) => (
          <figure key={name} className="card p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-sea uppercase">Five stars</p>
            <blockquote className="mt-3 text-lg leading-relaxed">“{quote}”</blockquote>
            <figcaption className="mt-3 text-sm text-muted">
              {name} · {from}
            </figcaption>
          </figure>
        ))}
        <p>
          <a
            className="text-sea underline"
            href="https://www.tripadvisor.com/Attraction_Review-g56476-d4471283-Reviews-Skydive_South_Texas_Mustang_Island_Skydiving-Port_Aransas_Texas.html"
          >
            Read the rest on Tripadvisor
          </a>
        </p>
        <Link to="/book" className="btn">
          Book your jump
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
