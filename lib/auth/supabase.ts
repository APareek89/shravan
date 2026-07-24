import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, hasSupabaseAuthConfig } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!hasSupabaseAuthConfig()) return null;
  const cookieStore = await cookies();
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !key) return null;

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // A Server Component cannot write cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

