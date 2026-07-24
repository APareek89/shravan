import { db } from "@/lib/db";

export async function GET() {
  try {
    await db`select 1 as ok`;
    return Response.json({ ok: true, service: "shravan" });
  } catch {
    return Response.json({ ok: false, service: "shravan" }, { status: 503 });
  }
}

