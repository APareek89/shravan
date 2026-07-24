import { NextResponse } from "next/server";
import { GUARDIAN_COOKIE, ELDER_COOKIE } from "@/lib/auth/session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  response.cookies.delete(GUARDIAN_COOKIE);
  response.cookies.delete(ELDER_COOKIE);
  return response;
}

