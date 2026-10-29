"use client";

import { api } from "~/trpc/react";
import { ExampleForm } from "./example-form";
import { ExampleList } from "./example-list";

/**
 * Wired manager for the /examples page. Loading and error states come from the
 * route loading.tsx and error.tsx; the list covers empty and ready.
 */
export function ExampleManager() {
  const [items] = api.example.list.useSuspenseQuery();

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <ExampleList items={items} />
      <ExampleForm />
    </div>
  );
}
