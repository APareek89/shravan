"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

type ScamResult = {
  risk: "LOW" | "SUSPICIOUS" | "HIGH";
  explanation_hi: string;
  explanation_en: string;
  action: string;
};

const riskStyles = {
  LOW: {
    icon: CheckCircle2,
    labelHi: "साफ़ खतरा नहीं दिखा",
    labelEn: "No obvious danger",
    className: "border-[#bfd8bc] bg-[#edf4e9] text-forest",
  },
  SUSPICIOUS: {
    icon: AlertTriangle,
    labelHi: "सावधान रहें",
    labelEn: "Be cautious",
    className: "border-[#edd49b] bg-[#fff5d9] text-[#78530d]",
  },
  HIGH: {
    icon: ShieldAlert,
    labelHi: "बहुत ज़्यादा खतरा",
    labelEn: "High scam risk",
    className: "border-[#efc8bd] bg-[#fde8e2] text-[#963728]",
  },
};

export function ScamChecker({ language }: { language: "hi" | "en" }) {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ScamResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isHindi = language === "hi";

  async function checkMessage(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const response = await fetch("/api/scam-check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const body = (await response.json()) as ScamResult & { error?: string };
    if (!response.ok) {
      setError(body.error ?? (isHindi ? "अभी जाँच नहीं हो पाई" : "Could not check this now"));
    } else {
      setResult(body);
    }
    setBusy(false);
  }

  return (
    <div>
      <form onSubmit={checkMessage} className="rounded-[1.8rem] border border-line bg-white p-5 shadow-sm">
        <label htmlFor="scam-message" className="font-bold">
          {isHindi ? "Message यहाँ paste करें या call के बारे में लिखें" : "Paste the message or describe the call"}
        </label>
        <textarea
          id="scam-message"
          required
          minLength={3}
          maxLength={6000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          placeholder={
            isHindi
              ? "जैसे: आपका parcel customs में रुक गया है…"
              : "Example: Your parcel is held by customs…"
          }
          className="focus-ring mt-3 w-full resize-none rounded-2xl border border-line bg-[#fcfbf7] p-4 text-xl leading-8 outline-none"
        />
        <button
          disabled={busy || message.trim().length < 3}
          className="focus-ring mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-forest px-5 text-xl font-bold text-white disabled:opacity-50"
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <ShieldQuestion />}
          {busy
            ? isHindi
              ? "जाँच रहा हूँ…"
              : "Checking…"
            : isHindi
              ? "सच या fraud जाँचें"
              : "Check this message"}
        </button>
      </form>

      {error && <p className="mt-4 rounded-2xl bg-[#fde8e2] p-4 text-coral">{error}</p>}

      {result && (() => {
        const meta = riskStyles[result.risk];
        const Icon = meta.icon;
        return (
          <section className={`mt-5 rounded-[1.8rem] border p-6 ${meta.className}`} aria-live="polite">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/70">
                <Icon size={27} />
              </span>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.15em]">{result.risk}</p>
                <h2 className="font-serif text-2xl font-bold">{isHindi ? meta.labelHi : meta.labelEn}</h2>
              </div>
            </div>
            <p className="mt-5 leading-8">{isHindi ? result.explanation_hi : result.explanation_en}</p>
            <div className="mt-5 rounded-2xl bg-white/75 p-4">
              <p className="text-sm font-extrabold uppercase tracking-wider">{isHindi ? "अब क्या करें" : "What to do now"}</p>
              <p className="mt-2 font-bold leading-8">{result.action}</p>
            </div>
          </section>
        );
      })()}

      <p className="mt-5 rounded-2xl border border-line bg-[#f3f2ec] p-4 text-base leading-7 text-muted">
        {isHindi
          ? "याद रखें: Bank या police फ़ोन पर OTP, PIN या तुरंत पैसे नहीं माँगते। Shravan किसी message को 100% safe नहीं कहता।"
          : "Remember: banks and police do not ask for OTPs, PINs, or urgent transfers by phone. Shravan never calls a message 100% safe."}
      </p>
    </div>
  );
}

