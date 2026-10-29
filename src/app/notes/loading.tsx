import { Skeleton } from "~/shared/components/ui/skeleton";

export default function NotesLoading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-4 py-12">
      <Skeleton className="h-9 w-32" />
      <div className="flex w-full max-w-md flex-col gap-3" role="status" aria-label="Loading notes">
        <Skeleton className="h-24 w-full" />
      </div>
    </main>
  );
}
