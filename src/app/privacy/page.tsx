import type { Metadata } from "next";
import { LegalPage } from "~/shared/components/legal-page";
import { site } from "~/shared/config/site";

export const metadata: Metadata = {
  title: `Privacy · ${site.name}`,
  description: `How ${site.name} collects, uses, and deletes your data.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`${site.legal.company} runs ${site.name}.`}
      sections={site.legal.privacy}
    />
  );
}
