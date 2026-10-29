import type { Metadata } from "next";
import { Suspense } from "react";
import { ExampleManager } from "~/features/_example";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { site } from "~/shared/config/site";
import { api, HydrateClient } from "~/trpc/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Examples · ${site.name}`,
  description: "The gate-clean example slice: list, form, and every state.",
  alternates: { canonical: "/examples" },
};

export default async function ExamplesPage() {
  void api.example.list.prefetch().catch(() => undefined);

  return (
    <HydrateClient>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Examples</h1>
        <Suspense
          fallback={
            <div
              className="flex w-full max-w-md flex-col gap-3"
              role="status"
              aria-label="Loading examples"
            >
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          }
        >
          <ExampleManager />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
