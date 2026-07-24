import "server-only";
import postgres, { type TransactionSql } from "postgres";
import { env } from "@/lib/env";

const globalForDatabase = globalThis as unknown as {
  shravanSql?: ReturnType<typeof postgres>;
};

export const db =
  globalForDatabase.shravanSql ??
  postgres(env.DATABASE_URL, {
    prepare: false,
    max: process.env.NODE_ENV === "development" ? 3 : 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.shravanSql = db;
}

export async function runAsUser<T>(
  userId: string,
  callback: (transaction: TransactionSql) => Promise<T>,
) {
  return db.begin(async (transaction) => {
    await transaction`
      select set_config(
        'request.jwt.claims',
        ${JSON.stringify({ sub: userId, role: "authenticated" })},
        true
      )
    `;
    await transaction.unsafe("set local role authenticated");
    return callback(transaction);
  });
}
