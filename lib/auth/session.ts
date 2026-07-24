import "server-only";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { verifySignedSession } from "@/lib/auth/tokens";

export const GUARDIAN_COOKIE = "shravan_guardian_demo";
export const ELDER_COOKIE = "shravan_elder";
export const DEMO_GUARDIAN_ID = "11111111-1111-4111-8111-111111111111";

export type GuardianSession = {
  id: string;
  name: string;
  email: string | null;
  isDemo: boolean;
};

export type ElderSession = {
  elderId: string;
  profileId: string | null;
};

export async function getGuardianSession(): Promise<GuardianSession | null> {
  const cookieStore = await cookies();
  const demo = verifySignedSession(
    cookieStore.get(GUARDIAN_COOKIE)?.value,
    "guardian",
  );

  let userId = demo?.sub ?? null;
  let isDemo = Boolean(demo);

  if (!userId) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getClaims();
      userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
      isDemo = false;
    }
  }

  if (!userId) return null;
  const [profile] = await db<
    { id: string; full_name: string; email: string | null }[]
  >`
    select id, full_name, email
    from shravan.profiles
    where id = ${userId} and role = 'guardian'
    limit 1
  `;
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    isDemo,
  };
}

export async function requireGuardianSession() {
  const session = await getGuardianSession();
  if (!session) throw new Error("UNAUTHENTICATED_GUARDIAN");
  return session;
}

export async function getElderSession(): Promise<ElderSession | null> {
  const cookieStore = await cookies();
  const session = verifySignedSession(
    cookieStore.get(ELDER_COOKIE)?.value,
    "elder",
  );
  if (!session) return null;

  const [elder] = await db<{ id: string; profile_id: string | null }[]>`
    select id, profile_id
    from shravan.elders
    where id = ${session.sub}
    limit 1
  `;
  if (!elder) return null;
  return { elderId: elder.id, profileId: elder.profile_id };
}

export async function requireElderSession() {
  const session = await getElderSession();
  if (!session) throw new Error("UNAUTHENTICATED_ELDER");
  return session;
}

