"use client";

import { useMemo, useState } from "react";
import { defaultProtocolConfig, type ProtocolConfigV11 } from "@/lib/protocolConfig";

/**
 * /demo/new builder — client-interactive child of the gated server page.
 *
 * Paul (Pinnacle Mx Group, channel partner) enters a hospital name, accent
 * color, and the contact he's reaching out to, and gets back BOTH a branded
 * clinical-engine link AND a copy-pasteable draft intro email.
 *
 * Link generation mirrors `buildClinicalEngineLink()` in
 * `lib/demoTenantLinks.ts` exactly — same engine origin, same
 * `#config=<base64(JSON)>` hash mechanism. We can't import that helper here
 * because it relies on Node's `Buffer`; instead we replicate the encoding
 * with a UTF-8-safe `btoa` that produces byte-identical output to
 * `Buffer.from(json, "utf8").toString("base64")`. The config object itself
 * is built from `defaultProtocolConfig()` (a pure, client-safe function), so
 * the schema stays single-sourced.
 *
 * Additive + read-only: no Supabase writes, no new persistence. The link is
 * computed in the browser from the form inputs.
 */

const CLINICAL_ENGINE_URL = "https://demo.aiwizn.com/";

// Tenants that already have a short, shareable directory link in the engine
// repo. If Paul's slug matches one of these we surface the short URL; for
// everything else he gets the on-the-fly long `#config=` URL (he can request
// a short slug from Thomas later). Keyed by the slug a user would type.
const PROVISIONED_SHORT_LINKS: Record<string, string> = {
  unc: "https://demo.aiwizn.com/unc",
  duke: "https://demo.aiwizn.com/duke",
  allegheny: "https://demo.aiwizn.com/allegheny",
  ahn: "https://demo.aiwizn.com/allegheny",
};

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const DEFAULT_ACCENT = "#002F6C";

const EMAIL_SUBJECT = "AIWIZN — a 15-minute look, would value your read";

