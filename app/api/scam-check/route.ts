import crypto from "node:crypto";
import { anthropic } from "@/lib/anthropic";
import { requireElderSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { sendGuardianAlertEmail } from "@/lib/email";
import { env } from "@/lib/env";
import {
  canUseScamModel,
  fallbackScamCopy,
  maxRisk,
  scamRuleRisk,
  type ScamRisk,
} from "@/lib/safety";
import { istDate } from "@/lib/time";
import { scamRequestSchema, scamResultSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const session = await requireElderSession();
    const { message } = scamRequestSchema.parse(await request.json());
    const ruleRisk = scamRuleRisk(message);

    const [elder] = await db<
      {
        id: string;
        name: string;
        language: "hi" | "en";
        guardian_id: string;
        guardian_name: string;
        guardian_email: string | null;
      }[]
    >`
      select e.id, e.name, e.language, e.guardian_id, p.full_name as guardian_name,
             p.email as guardian_email
      from shravan.elders e
      join shravan.profiles p on p.id = e.guardian_id
      where e.id = ${session.elderId}
    `;
    if (!elder) return Response.json({ error: "Elder not found" }, { status: 404 });

    let modelResult = {
      risk: ruleRisk,
      ...fallbackScamCopy(ruleRisk),
    };

    const [dailyUsage] = await db<{ checks: number }[]>`
      select count(*)::int as checks
      from shravan.conversations c
      join shravan.elders e on e.id = c.elder_id
      where e.guardian_id = ${elder.guardian_id}
        and c.kind = 'scam_check'
        and (c.started_at at time zone 'Asia/Kolkata')::date = ${istDate()}
    `;
    if (canUseScamModel(dailyUsage?.checks ?? 0, env.DAILY_SCAM_MODEL_LIMIT)) {
      try {
        const response = await anthropic.messages.create({
          model: env.UTILITY_MODEL,
          max_tokens: 700,
          temperature: 0,
          system: `You classify potential scams for an elderly person in India.
The deterministic rule layer has set minimum risk ${ruleRisk}. You may raise but never
lower that risk. Never say a message is definitely safe. LOW must still warn against
sharing money, OTP, PIN, CVV, or acting without Guardian ${elder.guardian_name}.
Use plain respectful Hindi and English. The action must be a short direct instruction.`,
          messages: [{ role: "user", content: message }],
          tools: [
            {
              name: "classify_scam",
              description: "Return the scam risk and safe next action.",
              input_schema: {
                type: "object",
                properties: {
                  risk: { type: "string", enum: ["LOW", "SUSPICIOUS", "HIGH"] },
                  explanation_hi: { type: "string" },
                  explanation_en: { type: "string" },
                  action: { type: "string" },
                },
                required: ["risk", "explanation_hi", "explanation_en", "action"],
                additionalProperties: false,
              },
            },
          ],
          tool_choice: { type: "tool", name: "classify_scam" },
        });
        const tool = response.content.find((block) => block.type === "tool_use");
        const parsed = tool ? scamResultSchema.safeParse(tool.input) : null;
        if (parsed?.success) {
          const finalRisk = maxRisk(ruleRisk, parsed.data.risk as ScamRisk);
          modelResult = { ...parsed.data, risk: finalRisk };
        }
      } catch {
        console.error("Scam classification model failed; deterministic fallback used.", {
          elderId: elder.id,
        });
      }
    }

    const detail = `${modelResult.explanation_en} ${modelResult.action}`;
    const messageFingerprint = crypto
      .createHash("sha256")
      .update(message.trim().toLowerCase())
      .digest("hex")
      .slice(0, 20);
    let alertCreated = false;
    await db.begin(async (transaction) => {
      const [conversation] = await transaction<{ id: string }[]>`
        insert into shravan.conversations (elder_id, kind)
        values (${elder.id}, 'scam_check')
        returning id
      `;
      await transaction`
        insert into shravan.messages (conversation_id, role, content)
        values
          (${conversation.id}, 'user', ${message}),
          (${conversation.id}, 'assistant', ${JSON.stringify(modelResult)})
      `;
      if (modelResult.risk === "HIGH") {
        const inserted = await transaction`
          insert into shravan.alerts (elder_id, kind, detail, dedupe_key)
          values (
            ${elder.id}, 'SCAM_HIGH', ${detail},
            ${`scam:${elder.id}:${istDate()}:${messageFingerprint}`}
          )
          on conflict (dedupe_key) do nothing
          returning id
        `;
        alertCreated = inserted.length > 0;
      }
    });

    if (modelResult.risk === "HIGH" && alertCreated) {
      await sendGuardianAlertEmail({
        to: elder.guardian_email,
        elderName: elder.name,
        subject: `Shravan alert: high-risk scam for ${elder.name}`,
        detail,
      });
    }

    return Response.json(modelResult);
  } catch (error) {
    const status =
      error instanceof Error && error.message === "UNAUTHENTICATED_ELDER" ? 401 : 400;
    return Response.json(
      { error: "अभी जाँच नहीं हो पाई। कोई पैसे या OTP न दें और अपने Guardian को फ़ोन करें।" },
      { status },
    );
  }
}
