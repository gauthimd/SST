import { Link } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function SiteNav({ tone = "foam" }: { tone?: "foam" | "deep" }) {
  const { user, isPending } = useCurrentUserState();
  const onDeep = tone === "deep";
  return (
    <header className={`flex items-center justify-between gap-4 px-5 py-4 ${onDeep ? "text-foam" : "text-ink"}`}>
      <Link to="/" className="font-display text-lg leading-none">
        Skydive South Texas
      </Link>
      <nav className="flex items-center gap-3 text-sm">
        <a href="/#jumps" className={onDeep ? "text-foam" : "text-sea"}>
          Jumps
        </a>
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
