import { NextResponse } from "next/server";
import {
  DEMO_GUARDIAN_ID,
  GUARDIAN_COOKIE,
} from "@/lib/auth/session";
import { createSignedSession } from "@/lib/auth/tokens";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  if (!env.ENABLE_PUBLIC_DEMO) {
    return NextResponse.redirect(new URL("/auth?error=demo_disabled", request.url), 303);
  }
  const response = NextResponse.redirect(new URL("/dashboard", request.url), 303);
  response.cookies.set(
    GUARDIAN_COOKIE,
    createSignedSession(DEMO_GUARDIAN_ID, "guardian", 60 * 60 * 24 * 30),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    },
  );
  return response;
}
