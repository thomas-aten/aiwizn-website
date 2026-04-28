import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

export default function NotFound() {
  return (
    <main className="container flex min-h-[calc(100vh-3px)] flex-col items-center justify-center text-center">
      <Wordmark href="/" />
      <p className="label mt-10">404</p>
      <h1 className="mt-2 font-display text-4xl text-ink md:text-6xl">
        That page is off the floor plan.
      </h1>
      <p className="mt-4 max-w-prose text-ink-2">
        The route you requested does not exist on aiwizn.com. Head back to the
        wisdom engine.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Return home
      </Link>
    </main>
  );
}
