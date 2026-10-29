import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "~/features/waitlist";
import { buttonVariants } from "~/shared/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { site } from "~/shared/config/site";

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  alternates: { canonical: "/" },
};

const highlights = [
  {
    title: "Typed end to end",
    body: "Drizzle schemas flow through tRPC into React without a hand-written client.",
  },
  {
    title: "Gated by default",
    body: "Typecheck, lint, tests, dead code, duplication and policy run on every push.",
  },
  {
    title: "Branded in one place",
    body: "Titles, navigation, legal pages and colors all read the site config.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center gap-16 px-4 py-16">
      <section className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{site.name}</h1>
        <p className="text-lg text-muted-foreground">{site.tagline}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/examples" className={buttonVariants({ variant: "default" })}>
            See the example
          </Link>
          <Link href="/notes" className={buttonVariants({ variant: "outline" })}>
            Try the demo
          </Link>
        </div>
      </section>

      <section aria-label="Highlights" className="grid w-full gap-4 sm:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section aria-label="Waitlist" className="flex w-full justify-center">
        <WaitlistForm />
      </section>
    </main>
  );
}
