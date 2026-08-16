"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) {
      setStatus("error");
      setMessage(callbackError);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rounded border border-ochre/25 bg-white/70 p-8">
        <h1 className="font-display text-3xl italic text-ink">Host sign in</h1>
        <p className="mt-2 font-sans text-sm leading-6 text-ink/70">
          Enter your email and we&apos;ll send a magic link to the dashboard.
        </p>

        {status === "sent" ? (
          <p className="mt-6 rounded border border-sage/40 bg-sage/10 p-4 font-sans text-sm text-ink">
            Check your inbox for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre"
            />
            {status === "error" && message && (
              <p className="font-sans text-sm text-clay">{message}</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full rounded bg-ink px-4 py-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-clay disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
