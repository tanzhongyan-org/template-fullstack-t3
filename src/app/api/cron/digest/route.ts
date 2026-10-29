import { count, gte, sql } from "drizzle-orm";
import { cronAuthorized, unauthorized } from "~/server/cron";
import { db } from "~/server/db";
import { feedback, usageEvent, waitlist } from "~/server/db/schema";
import { sendEmail } from "~/server/email";
import { logRequest, requestIdFrom } from "~/server/log";
import { site } from "~/shared/config/site";

/** Weekly owner digest: growth, spend, feedback, and days left to the kill date. */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  if (!cronAuthorized(request)) return unauthorized();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [joins] = await db
    .select({ value: count() })
    .from(waitlist)
    .where(gte(waitlist.createdAt, weekAgo));
  const [notes] = await db
    .select({ value: count() })
    .from(feedback)
    .where(gte(feedback.createdAt, weekAgo));
  const spend = await db
    .select({
      provider: usageEvent.provider,
      total: sql<number>`coalesce(sum(${usageEvent.costMinor}), 0)`,
    })
    .from(usageEvent)
    .where(gte(usageEvent.createdAt, weekAgo))
    .groupBy(usageEvent.provider);

  const killLine = site.metrics.killDate
    ? `${Math.max(0, Math.ceil((new Date(site.metrics.killDate).getTime() - Date.now()) / 86_400_000))} days left to the kill date (${site.metrics.killDate}).`
    : "No kill date is set; add one to EXPERIENCE.md ## Brief.";
  const spendLine =
    spend.length === 0
      ? "No paid usage."
      : spend.map((s) => `${s.provider}: ${(Number(s.total) / 100).toFixed(2)}`).join(", ");

  await sendEmail({
    to: site.ownerEmail,
    subject: `Weekly digest · ${site.name}`,
    html: `<p>Waitlist joins: ${joins?.value ?? 0}. Feedback: ${notes?.value ?? 0}. Spend: ${spendLine}. ${killLine}</p>`,
  });

  logRequest({ requestId, event: "cron-digest", status: 200 });
  return Response.json({
    waitlistJoins: joins?.value ?? 0,
    feedback: notes?.value ?? 0,
    spend,
    killDate: site.metrics.killDate,
  });
}