/** UTF-8-safe base64 — matches Buffer.from(s,"utf8").toString("base64"). */
function encodeConfigHash(config: ProtocolConfigV11): string {
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildEmailBody(opts: {
  contact: string;
  hospital: string;
  link: string;
  sender: string;
}): string {
  const contact = opts.contact.trim() || "there";
  const hospital = opts.hospital.trim() || "your hospital";
  const sender = opts.sender.trim() || "Paul";
  const link = opts.link;
  return `Hi ${contact},

Wanted to put a fast 15-minute look in front of you. AIWIZN is an
AI-driven clinical decision engine — the team at WakeMed built much of the
clinical content with Dr. Graham Snyder (Medical Director, WakeMed Center
for Innovative Learning), and it's already live with nurse leaders at Duke
and UNC.

I've preconfigured a ${hospital}-branded instance for you. No login, no
setup form — open the link, take a high-acuity scenario (sepsis recognition,
acute MI activation, or stroke tPA decision), and at the end you'll see
your own readiness profile: a Nurse Wisdom Index, 11 clinical wisdom
domains, and a decision-by-decision recap. 15–20 minutes.

${link}

Three things I'd most value if you have a minute after:
• Does the teaching land for a nurse at the bedside?
• Anything that reads off, condescending, or wrong — flag it
• If it lands, can we scope a single-unit pilot together?

Happy to send the WakeMed clinical-partnership brief as a reference —
just say the word.

Thanks,
${sender}
Pinnacle Mx Group · 440.679.7962`;
}

export function Builder({ defaultSender }: { defaultSender: string }) {
  const [hospital, setHospital] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [accent, setAccent] = useState(DEFAULT_ACCENT);
  const [contact, setContact] = useState("");
  const [role, setRole] = useState("");
  const [sender, setSender] = useState(defaultSender || "Paul");

  const [copied, setCopied] = useState<null | "link" | "email">(null);

  // Slug auto-derives from the hospital name until the user edits it directly.
  const effectiveSlug = slugTouched ? slug : slugify(hospital);
  const accentValid = HEX_RE.test(accent);
  const safeAccent = accentValid ? accent : DEFAULT_ACCENT;

  const longLink = useMemo(() => {
    const base = defaultProtocolConfig(
      effectiveSlug || "tenant",
      hospital.trim() || "Hospital",
    );
    const config: ProtocolConfigV11 = {
      ...base,
      branding: {
        ...base.branding,
        accent_color: safeAccent,
        hospital_name_display: hospital.trim() || base.branding.hospital_name_display,
      },
    };
    return `${CLINICAL_ENGINE_URL}#config=${encodeConfigHash(config)}`;
  }, [effectiveSlug, hospital, safeAccent]);

  const shortLink = PROVISIONED_SHORT_LINKS[effectiveSlug.toLowerCase()];
  // The link Paul shares + the link that goes in the email.
  const brandedLink = shortLink ?? longLink;

  const emailBody = useMemo(
    () =>
      buildEmailBody({
        contact,
        hospital,
        link: brandedLink,
        sender,
      }),
    [contact, hospital, brandedLink, sender],
  );

  const fullEmail = `Subject: ${EMAIL_SUBJECT}\n\n${emailBody}`;

  async function copy(text: string, which: "link" | "email") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    } catch {
      // Clipboard blocked (insecure context / permissions) — select-and-copy
      // fallback is the textarea below, which the user can copy manually.
    }
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-2">
      {/* ---- Form ---- */}
      <form className="card p-8" onSubmit={(e) => e.preventDefault()}>
        <p className="label">Hospital + contact</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Tell me who I&apos;m reaching.</h2>

        <Field
          id="hospital"
          label="Hospital name"
          value={hospital}
          onChange={(v) => setHospital(v)}
          placeholder="Mercy Health"
        />

        <label className="mt-5 block">
          <span className="label">Slug suggestion</span>
          <input
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="mercy-health"
            className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 font-mono text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-label text-ink-3">
            Auto-generated from the hospital name · editable
          </span>
        </label>

        <label className="mt-5 block">
          <span className="label">Accent color</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="color"
              aria-label="Accent color picker"
              value={safeAccent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-ink/15 bg-white/70 p-1"
            />
            <input
              type="text"
              aria-label="Accent color hex"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder={DEFAULT_ACCENT}
              className={`w-full rounded-lg border bg-white/70 px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 ${
                accentValid ? "border-ink/15 focus:border-teal" : "border-orange/50"
              }`}
            />
          </div>
          {!accentValid && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-label text-orange">
              Not a valid hex — using {DEFAULT_ACCENT} until fixed
            </span>
          )}
        </label>

        <Field
          id="contact"
          label="Contact first name"
          value={contact}
          onChange={setContact}
          placeholder="Lisa"
        />
        <Field
          id="role"
          label="Contact role (optional)"
          value={role}
          onChange={setRole}
          placeholder="VP Nursing"
        />
        <Field
          id="sender"
          label="Sender first name"
          value={sender}
          onChange={setSender}
          placeholder="Paul"
        />
      </form>

      {/* ---- Output ---- */}
      <div className="flex flex-col gap-6">
        <div className="card p-8">
          <p className="label">The branded link</p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            {shortLink ? "Short link ready." : "Preconfigured engine link."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            {shortLink
              ? "This slug is already provisioned — share the short URL."
              : "Generated on the fly from the form. Opens with no login. Want a short demo.aiwizn.com/" +
                (effectiveSlug || "slug") +
                " link? Ask Thomas to provision the slug."}
          </p>
          <textarea
            readOnly
            rows={shortLink ? 2 : 5}
            value={brandedLink}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-4 w-full resize-none rounded-lg border border-ink/15 bg-cream-light px-3 py-2 font-mono text-xs leading-relaxed text-ink-2 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => copy(brandedLink, "link")}
              className="btn-primary"
            >
              {copied === "link" ? "Copied ✓" : "Copy link"}
            </button>
            <a
              href={brandedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              Preview ↗
            </a>
          </div>
        </div>

        <div className="card p-8">
          <p className="label">The draft intro email</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Edit, then send.</h2>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-ink-3">
            Subject — {EMAIL_SUBJECT}
          </p>
          <textarea
            readOnly
            rows={22}
            value={emailBody}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 w-full resize-y rounded-lg border border-ink/15 bg-cream-light px-3 py-2 text-sm leading-relaxed text-ink-2 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => copy(fullEmail, "email")}
              className="btn-primary"
            >
              {copied === "email" ? "Copied ✓" : "Copy email"}
            </button>
            <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
              Copies subject + body
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="label">{label}</span>
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    </label>
  );
}
