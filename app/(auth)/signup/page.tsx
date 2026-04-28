import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Request access",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
