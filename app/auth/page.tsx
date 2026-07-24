import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    null;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand />
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-forest">
            Guardian access
          </p>
          <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight">
            Peace of mind, one check-in at a time.
          </h1>
          <p className="mt-3 leading-7 text-muted">
            No passwords. We&apos;ll email you a private sign-in link.
          </p>
        </div>
        <div className="rounded-[2rem] border border-white bg-white/85 p-6 shadow-soft backdrop-blur sm:p-8">
          <AuthForm
            supabaseUrl={url}
            publishableKey={publishableKey}
            redirectTo={`${appUrl}/auth/callback`}
            demoEnabled={env.ENABLE_PUBLIC_DEMO}
          />
          {env.ENABLE_PUBLIC_DEMO && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted">
                  Demo
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>
              <form action="/api/auth/demo" method="post">
                <button className="focus-ring h-14 w-full rounded-2xl border border-forest bg-white font-bold text-forest transition hover:bg-[#edf4e9]">
                  Continue as Ananya
                </button>
              </form>
              <p className="mt-4 text-center text-xs leading-5 text-muted">
                Seeded with Sushila ji&apos;s 10-day story. No personal data is needed.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
