import { useEffect } from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

function staleChunk(error: unknown) {
  const message = errorMessage(error);
  return (
    message.startsWith("Failed to fetch dynamically imported module") ||
    message.startsWith("error loading dynamically imported module") ||
    message.startsWith("Importing a module script failed")
  );
}

function reloadFresh() {
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith("tanstack_router_reload:")) sessionStorage.removeItem(key);
  }
  sessionStorage.removeItem("sst-chunk-retry");
  window.location.reload();
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  const chunk = staleChunk(error);
  useEffect(() => {
    if (!chunk) return;
    if (sessionStorage.getItem("sst-chunk-retry") === "1") return;
    sessionStorage.setItem("sst-chunk-retry", "1");
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("tanstack_router_reload:")) sessionStorage.removeItem(key);
    }
    window.location.reload();
  }, [chunk]);

  return (
    <main
      className={
        "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center " +
        "bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50"
      }
    >
      <span className="text-red-500" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400">
        {chunk ? "The load clock was updating. Reload the page to open the new one." : errorMessage(error)}
      </p>
      <button type="button" className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm text-white" onClick={reloadFresh}>
        Reload
      </button>
    </main>
  );
}
