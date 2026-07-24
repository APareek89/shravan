import { requireElderSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { languageSchema } from "@/lib/validation";

export async function PATCH(request: Request) {
  try {
    const session = await requireElderSession();
    const body = (await request.json()) as { language?: unknown };
    const language = languageSchema.parse(body.language);
    await db`
      update shravan.elders set language = ${language}
      where id = ${session.elderId}
    `;
    if (session.profileId) {
      await db`
        update shravan.profiles set language = ${language}
        where id = ${session.profileId}
      `;
    }
    return Response.json({ ok: true, language });
  } catch {
    return Response.json({ error: "Unable to change language" }, { status: 400 });
  }
}

