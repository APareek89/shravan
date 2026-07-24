import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Check,
  ChevronRight,
  CircleGauge,
  HeartPulse,
  MessageSquareText,
  Plus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";
import { MoodTrend } from "@/components/mood-trend";
import { SubmitButton } from "@/components/submit-button";
import { requireGuardianSession } from "@/lib/auth/session";
import { getGuardianDashboard } from "@/lib/data";
import { formatRelativeActivity } from "@/lib/time";
import {
  acknowledgeAlertAction,
  createElderAction,
} from "@/app/dashboard/actions";

const alertMeta = {
  URGENT: {
    label: "Urgent help",
    icon: BellRing,
    className: "bg-[#fde8e2] text-[#9f3425]",
  },
  SCAM_HIGH: {
    label: "High-risk scam",
    icon: ShieldAlert,
    className: "bg-[#fff1d4] text-[#8c5a00]",
  },
  LOW_MOOD: {
    label: "Mood needs attention",
    icon: HeartPulse,
    className: "bg-[#eee8f7] text-[#654391]",
  },
  MISSED_CHECKIN: {
    label: "Check-in missed",
    icon: AlertTriangle,
    className: "bg-[#e8eef4] text-[#34556f]",
  },
} as const;

function moodEmoji(score: number | null) {
  if (!score) return "—";
  return ["", "😟", "😕", "😐", "🙂", "😊"][score];
}

