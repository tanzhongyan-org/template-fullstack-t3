/**
 * Site config: the single source for metadata, titles, navigation and legal
 * pages. Every brand slot carries a TEMPLATE-BRAND marker; `make brand-check`
 * reports them and verifies the wiring into `src/app/layout.tsx`.
 */

export interface NavLink {
  label: string;
  href: string;
}

export interface LegalSection {
  heading: string;
  body: string[];
}

export const site = {
  // TEMPLATE-BRAND(name): replace with the product name from DESIGN.md.
  name: "Example",
  // TEMPLATE-BRAND(tagline): one line under the name on the landing page.
  tagline: "Ship a typed product in days, not weeks.",
  // TEMPLATE-BRAND(description): the meta description for every public page.
  description: "Example is a typed starter for products: Next.js, tRPC, Drizzle and shadcn/ui.",
  // TEMPLATE-BRAND(url): the canonical production URL, without a trailing slash.
  url: "https://example.com",
  locale: "en_SG",
  /** Next.js metadata title template; page titles pass through this. */
  titleTemplate: "%s · Example",
  nav: {
    primary: [
      { label: "Examples", href: "/examples" },
      { label: "Notes", href: "/notes" },
      { label: "Pricing", href: "/#pricing" },
    ] satisfies NavLink[],
    footer: [
      { label: "Examples", href: "/examples" },
      { label: "Notes", href: "/notes" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refund" },
    ] satisfies NavLink[],
  },
  legal: {
    // TEMPLATE-BRAND(legal): the registered company behind the product.
    company: "Example Pte. Ltd.",
    // TEMPLATE-BRAND(contact): the address users write to about their data.
    contactEmail: "privacy@example.com",
    supportEmail: "support@example.com",
    effectiveDate: "2026-10-29",
    privacy: [
      {
        heading: "What we collect",
        body: [
          "We collect the account data you give us (name, email), the content you create, and service data we need to run the product (logs, error reports, usage counts).",
          "Analytics runs on PostHog with autocapture off; only the events in packages/shared/analytics.ts are recorded.",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "We use your data to run your account, send transactional email, prevent abuse, and measure whether the product works.",
          "We disclose Google user data use here for OAuth verification: Sign in with Google shares your name, email address and profile picture so we can create your account. We do not share it with any other party.",
        ],
      },
      {
        heading: "Sub-processors",
        body: [
          "Hosting, database, email, analytics and error tracking run on the vendors in docs/dependencies.md. Each sees only the data its job needs.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can export your data as JSON and delete your account from Settings. Billing records stay for tax. Write to the contact address above for anything else.",
        ],
      },
    ] satisfies LegalSection[],
    terms: [
      {
        heading: "The service",
        body: [
          "We provide the product as-is and keep your data available under the backup policy in RUNBOOK.md.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Do not abuse the service, probe other tenants, or send spam through it. We may suspend accounts that do.",
        ],
      },
    ] satisfies LegalSection[],
    refund: [
      {
        heading: "Refund policy",
        body: [
          "Subscriptions renew each billing period and can be cancelled in the billing portal; cancellation stops the next charge.",
          "We refund the current period when you write to support within 14 days of the charge.",
        ],
      },
    ] satisfies LegalSection[],
  },
  // TEMPLATE-BRAND(owner): the owner address for budget alerts and the digest.
  ownerEmail: "owner@example.com",
  metrics: {
    /** Kill date from EXPERIENCE.md ## Brief; the digest counts down to it. */
    killDate: null as string | null,
  },
};

export type Site = typeof site;
