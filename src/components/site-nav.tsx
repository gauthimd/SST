import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function SiteNav({ tone = "foam" }: { tone?: "foam" | "deep" }) {
  const { user, isPending } = useCurrentUserState();
  const onDeep = tone === "deep";
  return (
    <header className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-5 py-4 ${onDeep ? "text-foam" : "text-ink"}`}>
      <Link to="/" className="font-display text-lg leading-none">
        Skydive South Texas
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 text-sm">
        <Link to="/book" className={onDeep ? "text-foam" : "text-sea"}>
          Book
        </Link>
        <Link to="/faq" className={onDeep ? "text-foam" : "text-sea"}>
          FAQ
        </Link>
        <Link to="/groups" className={onDeep ? "text-foam" : "text-sea"}>
          Groups
        </Link>
        {isPending ? (
          <span className="inline-block h-8 w-20 rounded-md bg-sand/40" />
        ) : user ? (
          <>
            <Link to="/desk" className="btn btn-sea min-h-10 px-3 text-sm">
              Manifest
            </Link>
            <UserButton />
          </>
        ) : (
          <Link to="/login" className="btn min-h-10 px-3 text-sm">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
