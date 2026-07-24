const job = process.argv[2];
if (!["escalations", "digest"].includes(job)) {
  throw new Error("Usage: node scripts/call-cron.mjs <escalations|digest>");
}
const appUrl =
  process.env.APP_URL ??
  (process.env.APP_HOST ? `http://${process.env.APP_HOST}` : undefined);
const secret = process.env.CRON_SECRET;
if (!appUrl || !secret) {
  throw new Error("APP_URL or APP_HOST, plus CRON_SECRET, are required");
}

const response = await fetch(`${appUrl.replace(/\/$/, "")}/api/cron/${job}`, {
  headers: { authorization: `Bearer ${secret}` },
});
const text = await response.text();
console.log(text);
if (!response.ok) process.exitCode = 1;
