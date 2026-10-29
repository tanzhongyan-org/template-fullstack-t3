import type { Metadata } from "next";
import { Suspense } from "react";
import { Notes } from "~/features/notes";
import { Skeleton } from "~/shared/components/ui/skeleton";
import { site } from "~/shared/config/site";
import { api, HydrateClient } from "~/trpc/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Notes · ${site.name}`,
  description: "A signed-in demo: notes are scoped to the caller identity.",
  robots: { index: false, follow: false },
};

export default async function NotesPage() {
  void api.notes.list.prefetch().catch(() => undefined);

  return (
    <HydrateClient>
      <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
        <Suspense
          fallback={
            <div
              className="flex w-full max-w-md flex-col gap-3"
              role="status"
              aria-label="Loading notes"
            >
              <Skeleton className="h-24 w-full" />
            </div>
          }
        >
          <Notes />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
