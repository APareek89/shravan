import { ArrowLeft, Pill } from "lucide-react";
import Link from "next/link";
import { MedicineList } from "@/components/medicine-list";
import { requireElderSession } from "@/lib/auth/session";
import { getElderHome } from "@/lib/data";

export default async function ElderMedsPage() {
  const session = await requireElderSession();
  const data = await getElderHome(session.elderId);
  if (!data) return null;
  const isHindi = data.elder.language === "hi";

  return (
    <main className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
      <Link href="/elder" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl font-bold text-forest">
        <ArrowLeft size={21} /> {isHindi ? "वापस" : "Back"}
      </Link>
      <div className="mt-3 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4e9] text-forest">
          <Pill size={29} />
        </span>
        <div>
          <h1 className="font-serif text-4xl font-bold">{isHindi ? "आज की दवाइयाँ" : "Today's medicines"}</h1>
          <p className="mt-1 text-base text-muted">
            {isHindi ? "दवाई लेने के बाद button दबाएँ" : "Tap Taken after each medicine"}
          </p>
        </div>
      </div>
      <div className="mt-7">
        <MedicineList initialMedications={data.medications} language={data.elder.language} />
      </div>
    </main>
  );
}

