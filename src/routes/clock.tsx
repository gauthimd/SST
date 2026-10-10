import { createFileRoute } from "@tanstack/react-router";
import { HangarClock } from "@/components/hangar-clock";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { todayChicago } from "@/lib/catalog";

export const Route = createFileRoute("/clock")({
  validateSearch: (search: Record<string, unknown>) => ({
    date: typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date) ? search.date : todayChicago(),
  }),
  head: () => ({
    meta: [{ title: "Load Clock · Skydive South Texas" }],
    links: [{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&display=swap" }],
  }),
  component: ClockPage,
});

function ClockPage() {
  const { date } = Route.useSearch();
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="fixed inset-0 bg-[#003399]" />;
  if (!user) return <RedirectToSignIn />;
  return <HangarClock date={date} />;
}
