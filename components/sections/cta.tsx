import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="container py-20 md:py-28">
        <div className="rounded-3xl border border-ink/10 bg-white/70 p-10 backdrop-blur md:p-16">
          <p className="label">Get in touch</p>
          <h2 className="mt-4 max-w-3xl font-display text-3xl leading-tight text-ink md:text-5xl">
            Imagination Unlimited.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
            Hospitals piloting onboarding redesign, schools modernising NCLEX
            preparation, and patient-aligned investors are invited to request
            the full data room.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/signup" className="btn-primary">
              Request access
            </Link>
            <a
              href="mailto:Thomas@ateninc.com?subject=AIWIZN%20%E2%80%94%20Request%20the%20full%20investor%20data%20room"
              className="btn-secondary"
            >
              Request the investor data room
            </a>
            <Link href="/contact" className="btn-ghost text-ink-3 hover:text-ink">
              Contact us →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
