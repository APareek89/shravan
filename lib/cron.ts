import "server-only";
import { env } from "@/lib/env";

export function isAuthorizedCron(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${env.CRON_SECRET}`;
}

