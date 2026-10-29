import { site } from "~/shared/config/site";

const expires = new Date("2027-10-29T00:00:00.000Z").toISOString();

/** Disclosure policy for security researchers (RFC 9116). */
export async function GET() {
  const body = [
    `Contact: mailto:${site.legal.supportEmail}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
  ].join("\n");
  return new Response(`${body}\n`, { headers: { "Content-Type": "text/plain" } });
}
