import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Mono, Outfit } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.aiwizn.com"),
  title: {
    default: "AIWIZN — The Wisdom of Expert Nurses, Captured. Scaled. Deployed.",
    template: "%s · AIWIZN",
  },
  description:
    "AIWIZN is an AI-driven nursing education and competency mastery platform that replaces outdated onboarding with immersive, scenario-driven learning — measurably reducing clinical errors, turnover, and time-to-competency across a nurse's entire career lifecycle.",
  applicationName: "AIWIZN",
  keywords: [
    "nursing education",
    "clinical simulation",
    "competency mastery",
    "nurse onboarding",
    "healthcare AI",
    "psychometrics",
    "clinical judgement",
  ],
  authors: [{ name: "Aten Inc.", url: "https://www.aiwizn.com" }],
  openGraph: {
    title: "AIWIZN — Imagination Unlimited",
    description:
      "AI-driven nursing education and competency mastery. Replaces outdated onboarding with immersive, scenario-driven learning.",
    url: "https://www.aiwizn.com",
    siteName: "AIWIZN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AIWIZN — Imagination Unlimited",
    description:
      "AI-driven nursing education and competency mastery, captured from expert nurses and scaled across the workforce.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>
        <div className="brand-rule" aria-hidden />
        {children}
      </body>
    </html>
  );
}
