"use client";

import { useRef, useState } from "react";
import { ArrowUp, CheckCircle2, LoaderCircle, MessageCircleHeart } from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "delta"; text: string }
  | { type: "done"; checkinSaved: boolean }
  | { type: "error"; message: string };

export function ChatClient({
  elderName,
  language,
}: {
  elderName: string;
  language: "hi" | "en";
}) {
  const isHindi = language === "hi";
  const initialGreeting = isHindi
    ? `नमस्ते ${elderName} ji। मैं यहाँ हूँ। कल रात आपकी नींद कैसी रही?`
    : `Hello ${elderName} ji. I'm here. How did you sleep last night?`;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: initialGreeting },
  ]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    window.requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError("");
    setBusy(true);
    setMessages((current) => [
      ...current,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    scrollToEnd();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: text,
          kind: "checkin",
        }),
      });
      if (!response.ok || !response.body) throw new Error("CHAT_UNAVAILABLE");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyEvent = (streamEvent: StreamEvent) => {
        if (streamEvent.type === "meta") setConversationId(streamEvent.conversationId);
        if (streamEvent.type === "delta") {
          setMessages((current) => {
            const next = [...current];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: last.content + streamEvent.text };
            }
            return next;
          });
          scrollToEnd();
        }
        if (streamEvent.type === "done") setSaved(streamEvent.checkinSaved);
        if (streamEvent.type === "error") setError(streamEvent.message);
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) applyEvent(JSON.parse(line) as StreamEvent);
        }
        if (done) break;
      }
      if (buffer.trim()) applyEvent(JSON.parse(buffer) as StreamEvent);
    } catch {
      setMessages((current) => {
        const next = [...current];
        if (next[next.length - 1]?.content === "") next.pop();
        return next;
      });
      setError(
        isHindi
          ? "अभी बात पूरी नहीं हो पाई। कृपया फिर कोशिश करें। ज़रूरत में अपने Guardian या 112 को फ़ोन करें।"
          : "We could not finish that. Please try again. For urgent help, call your Guardian or 112.",
      );
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col">
      <div className="flex-1 space-y-4 pb-6" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <span className="mr-2 mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-forest text-lg font-black text-white">
                श
              </span>
            )}
            <div
              className={`max-w-[82%] rounded-[1.5rem] px-5 py-4 leading-8 ${
                message.role === "user"
                  ? "rounded-br-md bg-[#e6eadf] text-ink"
                  : "rounded-bl-md border border-line bg-white shadow-sm"
              }`}
            >
              {message.content || (
                <span className="flex items-center gap-2 text-muted">
                  <LoaderCircle size={20} className="animate-spin" />
                  {isHindi ? "सुन रहा हूँ…" : "Listening…"}
                </span>
              )}
            </div>
          </div>
        ))}
        {saved && (
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-2xl bg-[#edf4e9] p-4 text-center font-bold text-forest">
            <CheckCircle2 />
            {isHindi ? "आज की check-in पूरी हुई" : "Today's check-in is complete"}
          </div>
        )}
        {error && <p className="rounded-2xl bg-[#fde8e2] p-4 text-base leading-7 text-coral">{error}</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="sticky bottom-0 rounded-[1.7rem] border border-line bg-white/95 p-3 shadow-[0_-14px_40px_rgba(32,66,53,.10)] backdrop-blur"
      >
        <label htmlFor="chat-input" className="sr-only">
          {isHindi ? "अपना जवाब लिखें" : "Type your reply"}
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="chat-input"
            rows={1}
            value={input}
            disabled={busy}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={isHindi ? "यहाँ लिखें…" : "Type here…"}
            className="focus-ring min-h-14 flex-1 resize-none rounded-2xl border-0 bg-[#f4f3ed] px-4 py-3 text-xl leading-8 outline-none"
          />
          <button
            disabled={busy || !input.trim()}
            className="focus-ring grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-forest text-white disabled:opacity-40"
            aria-label={isHindi ? "भेजें" : "Send"}
          >
            <ArrowUp size={25} />
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-2 text-xs text-muted">
          <MessageCircleHeart size={14} />
          {isHindi ? "Shravan medical सलाह नहीं देता" : "Shravan does not give medical advice"}
        </p>
      </form>
    </div>
  );
}

