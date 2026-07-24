"use client";

import Link from "next/link";
import { Home, Languages } from "lucide-react";
import { useState } from "react";

export function ElderHeader({
  name,
  initialLanguage,
}: {
  name: string;
  initialLanguage: "hi" | "en";
}) {
  const [language, setLanguage] = useState(initialLanguage);

  async function toggleLanguage() {
    const next = language === "hi" ? "en" : "hi";
    const response = await fetch("/api/elder/language", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: next }),
    });
    if (response.ok) {
      setLanguage(next);
      window.location.reload();
    }
  }

  return (
    <header className="border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4">
        <Link
          href="/elder"
          className="focus-ring flex min-h-12 items-center gap-3 rounded-2xl px-2"
        >
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-forest text-xl font-black text-white">
            श
          </span>
          <span>
            <span className="block font-serif text-xl font-bold leading-tight">Shravan</span>
            <span className="block text-xs text-muted">{name} ji</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/elder"
            className="focus-ring grid h-12 w-12 place-items-center rounded-2xl border border-line bg-white text-forest"
            aria-label="Home"
          >
            <Home size={22} />
          </Link>
          <button
            onClick={toggleLanguage}
            className="focus-ring flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-3 text-base font-bold text-forest"
            aria-label="Change language"
          >
            <Languages size={21} />
            {language === "hi" ? "EN" : "हिं"}
          </button>
        </div>
      </div>
    </header>
  );
}

