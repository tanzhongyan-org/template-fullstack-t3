"use client";

import { track } from "@repo/shared/analytics";
import { useMutation } from "@tanstack/react-query";
import { MessageSquarePlus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
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
import { Textarea } from "~/shared/components/ui/textarea";
import { useTRPC } from "~/trpc/react";

type FeedbackKind = "idea" | "bug" | "praise";

const FEEDBACK_OPTIONS: ReadonlyArray<{ value: FeedbackKind; label: string }> = [
  { value: "idea", label: "Idea" },
  { value: "bug", label: "Bug" },
  { value: "praise", label: "Praise" },
];

function formatFeedbackError(error: { data?: { code?: string } | null }): string {
  switch (error.data?.code) {
    case "UNAUTHORIZED":
      return "Sign in first to send feedback, then try submitting again.";
    case "TOO_MANY_REQUESTS":
      return "You have sent several feedback notes recently. Wait a minute and try again.";
    case "BAD_REQUEST":
      return "Check that your message is between 1 and 2000 characters and try again.";
    default:
      return "We could not save your feedback right now. Please try again in a moment.";
  }
}

/** Accessible in-app feedback trigger and modal backed by `feedback.submit`. */
export function FeedbackDialog() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("idea");
  const [body, setBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trpc = useTRPC();
  const submit = useMutation(
    trpc.feedback.submit.mutationOptions({
      onSuccess: () => {
        void track({ event: "feedback_submitted", properties: { kind } });
        setBody("");
        setOpen(false);
        toast.success("Thanks for your feedback");
      },
      onError: () => {
        textareaRef.current?.focus();
      },
    }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        submit.reset();
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <MessageSquarePlus className="mr-1.5 size-4" />
        Feedback
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Share a bug, idea, or note about this page ({pathname}). Requires a signed-in account.
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
          <fieldset className="flex flex-col gap-1.5 border-0 p-0">
            <legend className="text-sm leading-none font-medium">Category</legend>
            <div className="grid grid-cols-3 gap-2">
              {FEEDBACK_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  aria-pressed={kind === option.value}
                  variant={kind === option.value ? "default" : "outline"}
                  size="default"
                  onClick={() => setKind(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="feedback-body">Message</Label>
            <Textarea
              ref={textareaRef}
              id="feedback-body"
              required
              maxLength={2000}
              placeholder="What worked well or felt confusing?"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-invalid={submit.isError}
              aria-describedby={submit.isError ? "feedback-error" : undefined}
            />
          </div>
          {submit.isError ? (
            <p id="feedback-error" role="alert" className="text-sm text-error">
              {formatFeedbackError(submit.error)}
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
