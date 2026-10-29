import "~/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SiteFooter } from "~/shared/components/site-footer";
import { SiteHeader } from "~/shared/components/site-header";
import { ThemeProvider } from "~/shared/components/theme-provider";
import { Toaster } from "~/shared/components/ui/sonner";
import { VitalsReporter } from "~/shared/components/vitals-reporter";
import { site } from "~/shared/config/site";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: site.titleTemplate },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: site.locale,
    type: "website",
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <TRPCReactProvider>
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <Toaster />
            <VitalsReporter />
          </TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
