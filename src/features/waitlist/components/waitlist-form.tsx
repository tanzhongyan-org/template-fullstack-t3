"use client";

import { track } from "@repo/shared/analytics";
import Script from "next/script";
import { useState } from "react";
import { Button } from "~/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/components/ui/card";
import { Input } from "~/shared/components/ui/input";
import { api } from "~/trpc/react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState<string | undefined>(undefined);
  const join = api.waitlist.join.useMutation({
    onSuccess: () => {
      setEmail("");
      void track({ event: "waitlist_joined" });
    },
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Get early access</CardTitle>
        <CardDescription>Join the waitlist and we will email you at launch.</CardDescription>
      </CardHeader>
      <CardContent>
        {join.isSuccess ? (
          <p role="status" className="text-sm">
            You are #{join.data.position} on the list. Check your inbox soon.
          </p>
        ) : (
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (email.trim()) join.mutate({ email, turnstileToken: token });
            }}
          >
            <Input
              type="email"
              required
              maxLength={320}
              placeholder="you@example.com"
              aria-label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {siteKey ? (
              <>
                <Script
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                  strategy="lazyOnload"
                  onLoad={() => {
                    window.turnstile?.render("#turnstile-widget", {
                      sitekey: siteKey,
                      callback: (value: string) => setToken(value),
                    });
                  }}
                />
                <div id="turnstile-widget" />
              </>
            ) : null}
            {join.isError ? (
              <p role="alert" className="text-sm text-error">
                {join.error.message}
              </p>
            ) : null}
            <Button type="submit" disabled={join.isPending || !email.trim()}>
              {join.isPending ? "Joining..." : "Join the waitlist"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
