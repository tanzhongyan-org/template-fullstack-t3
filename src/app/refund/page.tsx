import type { Metadata } from "next";
import { LegalPage } from "~/shared/components/legal-page";
import { site } from "~/shared/config/site";

export const metadata: Metadata = {
  title: `Refunds · ${site.name}`,
  description: `The refund policy for ${site.name} subscriptions.`,
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro={`${site.legal.company} runs ${site.name}.`}
      sections={site.legal.refund}
    />
  );
}
