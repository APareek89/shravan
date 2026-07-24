import Link from "next/link";
import { ArrowLeft, MessageCircleHeart } from "lucide-react";
import { ChatClient } from "@/components/chat-client";
import { requireElderSession } from "@/lib/auth/session";
import { getElderHome } from "@/lib/data";

export default async function ElderChatPage() {
  const session = await requireElderSession();
  const data = await getElderHome(session.elderId);
  if (!data) return null;
  const isHindi = data.elder.language === "hi";

  return (
    <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6">
      <div className="mb-5 flex items-center gap-3">
        <Link href="/elder" className="focus-ring grid h-12 w-12 place-items-center rounded-2xl border border-line bg-white text-forest" aria-label="Back">
          <ArrowLeft size={23} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold">
            <MessageCircleHeart className="text-forest" />
            {isHindi ? "आज की बात" : "Today's check-in"}
          </h1>
          <p className="text-sm text-muted">{isHindi ? "आप आराम से बोलिए" : "Take your time"}</p>
        </div>
      </div>
      <ChatClient
        elderName={data.elder.nickname ?? data.elder.name}
        language={data.elder.language}
      />
    </main>
  );
}

