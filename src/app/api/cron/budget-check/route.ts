import { and, eq, gte, sql } from "drizzle-orm";
import { cronAuthorized, unauthorized } from "~/server/cron";
import { db } from "~/server/db";
import { budget, usageEvent } from "~/server/db/schema";
import { sendEmail } from "~/server/email";
import { logRequest, requestIdFrom } from "~/server/log";
import { site } from "~/shared/config/site";

/**
 * Daily spend guard. Compares this month's usage_event cost against each
 * budget row and emails the owner once at 80% and once at 100%.
 */
export async function GET(request: Request) {
  const requestId = requestIdFrom(request.headers);
  if (!cronAuthorized(request)) return unauthorized();

  const now = new Date();
  const period = now.toISOString().slice(0, 7);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const notified: Array<{ provider: string; level: 80 | 100 }> = [];

  const rows = await db.select().from(budget);
  for (const row of rows) {
    const effective =
      row.period === period ? row : { ...row, alert80Sent: false, alert100Sent: false };
    if (row.period !== period) {
      await db
        .update(budget)
        .set({ period, alert80Sent: false, alert100Sent: false })
        .where(eq(budget.id, row.id));
    }
    const [spend] = await db
      .select({ total: sql<number>`coalesce(sum(${usageEvent.costMinor}), 0)` })
      .from(usageEvent)
      .where(and(eq(usageEvent.provider, row.provider), gte(usageEvent.createdAt, monthStart)));
    const total = Number(spend?.total ?? 0);
    const percent = row.monthlyLimitMinor > 0 ? (total / row.monthlyLimitMinor) * 100 : 0;

    const level = percent >= 100 ? 100 : percent >= 80 ? 80 : null;
    const alreadySent = level === 100 ? effective.alert100Sent : effective.alert80Sent;
    if (level !== null && !alreadySent) {
      await sendEmail({
        to: site.ownerEmail,
        subject: `Budget alert: ${row.provider} hit ${level}%`,
        html: `<p>${row.provider} spent ${(total / 100).toFixed(2)} ${row.currency} of the ${(row.monthlyLimitMinor / 100).toFixed(2)} budget for ${period}.</p>`,
      });
      await db
        .update(budget)
        .set(level === 100 ? { alert80Sent: true, alert100Sent: true } : { alert80Sent: true })
        .where(eq(budget.id, row.id));
      notified.push({ provider: row.provider, level });
    }
  }

  logRequest({ requestId, event: "cron-budget", status: 200 });
  return Response.json({ checked: rows.length, notified });
}
