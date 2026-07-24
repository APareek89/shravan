import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "@/lib/anthropic";
import { requireElderSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { buildCheckinSystemPrompt } from "@/lib/prompts";
import {
  containsDistress,
  DISTRESS_RESPONSE_EN,
  DISTRESS_RESPONSE_HI,
} from "@/lib/safety";
import { istDate } from "@/lib/time";
import { chatRequestSchema, checkinSaveSchema } from "@/lib/validation";

const encoder = new TextEncoder();

function eventLine(event: object) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

function fixedStream(events: object[]) {
  return new Response(
    new ReadableStream({
      start(controller) {
        events.forEach((event) => controller.enqueue(eventLine(event)));
        controller.close();
      },
    }),
    {
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function POST(request: Request) {
  try {
    const session = await requireElderSession();
    const body = chatRequestSchema.parse(await request.json());
    const today = istDate();

    const [elder] = await db<
      {
        id: string;
        name: string;
        nickname: string | null;
        city: string | null;
        language: "hi" | "en";
        interests: string[];
        guardian_name: string;
      }[]
    >`
      select e.id, e.name, e.nickname, e.city, e.language, e.interests,
             p.full_name as guardian_name
      from shravan.elders e
      join shravan.profiles p on p.id = e.guardian_id
      where e.id = ${session.elderId}
    `;
    if (!elder) return Response.json({ error: "Elder not found" }, { status: 404 });

    let conversationId = body.conversationId;
    if (conversationId) {
      const [owned] = await db<{ id: string }[]>`
        select id from shravan.conversations
        where id = ${conversationId} and elder_id = ${elder.id}
          and kind in ('checkin', 'free_chat')
      `;
      if (!owned) return Response.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      const [conversation] = await db<{ id: string }[]>`
        insert into shravan.conversations (elder_id, kind)
        values (${elder.id}, ${body.kind})
        returning id
      `;
      conversationId = conversation.id;
      const greeting =
        elder.language === "hi"
          ? `नमस्ते ${elder.nickname ?? elder.name} ji। मैं यहाँ हूँ। कल रात आपकी नींद कैसी रही?`
          : `Hello ${elder.nickname ?? elder.name} ji. I'm here. How did you sleep last night?`;
      await db`
        insert into shravan.messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${greeting})
      `;
    }

    await db`
      insert into shravan.messages (conversation_id, role, content)
      values (${conversationId}, 'user', ${body.message})
    `;

    if (containsDistress(body.message)) {
      const distressCopy =
        elder.language === "hi" ? DISTRESS_RESPONSE_HI : DISTRESS_RESPONSE_EN;
      let urgentAlertPersisted = true;
      try {
        await db`
          insert into shravan.alerts (elder_id, kind, detail, dedupe_key)
          values (
            ${elder.id}, 'URGENT',
            ${`Distress phrase detected in chat: ${body.message.slice(0, 500)}`},
            ${`urgent:${conversationId}`}
          )
          on conflict (dedupe_key) do nothing
        `;
      } catch {
        urgentAlertPersisted = false;
      }
      await db`
        insert into shravan.messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${distressCopy})
      `.catch(() => undefined);
      const degradedCopy =
        elder.language === "hi"
          ? " Guardian alert अभी नहीं भेज पाया—कृपया खुद अभी फ़ोन करें।"
          : " I could not send the Guardian alert—please call them yourself now.";
      const events: object[] = [
        { type: "meta", conversationId },
        { type: "delta", text: distressCopy },
      ];
      if (!urgentAlertPersisted) {
        events.push({ type: "delta", text: degradedCopy });
      }
      events.push({
        type: "done",
        checkinSaved: false,
        urgentAlertPersisted,
      });
      return fixedStream(events);
    }

    const messages = await db<{ role: "user" | "assistant"; content: string }[]>`
      select role, content
      from shravan.messages
      where conversation_id = ${conversationId}
      order by created_at desc
      limit 30
    `;
    messages.reverse();
    const [turns] = await db<{ count: number }[]>`
      select count(*)::int as count
      from shravan.messages
      where conversation_id = ${conversationId} and role = 'user'
    `;
    const forceClose = (turns?.count ?? 0) >= 25;

    const medicines = await db<
      { name: string; dosage: string | null; slot: string; taken: boolean }[]
    >`
      select m.name, m.dosage, m.slot, (ml.id is not null) as taken
      from shravan.medications m
      left join shravan.med_logs ml
        on ml.medication_id = m.id and ml.log_date = ${today}
      where m.elder_id = ${elder.id} and m.active
      order by case m.slot when 'morning' then 1 when 'afternoon' then 2
                            when 'evening' then 3 else 4 end
    `;
    const [yesterday] = await db<{ summary: string | null }[]>`
      select summary
      from shravan.checkins
      where elder_id = ${elder.id} and checkin_date < ${today}
      order by checkin_date desc
      limit 1
    `;
    const [usage] = await db<{ tokens: number }[]>`
      select coalesce(input_tokens + output_tokens, 0)::int as tokens
      from shravan.token_usage
      where elder_id = ${elder.id} and usage_date = ${today}
    `;

    if ((usage?.tokens ?? 0) >= env.DAILY_TOKEN_BUDGET) {
      const close =
        elder.language === "hi"
          ? "आज हमने काफ़ी बात कर ली, धन्यवाद। अभी थोड़ा आराम कीजिए। ज़रूरत में अपने Guardian को फ़ोन करें—मैं कल फिर यहीं मिलूँगा।"
          : "Thank you, we have talked plenty today. Please rest now. Call your Guardian if you need anything—I will be here again tomorrow.";
      await db`
        insert into shravan.messages (conversation_id, role, content)
        values (${conversationId}, 'assistant', ${close})
      `;
      return fixedStream([
        { type: "meta", conversationId },
        { type: "delta", text: close },
        { type: "done", checkinSaved: false, budgetReached: true },
      ]);
    }

    const system = buildCheckinSystemPrompt({
      date: today,
      elder: {
        nickname: elder.nickname ?? elder.name,
        city: elder.city,
        language: elder.language,
        interests: elder.interests,
      },
      guardianName: elder.guardian_name,
      medicines,
      yesterdaySummary: yesterday?.summary ?? null,
      forceClose,
    });

    const modelMessages: Anthropic.MessageParam[] = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const stream = anthropic.messages.stream({
      model: env.CHECKIN_MODEL,
      max_tokens: forceClose ? 700 : 1_200,
      temperature: 0.5,
      system,
      messages: modelMessages,
      tools: [
        {
          name: "save_checkin",
          description:
            "Save today's structured check-in once the conversation naturally closes.",
          input_schema: {
            type: "object",
            properties: {
              slept_well: { type: ["boolean", "null"] },
              ate_meals: { type: ["boolean", "null"] },
              meals_note: { type: ["string", "null"] },
              mood_score: { type: ["integer", "null"], minimum: 1, maximum: 5 },
              mobility_ok: { type: ["boolean", "null"] },
              pain_note: { type: ["string", "null"] },
              concerns: { type: ["string", "null"] },
              summary: { type: "string" },
            },
            required: [
              "slept_well",
              "ate_meals",
              "meals_note",
              "mood_score",
              "mobility_ok",
              "pain_note",
              "concerns",
              "summary",
            ],
            additionalProperties: false,
          },
        },
      ],
      ...(forceClose
        ? { tool_choice: { type: "tool" as const, name: "save_checkin" } }
        : {}),
    });

    return new Response(
      new ReadableStream({
        async start(controller) {
          controller.enqueue(eventLine({ type: "meta", conversationId }));
          let assistantText = "";
          let saved = false;
          try {
            for await (const event of stream) {
              if (
                event.type === "content_block_delta" &&
                event.delta.type === "text_delta"
              ) {
                assistantText += event.delta.text;
                controller.enqueue(eventLine({ type: "delta", text: event.delta.text }));
              }
            }

            const finalMessage = await stream.finalMessage();
            const saveTool = finalMessage.content.find(
              (block) => block.type === "tool_use" && block.name === "save_checkin",
            );
            if (saveTool?.type === "tool_use") {
              const parsed = checkinSaveSchema.safeParse(saveTool.input);
              if (parsed.success) {
                await db`
                  insert into shravan.checkins (
                    elder_id, conversation_id, checkin_date, slept_well, ate_meals,
                    meals_note, mood_score, mobility_ok, pain_note, concerns, summary
                  )
                  values (
                    ${elder.id}, ${conversationId}, ${today},
                    ${parsed.data.slept_well}, ${parsed.data.ate_meals},
                    ${parsed.data.meals_note}, ${parsed.data.mood_score},
                    ${parsed.data.mobility_ok}, ${parsed.data.pain_note},
                    ${parsed.data.concerns}, ${parsed.data.summary}
                  )
                  on conflict (elder_id, checkin_date) do update
                  set conversation_id = excluded.conversation_id,
                      slept_well = coalesce(excluded.slept_well, shravan.checkins.slept_well),
                      ate_meals = coalesce(excluded.ate_meals, shravan.checkins.ate_meals),
                      meals_note = coalesce(excluded.meals_note, shravan.checkins.meals_note),
                      mood_score = coalesce(excluded.mood_score, shravan.checkins.mood_score),
                      mobility_ok = coalesce(excluded.mobility_ok, shravan.checkins.mobility_ok),
                      pain_note = coalesce(excluded.pain_note, shravan.checkins.pain_note),
                      concerns = coalesce(excluded.concerns, shravan.checkins.concerns),
                      summary = excluded.summary
                `;
                saved = true;
              }
            }

            const persistedText =
              assistantText ||
              (saved
                ? elder.language === "hi"
                  ? "धन्यवाद। आज की बात मैंने याद रख ली है।"
                  : "Thank you. I have saved today's check-in."
                : "");
            if (!assistantText && persistedText) {
              controller.enqueue(eventLine({ type: "delta", text: persistedText }));
            }
            if (persistedText) {
              await db`
                insert into shravan.messages (conversation_id, role, content)
                values (${conversationId}, 'assistant', ${persistedText})
              `;
            }
            await db`
              insert into shravan.token_usage (
                elder_id, usage_date, input_tokens, output_tokens
              )
              values (
                ${elder.id}, ${today},
                ${finalMessage.usage.input_tokens}, ${finalMessage.usage.output_tokens}
              )
              on conflict (elder_id, usage_date) do update
              set input_tokens = shravan.token_usage.input_tokens + excluded.input_tokens,
                  output_tokens = shravan.token_usage.output_tokens + excluded.output_tokens,
                  updated_at = now()
            `;
            controller.enqueue(eventLine({ type: "done", checkinSaved: saved }));
          } catch {
            console.error("Check-in stream failed; safe fallback used.", {
              elderId: elder.id,
              conversationId,
            });
            const fallback =
              elder.language === "hi"
                ? "माफ़ कीजिए, अभी बात रुक गई। थोड़ी देर बाद फिर कोशिश करें। ज़रूरत में अपने Guardian या 112 को फ़ोन करें।"
                : "I'm sorry, our chat paused. Please try again shortly. For urgent help, call your Guardian or 112.";
            if (!assistantText) controller.enqueue(eventLine({ type: "delta", text: fallback }));
            await db`
              insert into shravan.messages (conversation_id, role, content)
              values (${conversationId}, 'assistant', ${assistantText || fallback})
            `.catch(() => undefined);
            controller.enqueue(
              eventLine({ type: "error", message: fallback, partial: Boolean(assistantText) }),
            );
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          "content-type": "application/x-ndjson; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
        },
      },
    );
  } catch (error) {
    const status =
      error instanceof Error && error.message === "UNAUTHENTICATED_ELDER" ? 401 : 400;
    return Response.json({ error: "Unable to start chat" }, { status });
  }
}
