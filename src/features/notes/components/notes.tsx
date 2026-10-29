"use client";

import { useState } from "react";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { Input } from "~/shared/components/ui/input";
import { Textarea } from "~/shared/components/ui/textarea";
import { api } from "~/trpc/react";

export function Notes() {
  const [notesList] = api.notes.list.useSuspenseQuery();
  const utils = api.useUtils();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const createNote = api.notes.create.useMutation({
    onSuccess: async () => {
      await utils.notes.invalidate();
      setTitle("");
      setBody("");
    },
  });

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notesList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notesList.map((note) => (
                <li key={note.id} className="rounded-lg bg-muted p-3">
                  <h3 className="font-semibold">{note.title}</h3>
                  {note.body ? <p className="text-sm text-muted-foreground">{note.body}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (title.trim()) {
            createNote.mutate({ title, body });
          }
        }}
        className="flex flex-col gap-2"
      >
        <Input
          type="text"
          placeholder="Note title (1-200 characters)"
          aria-label="Note title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          required
        />
        <Textarea
          placeholder="Note body (optional)"
          aria-label="Note body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <Button type="submit" disabled={createNote.isPending || !title.trim()}>
          {createNote.isPending ? "Creating..." : "Create Note"}
        </Button>
      </form>
    </div>
  );
}
