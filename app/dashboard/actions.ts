"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireGuardianSession } from "@/lib/auth/session";
import { runAsUser } from "@/lib/db";
import {
  createElderSchema,
  medicationSchema,
} from "@/lib/validation";

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createElderAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const parsed = createElderSchema.parse({
    name: text(formData, "name"),
    nickname: text(formData, "nickname"),
    city: text(formData, "city"),
    language: text(formData, "language"),
    interests: text(formData, "interests"),
  });
  const inviteToken = crypto.randomBytes(18).toString("base64url");
  const [elder] = await runAsUser(guardian.id, (transaction) =>
    transaction<{ id: string }[]>`
      insert into shravan.elders (
        guardian_id, name, nickname, city, language, interests,
        invite_token, invite_expires_at
      )
      values (
        ${guardian.id}, ${parsed.name}, ${parsed.nickname || null},
        ${parsed.city || null}, ${parsed.language},
        ${parsed.interests
          ? parsed.interests.split(",").map((item) => item.trim()).filter(Boolean)
          : []},
        ${inviteToken}, now() + interval '30 days'
      )
      returning id
    `,
  );
  revalidatePath("/dashboard");
  redirect(`/dashboard/elder/${elder.id}`);
}

export async function updateElderAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const elderId = text(formData, "elderId");
  const parsed = createElderSchema.parse({
    name: text(formData, "name"),
    nickname: text(formData, "nickname"),
    city: text(formData, "city"),
    language: text(formData, "language"),
    interests: text(formData, "interests"),
  });
  await runAsUser(guardian.id, (transaction) =>
    transaction`
      update shravan.elders
      set name = ${parsed.name},
          nickname = ${parsed.nickname || null},
          city = ${parsed.city || null},
          language = ${parsed.language},
          interests = ${parsed.interests
            ? parsed.interests.split(",").map((item) => item.trim()).filter(Boolean)
            : []}
      where id = ${elderId} and guardian_id = ${guardian.id}
    `,
  );
  revalidatePath(`/dashboard/elder/${elderId}`);
  revalidatePath("/dashboard");
}

export async function saveMedicationAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const medicationId = text(formData, "medicationId");
  const parsed = medicationSchema.parse({
    elderId: text(formData, "elderId"),
    name: text(formData, "name"),
    dosage: text(formData, "dosage"),
    slot: text(formData, "slot"),
    notes: text(formData, "notes"),
  });

  await runAsUser(guardian.id, async (transaction) => {
    const [owned] = await transaction`
      select id from shravan.elders
      where id = ${parsed.elderId} and guardian_id = ${guardian.id}
    `;
    if (!owned) throw new Error("ELDER_NOT_FOUND");

    if (medicationId) {
      await transaction`
        update shravan.medications
        set name = ${parsed.name}, dosage = ${parsed.dosage || null},
            slot = ${parsed.slot}, notes = ${parsed.notes || null}, active = true
        where id = ${medicationId} and elder_id = ${parsed.elderId}
      `;
    } else {
      await transaction`
        insert into shravan.medications (elder_id, name, dosage, slot, notes)
        values (
          ${parsed.elderId}, ${parsed.name}, ${parsed.dosage || null},
          ${parsed.slot}, ${parsed.notes || null}
        )
      `;
    }
  });
  revalidatePath(`/dashboard/elder/${parsed.elderId}`);
  revalidatePath("/dashboard");
}

export async function deactivateMedicationAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const elderId = text(formData, "elderId");
  const medicationId = text(formData, "medicationId");
  await runAsUser(guardian.id, (transaction) =>
    transaction`
      update shravan.medications m
      set active = false
      from shravan.elders e
      where m.id = ${medicationId}
        and m.elder_id = ${elderId}
        and e.id = m.elder_id
        and e.guardian_id = ${guardian.id}
    `,
  );
  revalidatePath(`/dashboard/elder/${elderId}`);
  revalidatePath("/dashboard");
}

export async function regenerateInviteAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const elderId = text(formData, "elderId");
  const inviteToken = crypto.randomBytes(18).toString("base64url");
  await runAsUser(guardian.id, (transaction) =>
    transaction`
      update shravan.elders
      set invite_token = ${inviteToken}, invite_expires_at = now() + interval '30 days'
      where id = ${elderId} and guardian_id = ${guardian.id}
    `,
  );
  revalidatePath(`/dashboard/elder/${elderId}`);
}

export async function acknowledgeAlertAction(formData: FormData) {
  const guardian = await requireGuardianSession();
  const alertId = text(formData, "alertId");
  await runAsUser(guardian.id, (transaction) =>
    transaction`
      update shravan.alerts a
      set acknowledged = true
      from shravan.elders e
      where a.id = ${alertId}
        and e.id = a.elder_id
        and e.guardian_id = ${guardian.id}
    `,
  );
  revalidatePath("/dashboard");
}

