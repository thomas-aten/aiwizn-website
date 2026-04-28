import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the AIWIZN team.",
};

export default function ContactPage() {
  return (
    <section>
      <div className="container py-20 md:py-28">
        <p className="label">Contact</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.05] text-ink md:text-6xl">
          Let&apos;s talk.
        </h1>

        <div className="mt-14 grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-ink">Direct</h2>
            <ul className="mt-4 space-y-2 text-ink-2">
              <li className="font-mono text-sm">
                <a className="hover:text-ink" href="mailto:Thomas@ateninc.com">
                  Thomas@ateninc.com
                </a>
              </li>
              <li className="font-mono text-sm">
                <a className="hover:text-ink" href="tel:+19193418234">
                  +1 (919) 341-8234
                </a>
              </li>
            </ul>

            <h2 className="mt-12 font-display text-2xl text-ink">Audiences</h2>
            <ul className="mt-4 space-y-3 text-ink-2">
              <li>
                <span className="label mr-2">Hospitals</span>
                Pilot programmes, onboarding redesign, CNO conversations.
              </li>
              <li>
                <span className="label mr-2">Schools</span>
                Curriculum integration, NCLEX-NGN preparation, faculty tooling.
              </li>
              <li>
                <span className="label mr-2">Investors</span>
                Patient, mission-aligned capital. Request the data room.
              </li>
              <li>
                <span className="label mr-2">Clinicians</span>
                Advisory, scenario authorship, expert-pattern back-harvesting.
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </div>
    </section>
  );
}
