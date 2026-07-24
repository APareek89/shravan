import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { Brand } from "@/components/brand";
import { getGuardianSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const guardian = await getGuardianSession();
  if (!guardian) redirect("/auth");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 md:px-8">
          <Brand href="/dashboard" />
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard#alerts"
              className="focus-ring grid h-10 w-10 place-items-center rounded-full border border-line bg-white text-forest"
              aria-label="Alerts"
            >
              <Bell size={18} />
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-ink">{guardian.name}</p>
              <p className="text-xs text-muted">{guardian.isDemo ? "Demo guardian" : guardian.email}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                className="focus-ring grid h-10 w-10 place-items-center rounded-full text-muted transition hover:bg-white hover:text-ink"
                aria-label="Sign out"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

