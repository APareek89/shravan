import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Pill,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
} from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { requireGuardianSession } from "@/lib/auth/session";
import { getGuardianElderDetail } from "@/lib/data";
import {
  deactivateMedicationAction,
  regenerateInviteAction,
  saveMedicationAction,
  updateElderAction,
} from "@/app/dashboard/actions";

const slotLabels = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export default async function ElderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const guardian = await requireGuardianSession();
  const data = await getGuardianElderDetail(guardian.id, id);
  if (!data) notFound();
  const { elder, medications, digests } = data;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/e/${elder.invite_token}`;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-11">
      <Link href="/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-full text-sm font-bold text-forest">
        <ArrowLeft size={17} /> Back to overview
      </Link>

      <section className="mt-6 overflow-hidden rounded-[2rem] bg-forest text-white shadow-soft">
        <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:p-9">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/13 font-serif text-4xl font-bold">
              {elder.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c7dfce]">Elder profile</p>
              <h1 className="mt-2 font-serif text-4xl font-bold">{elder.name}</h1>
              <p className="mt-2 text-[#d9eadf]">{elder.city ?? "City not set"} · {elder.language === "hi" ? "Hindi / Hinglish" : "English"}</p>
            </div>
          </div>
          <Link
            href={`/e/${elder.invite_token}`}
            className="focus-ring inline-flex h-12 items-center justify-center gap-2 self-center rounded-full bg-white px-5 font-bold text-forest"
          >
            Open Elder Mode <ExternalLink size={17} />
          </Link>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.85fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <UserRound className="text-forest" />
              <h2 className="font-serif text-2xl font-bold">Profile</h2>
            </div>
            <form action={updateElderAction} className="mt-5 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="elderId" value={elder.id} />
              <label className="text-sm font-bold">
                Full name
                <input name="name" required defaultValue={elder.name} className="mt-2 h-12 w-full rounded-xl border border-line px-4 font-normal" />
              </label>
              <label className="text-sm font-bold">
                Shravan calls them
                <input name="nickname" defaultValue={elder.nickname ?? ""} className="mt-2 h-12 w-full rounded-xl border border-line px-4 font-normal" />
              </label>
              <label className="text-sm font-bold">
                City
                <input name="city" defaultValue={elder.city ?? ""} className="mt-2 h-12 w-full rounded-xl border border-line px-4 font-normal" />
              </label>
              <label className="text-sm font-bold">
                Language
                <select name="language" defaultValue={elder.language} className="mt-2 h-12 w-full rounded-xl border border-line px-4 font-normal">
                  <option value="hi">Hindi / Hinglish</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="text-sm font-bold sm:col-span-2">
                Interests
                <input name="interests" defaultValue={elder.interests.join(", ")} className="mt-2 h-12 w-full rounded-xl border border-line px-4 font-normal" />
              </label>
              <SubmitButton className="h-12 rounded-xl bg-forest font-bold text-white sm:col-span-2">
                Save profile
              </SubmitButton>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill className="text-forest" />
                <div>
                  <h2 className="font-serif text-2xl font-bold">Medicines</h2>
                  <p className="mt-1 text-sm text-muted">{medications.filter((med) => med.active).length} active</p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {medications.filter((medication) => medication.active).map((medication) => (
                <details key={medication.id} className="group rounded-2xl border border-line bg-[#fafaf6]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-bold">{medication.name} <span className="font-normal text-muted">{medication.dosage}</span></p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-forest">{slotLabels[medication.slot]}</p>
                    </div>
                    <span className="text-sm font-bold text-muted">Edit</span>
                  </summary>
                  <form action={saveMedicationAction} className="grid gap-3 border-t border-line p-4 sm:grid-cols-2">
                    <input type="hidden" name="elderId" value={elder.id} />
                    <input type="hidden" name="medicationId" value={medication.id} />
                    <input name="name" required defaultValue={medication.name} className="h-11 rounded-xl border border-line px-3" />
                    <input name="dosage" defaultValue={medication.dosage ?? ""} className="h-11 rounded-xl border border-line px-3" />
                    <select name="slot" defaultValue={medication.slot} className="h-11 rounded-xl border border-line px-3">
                      {Object.entries(slotLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <input name="notes" defaultValue={medication.notes ?? ""} className="h-11 rounded-xl border border-line px-3" />
                    <SubmitButton className="h-11 rounded-xl bg-forest text-sm font-bold text-white">Update</SubmitButton>
                  </form>
                  <form action={deactivateMedicationAction} className="px-4 pb-4">
                    <input type="hidden" name="elderId" value={elder.id} />
                    <input type="hidden" name="medicationId" value={medication.id} />
                    <button className="focus-ring flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#efd5ce] text-sm font-bold text-coral">
                      <Trash2 size={15} /> Remove medicine
                    </button>
                  </form>
                </details>
              ))}
            </div>

            <details className="group mt-4">
              <summary className="focus-ring flex h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-xl border border-dashed border-forest font-bold text-forest">
                <Plus size={17} /> Add medicine
              </summary>
              <form action={saveMedicationAction} className="mt-4 grid gap-3 rounded-2xl bg-[#edf4e9] p-4 sm:grid-cols-2">
                <input type="hidden" name="elderId" value={elder.id} />
                <input name="name" required placeholder="Medicine name" className="h-11 rounded-xl border border-line px-3" />
                <input name="dosage" placeholder="Dosage" className="h-11 rounded-xl border border-line px-3" />
                <select name="slot" defaultValue="morning" className="h-11 rounded-xl border border-line px-3">
                  {Object.entries(slotLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <input name="notes" placeholder="Notes" className="h-11 rounded-xl border border-line px-3" />
                <SubmitButton className="h-11 rounded-xl bg-forest font-bold text-white sm:col-span-2">
                  Add medicine
                </SubmitButton>
              </form>
            </details>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <Copy className="text-forest" />
              <h2 className="font-serif text-2xl font-bold">Invite link</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              Open this once on {elder.nickname ?? elder.name}&apos;s phone. Their secure session lasts 30 days.
            </p>
            <div className="mt-4 break-all rounded-2xl bg-[#f2f3ed] p-4 font-mono text-xs text-forest">{inviteUrl}</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Link href={`/e/${elder.invite_token}`} className="focus-ring flex h-11 items-center justify-center gap-2 rounded-xl bg-forest text-sm font-bold text-white">
                Open <ExternalLink size={15} />
              </Link>
              <form action={regenerateInviteAction}>
                <input type="hidden" name="elderId" value={elder.id} />
                <button className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-sm font-bold text-forest">
                  <RefreshCw size={15} /> Regenerate
                </button>
              </form>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted">
              <Clock3 size={14} /> Expires {elder.invite_expires_at ? new Date(elder.invite_expires_at).toLocaleDateString() : "soon"}
            </p>
          </section>

          <section className="rounded-[2rem] bg-forest p-6 text-white shadow-soft">
            <div className="flex items-center gap-3">
              <FileText />
              <h2 className="font-serif text-2xl font-bold">Digest history</h2>
            </div>
            <div className="mt-5 space-y-4">
              {digests.length ? digests.map((digest) => (
                <article key={digest.id} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#c6decd]">Week of {digest.week_start}</p>
                  <p className="mt-2 text-sm leading-6 text-[#edf6ef]">{digest.content}</p>
                </article>
              )) : <p className="text-[#d5e6da]">The first weekly digest will appear here.</p>}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

