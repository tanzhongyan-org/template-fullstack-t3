import { db } from "~/server/db";
import { usageEvent } from "~/server/db/schema";

export interface UsageInput {
  feature: string;
  provider: string;
  units: number;
  costMinor: number;
  currency?: string;
}

/** Write one cost-ledger row per paid call. The budget cron reads these. */
export async function recordUsage(input: UsageInput): Promise<{ id: number }> {
  const [row] = await db
    .insert(usageEvent)
    .values({
      feature: input.feature,
      provider: input.provider,
      units: input.units,
      costMinor: input.costMinor,
      currency: input.currency ?? "USD",
    })
    .returning({ id: usageEvent.id });
  if (!row) throw new Error("Failed to record usage");
  return { id: row.id };
}
