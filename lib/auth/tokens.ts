import "server-only";
import crypto from "node:crypto";
import { env } from "@/lib/env";

export type SessionKind = "guardian" | "elder";

type SignedSession = {
  sub: string;
  kind: SessionKind;
  exp: number;
};

function sign(encodedPayload: string) {
  return crypto
    .createHmac("sha256", env.DEMO_SESSION_SECRET)
    .update(encodedPayload)
    .digest("base64url");
}

export function createSignedSession(
  subject: string,
  kind: SessionKind,
  maxAgeSeconds: number,
) {
  const payload: SignedSession = {
    sub: subject,
    kind,
    exp: Math.floor(Date.now() / 1_000) + maxAgeSeconds,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySignedSession(
  token: string | undefined,
  expectedKind: SessionKind,
) {
  if (!token) return null;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as SignedSession;
    if (
      payload.kind !== expectedKind ||
      payload.exp <= Math.floor(Date.now() / 1_000) ||
      !payload.sub
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

