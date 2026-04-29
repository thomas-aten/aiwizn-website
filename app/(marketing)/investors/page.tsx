import type { Metadata } from "next";
import { redirect } from "next/navigation";

// The investor brief moved to a private, share-by-link path.
// This shim redirects anyone hitting the old public URL to the home page.

export const metadata: Metadata = {
  title: "Moved",
  robots: { index: false, follow: false },
};

export default function MovedInvestorsPage() {
  redirect("/");
}
