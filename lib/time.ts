export const IST_TIME_ZONE = "Asia/Kolkata";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: IST_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function istDate(now = new Date()) {
  return dateFormatter.format(now);
}

export function istHourMinute(now = new Date()) {
  const [hour, minute] = timeFormatter.format(now).split(":").map(Number);
  return { hour, minute };
}

export function startOfIstWeek(now = new Date()) {
  const date = new Date(`${istDate(now)}T12:00:00+05:30`);
  const weekday = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - weekday + 1);
  return date.toISOString().slice(0, 10);
}

export function formatRelativeActivity(value: string | Date | null) {
  if (!value) return "No activity yet";
  const date = typeof value === "string" ? new Date(value) : value;
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000));
  if (minutes < 2) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1_440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1_440)} days ago`;
}

