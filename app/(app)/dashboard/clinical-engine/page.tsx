import { redirect } from "next/navigation";

// The Clinical Engine moved to /dashboard/engines/clinical (paywalled bundle).
// This shim redirects anyone still hitting the old URL.
export default function MovedClinicalEnginePage() {
  redirect("/dashboard/engines/clinical");
}
