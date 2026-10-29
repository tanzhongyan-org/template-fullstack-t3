import type { LegalSection } from "~/shared/config/site";
import { site } from "~/shared/config/site";

export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {intro} Effective {site.legal.effectiveDate}. Contact {site.legal.contactEmail}.
      </p>
      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-xl font-semibold">{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="mt-3 leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </main>
  );
}
