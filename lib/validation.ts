import { z } from "zod";

export const languageSchema = z.enum(["hi", "en"]);
export const medicationSlotSchema = z.enum([
  "morning",
  "afternoon",
  "evening",
  "night",
]);

export const createElderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  nickname: z.string().trim().min(1).max(50).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  language: languageSchema.default("hi"),
  interests: z.string().trim().max(240).optional().or(z.literal("")),
});

export const medicationSchema = z.object({
  elderId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  dosage: z.string().trim().max(80).optional().or(z.literal("")),
  slot: medicationSlotSchema,
  notes: z.string().trim().max(240).optional().or(z.literal("")),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(4_000),
  kind: z.enum(["checkin", "free_chat"]).default("checkin"),
});

export const scamRequestSchema = z.object({
  message: z.string().trim().min(3).max(6_000),
});

export const scamResultSchema = z.object({
  risk: z.enum(["LOW", "SUSPICIOUS", "HIGH"]),
  explanation_hi: z.string().min(1).max(1_000),
  explanation_en: z.string().min(1).max(1_000),
  action: z.string().min(1).max(1_000),
});

export const checkinSaveSchema = z.object({
  slept_well: z.boolean().nullable(),
  ate_meals: z.boolean().nullable(),
  meals_note: z.string().max(500).nullable(),
  mood_score: z.number().int().min(1).max(5).nullable(),
  mobility_ok: z.boolean().nullable(),
  pain_note: z.string().max(500).nullable(),
  concerns: z.string().max(1_000).nullable(),
  summary: z.string().min(1).max(500),
});

