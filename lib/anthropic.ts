import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

const globalForAnthropic = globalThis as unknown as {
  shravanAnthropic?: Anthropic;
};

export const anthropic =
  globalForAnthropic.shravanAnthropic ??
  new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    timeout: 25_000,
    maxRetries: 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.shravanAnthropic = anthropic;
}

