import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

const KINDS = new Set(["group", "scenic", "gift"]);

export const Route = createFileRoute("/api/inquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return Response.json({ error: "Bad request" }, { status: 400 });
        }
        if (typeof body.company === "string" && body.company.trim()) {
          return Response.json({ ok: true });
        }
        const kind = typeof body.kind === "string" && KINDS.has(body.kind) ? body.kind : "";
        const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : "";
        const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 40) : "";
        const email = typeof body.email === "string" ? body.email.trim().slice(0, 120) : "";
        const dates = typeof body.dates === "string" ? body.dates.trim().slice(0, 120) : "";
        const message = typeof body.message === "string" ? body.message.trim().slice(0, 600) : "";
        const party = Number(body.partySize);
        if (!kind || name.length < 2 || phone.replace(/\D/g, "").length < 7) {
          return Response.json({ error: "Name and a real phone number are required" }, { status: 400 });
        }
        const detail = [
          name,
          phone,
          email,
          Number.isFinite(party) && party > 0 ? `party ${Math.round(party)}` : "",
          dates,
          message,
        ]
          .filter(Boolean)
          .join(" · ");
        const sql = await getSql();
        await sql`insert into audit_log (actor_user_id, action, entity, entity_id, detail)
          values ('public', 'inquiry', ${kind}, ${phone}, ${detail})`;
        return Response.json({ ok: true });
      },
    },
  },
});
