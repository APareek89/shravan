import Link from "next/link";
import { ArrowLeft, ShieldQuestion } from "lucide-react";
import { ScamChecker } from "@/components/scam-checker";
import { requireElderSession } from "@/lib/auth/session";
import { getElderHome } from "@/lib/data";

export default async function ScamPage() {
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
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fff4d8] text-[#91620c]">
          <ShieldQuestion size={30} />
        </span>
        <div>
          <h1 className="font-serif text-4xl font-bold">{isHindi ? "यह सच है या fraud?" : "Is this real or a scam?"}</h1>
          <p className="mt-1 text-base text-muted">
            {isHindi ? "कोई जल्दबाज़ी नहीं। साथ में देखते हैं।" : "No rush. Let's look at it together."}
          </p>
        </div>
      </div>
      <div className="mt-7">
        <ScamChecker language={data.elder.language} />
      </div>
    </main>
  );
}

