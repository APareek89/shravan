"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, ArrowRight } from "lucide-react";

export function AuthForm({
  supabaseUrl,
  publishableKey,
  redirectTo,
  demoEnabled,
}: {
  supabaseUrl: string | null;
  publishableKey: string | null;
  redirectTo: string;
  demoEnabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const realAuthEnabled = Boolean(supabaseUrl && publishableKey);

  async function sendOtp(event: React.FormEvent) {
    event.preventDefault();
    if (!supabaseUrl || !publishableKey) return;
    setBusy(true);
    setMessage("");
    const supabase = createBrowserClient(supabaseUrl, publishableKey);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          app: "shravan",
          role: "guardian",
          full_name: email.split("@")[0],
          language: "en",
        },
      },
    });
    setBusy(false);
    setMessage(
      error
        ? error.message
        : "Check your inbox. Your secure sign-in link is on its way.",
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={sendOtp} className="space-y-3">
        <label className="block text-sm font-bold text-ink" htmlFor="email">
          Your email
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            size={18}
          />
          <input
            id="email"
            type="email"
            required
            disabled={!realAuthEnabled}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="focus-ring h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-4 outline-none disabled:cursor-not-allowed disabled:bg-[#f2f1eb]"
          />
        </div>
        <button
          disabled={busy || !realAuthEnabled}
          className="focus-ring flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-forest font-bold text-white transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-45"
        >
          {busy ? "Sending link…" : "Email me a secure link"}
          {!busy && <ArrowRight size={18} />}
        </button>
      </form>
      {message && (
        <p className="rounded-xl bg-[#edf4e9] p-3 text-sm text-forest">{message}</p>
      )}
      {!realAuthEnabled && (
        <p className="rounded-xl border border-[#ecd7a8] bg-[#fff7df] p-3 text-sm leading-relaxed text-[#725116]">
          Email OTP is ready in code and will switch on when the Supabase publishable
          key is added.
          {demoEnabled ? " Use the seeded demo below now." : " Add that key before production access."}
        </p>
      )}
    </div>
  );
}
