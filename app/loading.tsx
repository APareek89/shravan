export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-forest" />
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-forest">
          Shravan is listening
        </p>
      </div>
    </div>
  );
}

