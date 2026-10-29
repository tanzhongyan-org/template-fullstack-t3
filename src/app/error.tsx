"use client";

import { Button } from "~/shared/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const needsSignIn =
    error.message.includes("UNAUTHORIZED") || error.message === "Authentication required";
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {needsSignIn ? "Sign in to view your notes." : "Reload the page to try again."}
      </p>
      {needsSignIn ? null : <Button onClick={() => reset()}>Try again</Button>}
    </main>
  );
}
