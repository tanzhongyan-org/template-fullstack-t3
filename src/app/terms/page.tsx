import type { Metadata } from "next";
import { LegalPage } from "~/shared/components/legal-page";
import { site } from "~/shared/config/site";

export const metadata: Metadata = {
  title: `Terms · ${site.name}`,
  description: `The terms for using ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro={`${site.legal.company} runs ${site.name}.`}
      sections={site.legal.terms}
    />
  );
}
