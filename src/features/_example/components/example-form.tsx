"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { useTRPC } from "~/trpc/react";

export function ExampleForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const create = useMutation(
    trpc.example.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.example.pathFilter());
        setTitle("");
        setBody("");
      },
    }),
  );

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim()) create.mutate({ title, body });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="example-title">Title</Label>
        <Input
          id="example-title"
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-describedby={create.isError ? "example-error" : undefined}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="example-body">Body</Label>
        <Textarea
          id="example-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      {create.isError ? (
        <p id="example-error" role="alert" className="text-sm text-error">
          {create.error.message}
        </p>
      ) : null}
      <Button type="submit" disabled={create.isPending || !title.trim()}>
        {create.isPending ? "Creating..." : "Create example"}
      </Button>
    </form>
  );
}
