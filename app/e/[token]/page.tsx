import { notFound } from "next/navigation";
import { ArrowRight, HeartHandshake, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";
import { getElderByInvite } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ElderInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const elder = await getElderByInvite(token);
  if (!elder) notFound();

  return (
    <main className="elder-shell grid place-items-center px-5 py-10">
      <section className="w-full max-w-lg text-center">
        <Brand />
        <div className="mt-8 rounded-[2.2rem] border border-white bg-white/85 p-7 shadow-soft sm:p-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-[1.7rem] bg-[#edf4e9] text-forest">
            <HeartHandshake size={38} />
          </div>
          <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.16em] text-forest">
            {elder.language === "hi" ? "आपका अपना सहायक" : "Your daily companion"}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold leading-tight">
            नमस्ते, {elder.nickname ?? elder.name} ji
          </h1>
          <p className="mt-4 leading-8 text-muted">
            मैं Shravan हूँ। हम रोज़ थोड़ी बात करेंगे, दवाइयों का ध्यान रखेंगे और
            किसी भी अजीब message को साथ में जाँचेंगे।
          </p>
          <form action="/api/invite/accept" method="post" className="mt-7">
            <input type="hidden" name="token" value={token} />
            <button className="focus-ring flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-forest px-5 text-xl font-bold text-white">
              शुरू करें
              <ArrowRight size={22} />
            </button>
          </form>
          <p className="mt-5 flex items-center justify-center gap-2 text-sm text-muted">
            <ShieldCheck size={17} className="text-forest" />
            यह private family link है
          </p>
        </div>
      </section>
    </main>
  );
}

