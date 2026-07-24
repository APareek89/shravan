import "server-only";
import { env } from "@/lib/env";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

export async function sendGuardianAlertEmail({
  to,
  elderName,
  subject,
  detail,
}: {
  to: string | null;
  elderName: string;
  subject: string;
  detail: string;
}) {
  if (!env.RESEND_API_KEY || !to) return { sent: false, reason: "not_configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>${escapeHtml(subject)}</h2><p><strong>${escapeHtml(elderName)}</strong></p><p>${escapeHtml(detail)}</p><p>Open Shravan for the full context.</p></div>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error("Guardian email provider returned a non-success status.", {
        status: response.status,
      });
    }
    return { sent: response.ok, reason: response.ok ? "sent" : "provider_error" };
  } catch {
    console.error("Guardian email delivery failed or timed out.");
    return { sent: false, reason: "provider_error" };
  }
}
