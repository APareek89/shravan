import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  CHECKIN_MODEL: z.string().default("claude-sonnet-4-6"),
  UTILITY_MODEL: z.string().default("claude-haiku-4-5-20251001"),
  DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(12_000),
  DAILY_SCAM_MODEL_LIMIT: z.coerce.number().int().positive().default(20),
  ENABLE_PUBLIC_DEMO: z
    .enum(["true", "false"])
    .default(process.env.NODE_ENV === "production" ? "false" : "true")
    .transform((value) => value === "true"),
  CRON_SECRET: z.string().min(24),
  DEMO_SESSION_SECRET: z.string().min(24),
  APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().default("Shravan <care@shravan.app>"),
});

export const env = schema.parse(process.env);

export function hasSupabaseAuthConfig() {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}
