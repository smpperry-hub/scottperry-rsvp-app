"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// The emailed link only works in the browser that requested it, and email
// apps sometimes open it first, so translate those failures into advice.
function friendlyLinkError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("code verifier") || m.includes("pkce")) {
    return "That link was opened in a different browser or device than the one you requested it from. Request a new link and open it in the same browser, or use the sign-in code from the email.";
  }
  if (m.includes("expired") || m.includes("invalid")) {
    return "That link has expired or was already used (some email apps open links automatically). Request a new link, or use the sign-in code from the email.";
  }
  return raw;
}

const inputClass =
  "w-full rounded border border-ochre/35 bg-cream px-4 py-3 font-sans text-sm text-ink outline-none focus:border-ochre";
const buttonClass =
  "w-full rounded bg-ink px-4 py-3 font-sans text-xs font-medium uppercase tracking-[0.2em] text-cream transition-colors hover:bg-clay disabled:opacity-60";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [stage, setStage] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(
    callbackError ? friendlyLinkError(callbackError) : null
  );

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }
    setStage("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });

    if (error) {
      setBusy(false);
      setMessage(
        "That code didn't work. Check it and try again, or go back and request a new one — only the newest code works."
      );
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm rounded border border-ochre/25 bg-white/70 p-8">
        <h1 className="font-display text-3xl italic text-ink">Host sign in</h1>

        {stage === "email" ? (
          <>
            <p className="mt-2 font-sans text-sm leading-6 text-ink/70">
              Enter your email and we&apos;ll send you a sign-in link.
            </p>
            <form onSubmit={sendLink} className="mt-6 space-y-4">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
              {message && <p className="font-sans text-sm text-clay">{message}</p>}
              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Sending…" : "Send sign-in link"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-6 rounded border border-sage/40 bg-sage/10 p-4 font-sans text-sm leading-6 text-ink">
              We emailed {email.trim()}. Open the link in this same browser — or, if the email
              shows a sign-in code, enter it below.
            </p>
            <form onSubmit={verifyCode} className="mt-4 space-y-4">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={10}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter code"
                className={`${inputClass} text-center tracking-[0.4em]`}
              />
              {message && <p className="font-sans text-sm text-clay">{message}</p>}
              <button type="submit" disabled={busy || code.length < 6} className={buttonClass}>
                {busy ? "Signing in…" : "Sign in with code"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setStage("email");
                setCode("");
                setMessage(null);
              }}
              className="mt-4 font-sans text-xs uppercase tracking-wider text-clay hover:underline"
            >
              Use a different email or request a new link
            </button>
          </>
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
