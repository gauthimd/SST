import { useState, type FormEvent } from "react";

export function InquiryForm({
  kind,
  submitLabel,
}: {
  kind: "group" | "scenic" | "gift";
  submitLabel: string;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(kind === "group" ? "8" : "2");
  const [dates, setDates] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, name, phone, email, partySize, dates, message, company }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error || "Could not send that");
      setStatus("Got it. The desk has your note. Text (361) 945-5867 if you need an answer today.");
      setMessage("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not send that");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card relative space-y-3 p-5" onSubmit={submit}>
      <label className="block text-sm">
        Name
        <input className="field mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-sm">
        Phone
        <input className="field mt-1" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <label className="block text-sm">
        Email
        <input className="field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm">
        Party size
        <input className="field mt-1" inputMode="numeric" value={partySize} onChange={(e) => setPartySize(e.target.value)} />
      </label>
      <label className="block text-sm">
        Dates
        <input className="field mt-1" value={dates} onChange={(e) => setDates(e.target.value)} placeholder="A weekend in October" />
      </label>
      <label className="block text-sm">
        Notes
        <textarea className="field mt-1 min-h-24" value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      <label className="absolute -left-[9999px]" aria-hidden>
        Company
        <input tabIndex={-1} value={company} onChange={(e) => setCompany(e.target.value)} />
      </label>
      <button className="btn" disabled={busy}>
        {busy ? "Sending…" : submitLabel}
      </button>
      {status ? <p className="text-sm text-sea">{status}</p> : null}
    </form>
  );
}