export default async function DashboardPage() {
  const guardian = await requireGuardianSession();
  const { elders, alerts, digests, today } = await getGuardianDashboard(guardian.id);
  if (!guardian) redirect("/auth");
  const openAlerts = alerts.filter((alert) => !alert.acknowledged);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-11">
      <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-forest">
            Family overview · {today}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight md:text-5xl">
            Good {new Date().getHours() < 12 ? "morning" : "evening"}, {guardian.name.split(" ")[0]}.
          </h1>
          <p className="mt-3 text-lg text-muted">
            Here&apos;s what matters today—without the guessing.
          </p>
        </div>
        <details className="group relative">
          <summary className="focus-ring flex h-12 cursor-pointer list-none items-center justify-center gap-2 rounded-full bg-forest px-5 font-bold text-white shadow-soft">
            <Plus size={18} />
            Add a parent
          </summary>
          <div className="absolute right-0 top-14 z-20 w-[min(92vw,430px)] rounded-3xl border border-line bg-white p-5 shadow-[0_25px_70px_rgba(20,50,40,.18)]">
            <h2 className="font-serif text-2xl font-bold">Create an Elder profile</h2>
            <p className="mt-1 text-sm text-muted">You can update these details later.</p>
            <form action={createElderAction} className="mt-5 grid gap-3">
              <input required name="name" placeholder="Full name" className="h-12 rounded-xl border border-line px-4" />
              <div className="grid grid-cols-2 gap-3">
                <input name="nickname" placeholder="Called as" className="h-12 rounded-xl border border-line px-4" />
                <input name="city" placeholder="City" className="h-12 rounded-xl border border-line px-4" />
              </div>
              <input name="interests" placeholder="Interests, comma separated" className="h-12 rounded-xl border border-line px-4" />
              <select name="language" defaultValue="hi" className="h-12 rounded-xl border border-line px-4">
                <option value="hi">Hindi / Hinglish</option>
                <option value="en">English</option>
              </select>
              <SubmitButton className="h-12 rounded-xl bg-forest font-bold text-white">
                Create profile
              </SubmitButton>
            </form>
          </div>
        </details>
      </section>

      {!elders.length ? (
        <section className="mt-10 rounded-[2rem] border border-dashed border-[#bac8b8] bg-white/60 p-12 text-center">
          <Sparkles className="mx-auto text-sun" />
          <h2 className="mt-5 font-serif text-3xl font-bold">Add someone you care for</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted">
            Their daily check-in, medicines and alerts will appear here.
          </p>
        </section>
      ) : (
        <section className="mt-9 grid gap-6 xl:grid-cols-2">
          {elders.map((elder) => (
            <article
              key={elder.id}
              className="overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-soft backdrop-blur"
            >
              <div className="flex items-start justify-between gap-5 border-b border-line p-6">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#edf4e9] font-serif text-2xl font-bold text-forest">
                    {elder.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold">{elder.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {elder.city ?? "City not set"} · Active {formatRelativeActivity(elder.last_active)}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/elder/${elder.id}`}
                  className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-forest transition hover:bg-[#edf4e9]"
                  aria-label={`Manage ${elder.name}`}
                >
                  <ChevronRight size={20} />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-px bg-line">
                <div className="bg-white p-4">
                  <CalendarCheck2 size={18} className="text-forest" />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">Check-in</p>
                  <p className="mt-1 font-bold">{elder.checkin_done ? "Done" : "Pending"}</p>
                </div>
                <div className="bg-white p-4">
                  <span className="text-xl">{moodEmoji(elder.mood_score)}</span>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">Mood</p>
                  <p className="mt-1 font-bold">{elder.mood_score ? `${elder.mood_score} / 5` : "No score"}</p>
                </div>
                <div className="bg-white p-4">
                  <CircleGauge size={18} className="text-forest" />
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted">Medicines</p>
                  <p className="mt-1 font-bold">{elder.meds_taken} / {elder.meds_total}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">14-day rhythm</p>
                    <p className="mt-1 text-xs text-muted">
                      {elder.streak}-day check-in streak · {elder.adherence}% medicine adherence
                    </p>
                  </div>
                  <span className="rounded-full bg-[#edf4e9] px-3 py-1 text-xs font-bold text-forest">
                    Mood trend
                  </span>
                </div>
                <div className="mt-3">
                  <MoodTrend points={elder.mood_trend} />
                </div>
                <div className="mt-3 flex gap-3">
                  <Link
                    href={`/e/${elder.invite_token}`}
                    className="focus-ring flex h-11 flex-1 items-center justify-center rounded-xl border border-line text-sm font-bold text-forest hover:bg-[#edf4e9]"
                  >
                    Open Elder Mode
                  </Link>
                  <Link
                    href={`/dashboard/elder/${elder.id}`}
                    className="focus-ring flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-forest text-sm font-bold text-white"
                  >
                    View details <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <section id="alerts" className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-coral">Needs you</p>
              <h2 className="mt-2 font-serif text-2xl font-bold">Alerts</h2>
            </div>
            <span className="grid h-9 min-w-9 place-items-center rounded-full bg-[#fde8e2] px-3 text-sm font-bold text-coral">
              {openAlerts.length}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {!alerts.length && (
              <div className="rounded-2xl bg-[#edf4e9] p-5 text-center text-sm text-forest">
                No alerts. All quiet here.
              </div>
            )}
            {alerts.slice(0, 6).map((alert) => {
              const meta = alertMeta[alert.kind];
              const Icon = meta.icon;
              return (
                <article
                  key={alert.id}
                  className={`flex gap-4 rounded-2xl border p-4 ${
                    alert.acknowledged ? "border-line bg-[#fafaf7] opacity-60" : "border-[#eadfd6] bg-white"
                  }`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${meta.className}`}>
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{meta.label}</p>
                      <span className="text-xs text-muted">· {alert.elder_name}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">{alert.detail}</p>
                  </div>
                  {!alert.acknowledged && (
                    <form action={acknowledgeAlertAction}>
                      <input type="hidden" name="alertId" value={alert.id} />
                      <button className="focus-ring grid h-9 w-9 place-items-center rounded-full border border-line text-forest" aria-label="Acknowledge alert">
                        <Check size={17} />
                      </button>
                    </form>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-forest p-6 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/12">
              <MessageSquareText size={19} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#bfd9c7]">From Shravan</p>
              <h2 className="font-serif text-2xl font-bold">Weekly digest</h2>
            </div>
          </div>
          {digests[0] ? (
            <>
              <p className="mt-6 text-sm font-bold text-[#cde3d3]">
                Week of {digests[0].week_start} · {digests[0].elder_name}
              </p>
              <p className="mt-3 leading-7 text-[#f0f7f1]">{digests[0].content}</p>
            </>
          ) : (
            <p className="mt-6 leading-7 text-[#d8e9dd]">
              Your first digest will appear after a week of check-ins.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

