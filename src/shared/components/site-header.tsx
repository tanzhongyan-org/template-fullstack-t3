import Link from "next/link";
import { site } from "~/shared/config/site";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          {site.name}
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          <NavLinks items={site.nav.primary} />
        </div>
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-5xl px-4 pb-2 md:hidden">
        <NavLinks items={site.nav.primary} />
      </div>
    </header>
  );
}
