import type { MetadataRoute } from "next";
import { site } from "~/shared/config/site";

/** Every public marketing/legal route; authenticated app routes stay out of the sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["/", "/privacy", "/terms", "/refund"];
  return pages.map((page) => ({
    url: `${site.url}${page === "/" ? "" : page}`,
    lastModified: new Date(site.legal.effectiveDate),
  }));
}
