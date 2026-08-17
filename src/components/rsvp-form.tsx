"use client";

import { useState } from "react";
import type { Guest } from "@/lib/supabase/types";
import RoommatePicker from "@/components/roommate-picker";
import NameCombobox from "@/components/name-combobox";
import AdditionalNamesPicker from "@/components/additional-names-picker";

type Props = {
  guests: Guest[];
};

type Status = "idle" | "submitting" | "success" | "duplicate" | "error";

const ROOM_TYPES = ["Studio", "1 Bedroom Suite"] as const;

export default function RsvpForm({ guests }: Props) {
  const [fullName, setFullName] = useState("");
  const [additionalNames, setAdditionalNames] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [roommateIds, setRoommateIds] = useState<string[]>([]);
  const [roomType, setRoomType] = useState<string | null>(null);
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
          full_name: fullName,
          additional_names: additionalNames,
          email: email || null,
          phone: phone || null,
          attending,
          notes: notes || null,
          roommate_guest_ids: roommateIds,
          room_type_preference: roomType,
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
    if (!fullName.trim() || attending === null) {
      setStatus("error");
      setMessage("Please add your name and let us know if you can make it.");
      return;
    }
    submit(false);
  }

  if (status === "success") {
    const partySize = 1 + additionalNames.length;
    return (
      <div className="mx-auto max-w-lg rounded border border-ochre/25 bg-white/70 p-10 text-center">
        <h2 className="font-display text-3xl italic text-ink">
          {attending ? "We can't wait to celebrate with you!" : "We'll miss you!"}
        </h2>
        <p className="mt-3 font-sans text-sm leading-7 text-ink/70">
          Thanks, {fullName}
          {partySize > 1 ? ` — we've recorded a response for all ${partySize} of you` : ""}. Your
          response has been saved.
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
        <p className="mt-2 font-sans text-xs text-ink/50">
          RSVPing for family or a +1? Add their names here.
        </p>
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
          Will you be attending? *
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setAttending(true)}
            className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
              attending === true
                ? "border-sage bg-sage text-white"
                : "border-ochre/35 bg-cream text-ink hover:border-sage"
            }`}
          >
            Joyfully accepts
          </button>
          <button
            type="button"
            onClick={() => setAttending(false)}
            className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
              attending === false
                ? "border-clay bg-clay text-white"
                : "border-ochre/35 bg-cream text-ink hover:border-clay"
            }`}
          >
            Regretfully declines
          </button>
        </div>
      </div>

      {attending === true && (
        <div>
          <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
            Room type preference
          </label>
          <div className="flex flex-wrap gap-3">
            {ROOM_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setRoomType(roomType === type ? null : type)}
                className={`flex-1 rounded border px-4 py-3 font-sans text-sm font-medium transition-colors ${
                  roomType === type
                    ? "border-ochre bg-ochre text-white"
                    : "border-ochre/35 bg-cream text-ink hover:border-ochre"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="mt-2 font-sans text-xs text-ink/50">
            I&apos;d prefer a Studio or 1 Bedroom Suite — let us know which, if you have one.
          </p>
        </div>
      )}

      {attending === true && guests.length > 0 && (
        <div>
          <label className="mb-2 block font-sans text-xs font-medium uppercase tracking-[0.18em] text-clay">
            Who Would you like to share a suite with? (select all who apply)
          </label>
          <RoommatePicker
            guests={guests}
            selectedIds={roommateIds}
            onChange={setRoommateIds}
          />
        </div>
      )}

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
