"use client";

import { Button } from "~/shared/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground">Reload the page to try again.</p>
          <Button onClick={() => reset()}>Try again</Button>
        </main>
      </body>
    </html>
  );
}
