import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        mode === "up"
          ? await authClient.signUp.email({ name, email, password, callbackURL: "/desk" })
          : await authClient.signIn.email({ email, password, callbackURL: "/desk" });
      if (result.error) throw new Error(result.error.message ?? "Sign-in failed");
      await router.invalidate();
      await router.navigate({ to: "/desk" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-foam">
      <SiteNav />
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-8 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-sea uppercase">Accounts</p>
          <h1 className="mt-2 text-5xl">Sign in to book or run the desk</h1>
          <p className="mt-4 text-muted leading-relaxed">
            Tandem students leave a deposit. Fun jumpers add money to an account. The first person to claim the
            manifest becomes the owner — after that, customers only see their own jumps.
          </p>
        </div>
        <div className="card p-5">
          {authEnabled ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button type="button" className={mode === "up" ? "btn" : "btn btn-ghost"} onClick={() => setMode("up")}>
                  Create account
                </button>
                <button type="button" className={mode === "in" ? "btn" : "btn btn-ghost"} onClick={() => setMode("in")}>
                  Sign in
                </button>
              </div>
              <form className="space-y-3" onSubmit={submit}>
                {mode === "up" ? (
                  <label className="block text-sm">
                    Name
                    <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
                  </label>
                ) : null}
                <label className="block text-sm">
                  Email
                  <input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label className="block text-sm">
                  Password
                  <input
                    className="field mt-1"
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </label>
                {error ? <p className="text-sm text-coral">{error}</p> : null}
                <button className="btn w-full" type="submit" disabled={busy}>
                  {busy ? "Working…" : mode === "up" ? "Create account" : "Sign in"}
                </button>
              </form>
              <div className="my-4 h-px bg-line" />
              <div className="space-y-2">
                {GROK_PROVIDERS.map((p) => (
                  <button
                    key={p.providerId}
                    type="button"
                    className="btn btn-ghost w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/desk" })}
                  >
                    Continue with {p.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
      </div>
    </main>
  );
}
