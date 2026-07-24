import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  Heart,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 md:px-10">
        <Brand />
        <Link
          href="/auth"
          className="focus-ring rounded-full border border-[#cfd8ce] bg-white/70 px-5 py-2.5 text-sm font-bold text-forest backdrop-blur transition hover:border-forest"
        >
          Guardian sign in
        </Link>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-100px)] max-w-7xl items-center gap-12 px-5 pb-14 pt-6 md:grid-cols-[1.05fr_.95fr] md:px-10">
        <div className="rise max-w-3xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9dfd2] bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-forest backdrop-blur">
            <Sparkles size={15} className="text-[#bc7d17]" />
            Care that feels like family
          </div>
          <h1 className="max-w-3xl font-serif text-[clamp(3.4rem,8vw,7.4rem)] font-bold leading-[0.9] tracking-[-0.055em] text-ink">
            Close, even when
            <span className="block text-forest">you&apos;re far.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted md:text-xl">
            Shravan checks in with your parents every day—in the language they are
            comfortable with—and tells you what matters, without taking your place.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth"
              className="focus-ring inline-flex h-14 items-center justify-center gap-2 rounded-full bg-forest px-7 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-forest-dark"
            >
              See the Guardian demo
              <ArrowUpRight size={19} />
            </Link>
            <Link
              href="/e/demo-sushila"
              className="focus-ring inline-flex h-14 items-center justify-center rounded-full border border-[#c6d1c5] bg-white/80 px-7 font-bold text-forest transition hover:bg-white"
            >
              Open Elder Mode
            </Link>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted">
            {["No new app to learn", "Hindi + English", "Family stays in control"].map(
              (item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-leaf" />
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] rise [animation-delay:120ms]">
          <div className="absolute -left-10 top-1/3 h-48 w-48 rounded-full bg-[#edb74d]/20 blur-3xl" />
          <div className="relative rounded-[2.4rem] border border-white/80 bg-white/75 p-4 shadow-[0_35px_100px_rgba(31,89,72,.18)] backdrop-blur-xl sm:p-6">
            <div className="rounded-[1.9rem] bg-forest p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#cbe1d1]">
                    Today with Sushila ji
                  </p>
                  <p className="mt-3 font-serif text-3xl font-bold">All is well.</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15">
                  <Heart size={23} fill="currentColor" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-2">
                {[
                  ["Check-in", "Done"],
                  ["Medicines", "3 / 4"],
                  ["Mood", "4 / 5"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-white/10 p-3">
                    <p className="text-[11px] text-[#cbe1d1]">{label}</p>
                    <p className="mt-1 text-sm font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-2 pt-5 sm:grid-cols-2">
              <article className="rounded-3xl bg-[#fff5dc] p-5">
                <MessageCircleHeart className="text-[#a46a08]" />
                <h2 className="mt-6 font-serif text-xl font-bold">A warm daily ritual</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Sleep, meals, medicines, mood and a real conversation—never a survey.
                </p>
              </article>
              <article className="rounded-3xl bg-[#edf4e9] p-5">
                <ShieldCheck className="text-forest" />
                <h2 className="mt-6 font-serif text-xl font-bold">Scam-aware by design</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  A second opinion on suspicious calls and messages, with family alerts.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

