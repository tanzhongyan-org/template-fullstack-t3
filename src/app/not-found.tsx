import Link from "next/link";
import { buttonVariants } from "~/shared/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">That address does not exist or moved.</p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Back home
      </Link>
    </main>
  );
}
