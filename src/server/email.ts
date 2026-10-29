/**
 * Transactional email over the Resend HTTP API. No SDK: one fetch call keeps
 * the dependency count at zero and the API portable.
 *
 * Without RESEND_API_KEY the mail prints to the console, but only in local
 * development (see dev-guard.ts). Anywhere else that is a boot-time error.
 */

import { devShortcutsEnabled } from "~/shared/config/dev-guard";
import { env } from "~/shared/config/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailResult =
  | { delivered: true; id: string }
  | { delivered: false; reason: "dev-console" };

export type EmailTransport = (message: EmailMessage) => Promise<EmailResult>;

let testTransport: EmailTransport | null = null;

/** Tests inject a fake transport; production code never calls this. */
export const __setEmailTransportForTests = (transport: EmailTransport | null): void => {
  testTransport = transport;
};

const resendTransport: EmailTransport = async (message) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Resend rejected the mail with status ${response.status}`);
  }
  const body = (await response.json()) as { id?: string };
  return { delivered: true, id: body.id ?? "unknown" };
};

export const sendEmail = async (message: EmailMessage): Promise<EmailResult> => {
  if (testTransport) return testTransport(message);
  if (env.RESEND_API_KEY) return resendTransport(message);
  if (!devShortcutsEnabled()) {
    throw new Error("RESEND_API_KEY is not set and console email runs in local development only.");
  }
  console.log(
    `[dev email] to=${message.to} subject=${message.subject}\n${message.text ?? message.html}`,
  );
  return { delivered: false, reason: "dev-console" };
};
