import { NextResponse } from "next/server";
import { ELDER_COOKIE } from "@/lib/auth/session";
import { createSignedSession } from "@/lib/auth/tokens";
import { getElderByInvite } from "@/lib/data";

export async function POST(request: Request) {
  const formData = await request.formData();
  const token = formData.get("token");
  if (typeof token !== "string") {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }
  const elder = await getElderByInvite(token);
  if (!elder) {
    return NextResponse.redirect(new URL(`/e/${token}?expired=1`, request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/elder", request.url), 303);
  response.cookies.set(
    ELDER_COOKIE,
    createSignedSession(elder.id, "elder", 60 * 60 * 24 * 30),
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

