"use client";

import { track } from "@repo/shared/analytics";
import { MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/shared/components/ui/dialog";
import { Label } from "~/shared/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "~/shared/components/ui/tabs";
import { Textarea } from "~/shared/components/ui/textarea";
import { api } from "~/trpc/react";

type FeedbackKind = "idea" | "bug" | "praise";

/** Accessible in-app feedback trigger and modal backed by `feedback.submit`. */
export function FeedbackDialog() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [body, setBody] = useState("");

  const submit = api.feedback.submit.useMutation({
    onSuccess: () => {
      void track({ event: "feedback_submitted", properties: { kind } });
      setBody("");
      setOpen(false);
      toast.success("Thanks for your feedback");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <MessageSquarePlus className="mr-1.5 size-4" />
        Feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Share a bug, idea, or note about this page ({pathname}).
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            submit.mutate({ kind, body: body.trim(), page: pathname });
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Tabs
              value={kind}
              onValueChange={(value) => {
                if (value === "idea" || value === "bug" || value === "praise") {
                  setKind(value);
                }
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="idea">Idea</TabsTrigger>
                <TabsTrigger value="bug">Bug</TabsTrigger>
                <TabsTrigger value="praise">Praise</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-body">Message</Label>
            <Textarea
              id="feedback-body"
              required
              maxLength={2000}
              placeholder="What worked well or felt confusing?"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-describedby={submit.isError ? "feedback-error" : undefined}
            />
          </div>
          {submit.isError ? (
            <p id="feedback-error" role="alert" className="text-sm text-error">
              {submit.error.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={submit.isPending || !body.trim()}>
              {submit.isPending ? "Sending..." : "Submit feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
