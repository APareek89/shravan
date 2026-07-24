import { z } from "zod";
import { requireElderSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { istDate } from "@/lib/time";

const requestSchema = z.object({ medicationId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const session = await requireElderSession();
    const { medicationId } = requestSchema.parse(await request.json());
    const [medication] = await db<{ id: string }[]>`
      select id from shravan.medications
      where id = ${medicationId} and elder_id = ${session.elderId} and active
    `;
    if (!medication) return Response.json({ error: "Medicine not found" }, { status: 404 });

    await db`
      insert into shravan.med_logs (medication_id, elder_id, log_date)
      values (${medicationId}, ${session.elderId}, ${istDate()})
      on conflict (medication_id, log_date)
      do update set taken_at = now()
    `;
    return Response.json({ ok: true });
  } catch (error) {
    const status =
      error instanceof Error && error.message === "UNAUTHENTICATED_ELDER" ? 401 : 400;
    return Response.json({ error: "Unable to log medicine" }, { status });
  }
}

