import Link from "next/link";
import type * as React from "react";
import { site } from "~/shared/config/site";

export function SiteFooter({ action }: { action?: React.ReactNode }) {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {site.legal.company} · {site.legal.contactEmail}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            {site.nav.footer.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {action}
        </div>
      </div>
    </footer>
  );
}
