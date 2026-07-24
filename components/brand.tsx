import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex items-center gap-3 rounded-full"
      aria-label="Shravan home"
    >
      <span className="grid h-10 w-10 place-items-center rounded-full bg-forest text-lg font-black text-white shadow-sm">
        श
      </span>
      <span className="font-serif text-2xl font-bold tracking-tight text-ink">
        Shravan
      </span>
    </Link>
  );
}

