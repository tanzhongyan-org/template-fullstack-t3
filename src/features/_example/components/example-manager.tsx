"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { ExampleForm } from "./example-form";
import { ExampleList } from "./example-list";

/**
 * Wired manager for the /examples page. Loading and error states come from the
 * route loading.tsx and error.tsx; the list covers empty and ready.
 */
export function ExampleManager() {
  const trpc = useTRPC();
  const { data: items } = useSuspenseQuery(trpc.example.list.queryOptions());

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <ExampleList items={items} />
      <ExampleForm />
    </div>
  );
}
