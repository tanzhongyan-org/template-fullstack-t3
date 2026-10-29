import type { MetadataRoute } from "next";
import { site } from "~/shared/config/site";

/** Every public route, and no app routes. Derived repos list EXPERIENCE.md public routes. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/privacy", "/terms", "/refund"];
  return pages.map((page) => ({
    url: `${site.url}${page === "/" ? "" : page}`,
    lastModified: new Date(site.legal.effectiveDate),
  }));
}
