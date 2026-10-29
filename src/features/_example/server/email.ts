import type { EmailMessage } from "~/server/email";

/** Owner notification for a new example; the router sends it on create. */
export const exampleCreatedEmail = (title: string, ownerId: string): Omit<EmailMessage, "to"> => ({
  subject: `New example: ${title}`,
  html: `<p>${ownerId} created the example "${title}".</p>`,
  text: `${ownerId} created the example "${title}".`,
});
