import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.redirect(new URL("/dashboard", request.url));

  if (!code || !url || !key) {
    return NextResponse.redirect(new URL("/auth?error=missing_auth_config", request.url));
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.headers
          .get("cookie")
          ?.split(";")
          .map((part) => {
            const [name, ...rest] = part.trim().split("=");
            return { name, value: rest.join("=") };
          }) ?? [];
      },
      setAll(cookiesToSet) {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/auth?error=invalid_link", request.url));
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await db`
      insert into shravan.profiles (id, role, full_name, email, language)
      values (
        ${user.id},
        'guardian',
        ${String(user.user_metadata.full_name ?? user.email?.split("@")[0] ?? "Guardian")},
        ${user.email ?? null},
        'en'
      )
      on conflict (id) do update
      set email = excluded.email,
          full_name = coalesce(nullif(shravan.profiles.full_name, ''), excluded.full_name)
    `;
  }
  return response;
}
