"use client";

import { useMemo, useState } from "react";
import {
  TENANT_OPTIONS,
  tenantOption,
  buildCohortInviteUrl,
  buildInviteEmail,
  type LearnerDetails,
} from "@/lib/cohortInviteBuilder";

/**
 * /cohort-invite builder — client-interactive child of the gated server page.
 *
 * The website-domain, allowlist-gated successor to the engine-repo
 * `cohort-invite.html` tools. An allow-listed user (Paul Palamara, ateninc.com
 * staff, …) picks a tenant, enters a tester's details, and gets back a
 * personalized cohort link + a ready-to-send email.
 *
 * All link/email generation is pure and client-side, via
 * `lib/cohortInviteBuilder.ts`. Read-only — no Supabase writes, no new
 * persistence. Visual pattern mirrors `app/demo/new/Builder.tsx`.
 */

const ROLE_OPTIONS = [
  "RN",
  "Charge RN",
  "CCRN",
  "Nurse Educator",
  "Nurse Manager",
  "DNP, RN",
  "CNS",
  "NP",
];

export function Builder({ defaultSender }: { defaultSender: string }) {
  const [tenantSlug, setTenantSlug] = useState<string>("wakemed");
  const [customOrg, setCustomOrg] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState("");
  const [role, setRole] = useState("RN");
  const [sender, setSender] = useState(defaultSender || "Thomas");

  const [copied, setCopied] = useState<null | "url" | "email" | "subject">(null);

  const opt = tenantOption(tenantSlug);
  const isCustom = opt.isCustom;

  // The org label that rides in the learner_org param + email default.
  const org = isCustom ? customOrg.trim() : opt.orgName;

  const learner: LearnerDetails = useMemo(
    () => ({ firstName, lastName, email, unit, role, org }),
    [firstName, lastName, email, unit, role, org],
  );

  const url = useMemo(
    () =>
      buildCohortInviteUrl({
        tenantSlug,
        customOrgName: customOrg,
        learner,
      }),
    [tenantSlug, customOrg, learner],
  );

  const { subject, body } = useMemo(
    () =>
      buildInviteEmail({
        tenantSlug,
        customOrgName: customOrg,
        firstName,
        url,
        senderName: sender,
      }),
    [tenantSlug, customOrg, firstName, url, sender],
  );

  const fullEmail = `Subject: ${subject}\n\n${body}`;
  const ready = url !== "";

  async function copy(text: string, which: "url" | "email" | "subject") {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the read-only
      // textareas below are select-on-focus so the user can copy manually.
    }
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-2">
      {/* ---- Form ---- */}
      <form className="card p-8" onSubmit={(e) => e.preventDefault()}>
        <p className="label">Tenant + tester</p>
        <h2 className="mt-2 font-display text-2xl text-ink">
          Who&apos;s testing, and where?
        </h2>

        <label className="mt-5 block">
          <span className="label">Tenant</span>
          <select
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            {TENANT_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {!opt.usesConfigHash && (
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-label text-ink-3">
              WakeMed is frozen — link carries no config hash, matching the
              existing tester link
            </span>
          )}
        </label>

        {isCustom && (
          <Field
            id="customOrg"
            label="Organization name"
            value={customOrg}
            onChange={setCustomOrg}
            placeholder="Foo Hospital"
            helper="Generates a generic-default branded config · slug auto-derived"
          />
        )}

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field
            id="firstName"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Sarah"
            inline
          />
          <Field
            id="lastName"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            placeholder="Chen"
            inline
          />
        </div>

        <Field
          id="email"
          label="Work email"
          value={email}
          onChange={setEmail}
          placeholder="sarah.chen@wakemed.org"
          type="email"
        />

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field
            id="unit"
            label="Unit"
            value={unit}
            onChange={setUnit}
            placeholder="ED"
            inline
            helper="e.g. ED, CCU, MICU, Cath Lab"
          />
          <label className="block">
            <span className="label">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Field
          id="sender"
          label="Signed by"
          value={sender}
          onChange={setSender}
          placeholder="Thomas"
          helper="Name that appears at the bottom of the email"
        />
      </form>

      {/* ---- Output ---- */}
      <div className="flex flex-col gap-6">
        <div className="card p-8">
          <p className="label">Personalized URL</p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            {ready ? "Link ready." : "Fill in name + email."}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            {ready
              ? "Pre-fills the tester's info and carries the tenant branding. Opens with no login."
              : "Enter a first name, last name, and work email to generate the personalized link."}
          </p>
          <textarea
            readOnly
            rows={5}
            value={url || "Fill in name + email above…"}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-4 w-full resize-none rounded-lg border border-ink/15 bg-cream-light px-3 py-2 font-mono text-xs leading-relaxed text-ink-2 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => copy(url, "url")}
              disabled={!ready}
              className="btn-secondary disabled:opacity-50"
            >
              {copied === "url" ? "Copied ✓" : "Copy URL only"}
            </button>
            {ready && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Preview ↗
              </a>
            )}
          </div>
          {ready && (
            <div className="mt-4 rounded-lg border border-orange/40 bg-orange/5 px-3 py-2 text-xs leading-relaxed text-ink-2">
              <span className="font-semibold">Tip for iOS Mail:</span> after
              pasting, the URL may show as a preview card. That&apos;s fine — tap
              &ldquo;Send&rdquo; anyway. The link still works for the recipient.
            </div>
          )}
        </div>

        <div className="card p-8">
          <p className="label">Ready-to-send email</p>
          <h2 className="mt-2 font-display text-2xl text-ink">Copy, then send.</h2>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-ink-3">
            Subject — {subject}
          </p>
          <textarea
            readOnly
            rows={20}
            value={body}
            onFocus={(e) => e.currentTarget.select()}
            className="mt-3 w-full resize-y rounded-lg border border-ink/15 bg-cream-light px-3 py-2 text-sm leading-relaxed text-ink-2 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => copy(fullEmail, "email")}
              disabled={!ready}
              className="btn-primary disabled:opacity-50"
            >
              {copied === "email" ? "Copied ✓" : "Copy entire email"}
            </button>
            <button
              type="button"
              onClick={() => copy(subject, "subject")}
              className="btn-secondary"
            >
              {copied === "subject" ? "Copied ✓" : "Copy subject line"}
            </button>
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
  helper,
  type = "text",
  inline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
  type?: "text" | "email";
  inline?: boolean;
}) {
  return (
    <label className={inline ? "block" : "mt-5 block"}>
      <span className="label">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
      {helper && (
        <span className="mt-1 block font-mono text-[10px] uppercase tracking-label text-ink-3">
          {helper}
        </span>
      )}
    </label>
  );
}
