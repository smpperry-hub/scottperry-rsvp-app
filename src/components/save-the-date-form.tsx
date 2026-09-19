"use client";

import { useState } from "react";
import type { PublicGuest } from "@/lib/supabase/types";
import NameCombobox from "@/components/name-combobox";
import AdditionalNamesPicker from "@/components/additional-names-picker";

type Props = {
  guests: PublicGuest[];
};

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";
type Answer = "yes" | "no" | "maybe";

const ANSWER_TO_ATTENDING: Record<Answer, boolean | null> = {
  yes: true,
  no: false,
  maybe: null,
};

export default function SaveTheDateForm({ guests }: Props) {
  const [fullName, setFullName] = useState("");
  const [additionalNames, setAdditionalNames] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [notes, setNotes] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(confirmUpdate: boolean) {
    setStatus("submitting");
    setMessage(null);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_type: "save_the_date",
          full_name: fullName,
          additional_names: additionalNames,
          email: email || null,
          phone: phone || null,
          attending: answer ? ANSWER_TO_ATTENDING[answer] : null,
          notes: notes || null,
          confirmUpdate,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.error === "duplicate") {
        setStatus("duplicate");
        setMessage(data.message);
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || answer === null) {
      setStatus("error");
      setMessage("Please add your name and let us know if you think you can make it.");
      return;
    }
    submit(false);
  }

  if (status === "success") {
    const partySize = 1 + additionalNames.length;
    const heading =
      answer === "yes"
        ? "So excited to celebrate with you!"
        : answer === "maybe"
          ? "We hope you can make it!"
          : "We'll miss you!";
    return (
      <div className="mx-auto max-w-lg rounded border border-ochre/25 bg-white/70 p-10 text-center">
        <h2 className="font-display text-3xl italic text-ink">{heading}</h2>
        <p className="mt-3 font-sans text-sm leading-7 text-ink/70">
          {answer === "yes" && (
            <>
              Thanks, {fullName}
              {partySize > 1 ? ` — we've noted all ${partySize} of you` : ""}. A formal invite
              with all the details will follow.
            </>
          )}
          {answer === "maybe" && (
            <>
              Thanks, {fullName}
              {partySize > 1 ? ` — we've noted this for all ${partySize} of you` : ""}. Let us
              know when your plans firm up — a formal invite will follow either way.
            </>
          )}
          {answer === "no" && (
            <>
              Thanks, {fullName}
              {partySize > 1 ? ` — we've noted this for all ${partySize} of you.` : "."}
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 rounded border border-ochre/25 bg-white/70 p-8 sm:p-10"
    >
      <div>
        <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
          Your full name *
        </label>
        <NameCombobox guests={guests} value={fullName} onChange={setFullName} />
      </div>

      <div>
        <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
          Additional full name(s)
        </label>
        <AdditionalNamesPicker
          guests={guests}
          selectedNames={additionalNames}
          onChange={setAdditionalNames}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
          />
        </div>
        <div>
          <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
            Phone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
          Think you can make it? *
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAnswer("yes")}
            className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
              answer === "yes"
                ? "border-sage bg-sage text-white"
                : "border-ochre/35 bg-cream text-ink hover:border-sage"
            }`}
          >
            Yes, we&apos;ll be there!
          </button>
          <button
            type="button"
            onClick={() => setAnswer("maybe")}
            className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
              answer === "maybe"
                ? "border-ochre bg-ochre text-white"
                : "border-ochre/35 bg-cream text-ink hover:border-ochre"
            }`}
          >
            Maybe
          </button>
          <button
            type="button"
            onClick={() => setAnswer("no")}
            className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
              answer === "no"
                ? "border-clay bg-clay text-white"
                : "border-ochre/35 bg-cream text-ink hover:border-clay"
            }`}
          >
            Can&apos;t make it
          </button>
        </div>
      </div>

      <div>
        <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-y rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
        />
      </div>

      {status === "duplicate" && (
        <div className="rounded border border-clay/40 bg-clay/10 p-4 font-sans text-sm text-ink">
          <p>{message}</p>
          <button
            type="button"
            onClick={() => submit(true)}
            className="mt-3 rounded bg-clay px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider text-white"
          >
            Update my response
          </button>
        </div>
      )}

      {status === "error" && message && (
        <p className="font-sans text-sm text-clay">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded bg-ink px-4 py-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-clay disabled:opacity-60"
      >
        {status === "submitting" ? "Submitting…" : "Submit my response"}
      </button>
    </form>
  );
}
