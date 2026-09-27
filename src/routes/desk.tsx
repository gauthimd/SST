import { createFileRoute } from "@tanstack/react-router";
import { DeskApp } from "@/components/desk-app";
import { SiteNav } from "@/components/site-nav";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/desk")({ component: DeskPage });

function DeskPage() {
  const { user, isPending } = useCurrentUserState();
  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      {isPending ? (
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="h-10 w-48 rounded-md bg-sand" />
          <div className="mt-6 h-40 rounded-xl bg-sand/70" />
        </div>
      ) : user ? (
        <DeskApp />
      ) : (
        <RedirectToSignIn />
      )}
    </main>
  );
}
