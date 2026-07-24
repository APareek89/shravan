import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircleHeart,
  Pill,
  ShieldQuestion,
  Sun,
} from "lucide-react";
import { requireElderSession } from "@/lib/auth/session";
import { getElderHome } from "@/lib/data";
import { istHourMinute } from "@/lib/time";

const slotDueHour = {
  morning: 10,
  afternoon: 15,
  evening: 20,
  night: 23,
};

export default async function ElderHomePage() {
  const session = await requireElderSession();
  const data = await getElderHome(session.elderId);
  if (!data) return null;
  const { elder, medications } = data;
  const isHindi = elder.language === "hi";
  const { hour } = istHourMinute();
  const due = medications.filter(
    (medication) => !medication.taken && hour >= slotDueHour[medication.slot] - 2,
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
      <section className="rounded-[2rem] bg-forest p-6 text-white shadow-soft sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-base font-bold text-[#cee4d4]">
              <Sun size={20} />
              {isHindi ? "आज का दिन" : "Today"}
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-tight">
              {isHindi ? "नमस्ते" : "Hello"}, {elder.nickname ?? elder.name} ji
            </h1>
            <p className="mt-3 leading-8 text-[#e3f0e6]">
              {elder.checkin_done
                ? isHindi
                  ? "आज की बात हो गई। जब मन करे, फिर से बात कर सकते हैं।"
                  : "Today's check-in is done. You can still talk whenever you like."
                : isHindi
                  ? "जब आप तैयार हों, थोड़ी बात करते हैं।"
                  : "When you are ready, let's have our daily chat."}
            </p>
          </div>
          {elder.checkin_done && <CheckCircle2 size={34} className="shrink-0 text-[#cce8c6]" />}
        </div>
        <Link
          href="/elder/chat"
          className="focus-ring mt-7 flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-5 text-xl font-bold text-forest"
        >
          <span className="flex items-center gap-3">
            <MessageCircleHeart size={28} />
            {isHindi ? "आज की बात करें" : "Talk to Shravan"}
          </span>
          <ArrowRight size={23} />
        </Link>
      </section>

      {due.length > 0 && (
        <section className="mt-5 rounded-3xl border border-[#edd49b] bg-[#fff5d9] p-5">
          <p className="font-bold text-[#725116]">
            {isHindi
              ? `${due.length} दवाई ${due.length === 1 ? "लेनी है" : "लेनी हैं"}`
              : `${due.length} medicine ${due.length === 1 ? "is" : "are"} due`}
          </p>
          <p className="mt-1 text-base text-[#84682a]">
            {due.map((medication) => medication.name).join(", ")}
          </p>
        </section>
      )}

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <Link
          href="/elder/meds"
          className="focus-ring group rounded-[1.8rem] border border-line bg-white p-6 shadow-sm transition hover:border-leaf"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4e9] text-forest">
            <Pill size={28} />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-bold">
            {isHindi ? "मेरी दवाइयाँ" : "My medicines"}
          </h2>
          <p className="mt-2 text-base text-muted">
            {medications.filter((medication) => medication.taken).length} / {medications.length}{" "}
            {isHindi ? "आज लीं" : "taken today"}
          </p>
        </Link>
        <Link
          href="/elder/scam"
          className="focus-ring group rounded-[1.8rem] border border-line bg-white p-6 shadow-sm transition hover:border-sun"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff4d8] text-[#91620c]">
            <ShieldQuestion size={29} />
          </span>
          <h2 className="mt-5 font-serif text-2xl font-bold">
            {isHindi ? "सच या fraud?" : "Is this a scam?"}
          </h2>
          <p className="mt-2 text-base text-muted">
            {isHindi ? "Message या call साथ में जाँचें" : "Check a message or call together"}
          </p>
        </Link>
      </section>

      <p className="mt-8 text-center text-sm leading-6 text-muted">
        {isHindi
          ? `Shravan आपके परिवार की मदद करता है—उनकी जगह नहीं लेता। ज़रूरत में ${elder.guardian_name} को फ़ोन करें।`
          : `Shravan supports your family—it never replaces them. Call ${elder.guardian_name} when you need help.`}
      </p>
    </main>
  );
}

