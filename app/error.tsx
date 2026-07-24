"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section className="max-w-lg rounded-[2rem] border border-[#ead9d0] bg-white p-8 text-center shadow-soft">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-coral">
          We could not finish that
        </p>
        <h1 className="text-3xl font-bold text-ink">Your information is still safe.</h1>
        <p className="mt-3 text-muted">
          Please try again. If this was urgent, call your family or 112 now.
        </p>
        <button
          className="focus-ring mt-6 rounded-full bg-forest px-6 py-3 font-bold text-white"
          onClick={reset}
        >
          Try again
        </button>
      </section>
    </main>
  );
}

