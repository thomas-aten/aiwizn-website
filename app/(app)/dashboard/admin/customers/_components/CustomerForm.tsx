"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomer,
  updateCustomerBranding,
  type CreateCustomerResult,
  type UpdateBrandingResult,
} from "../_actions";
import { ENGINE_REGISTRY } from "@/lib/engineRegistry";

/**
 * Engine slug → title list. Derived from the registry at module load. Kept
 * here (client side) rather than re-exported from the server-actions file so
 * the "use server" boundary stays clean (Next.js disallows non-async exports
 * from a top-level "use server" module).
 */
const ENGINE_LIST: { slug: string; title: string }[] = Object.values(
  ENGINE_REGISTRY,
).map((e) => ({ slug: e.slug, title: e.title }));

type CreateMode = {
  mode: "create";
};

type EditMode = {
  mode: "edit";
  customerId: string;
  initial: {
    name: string;
    slug: string;
    accentColor: string;
    logoUrl: string;
  };
};

type Props = CreateMode | EditMode;

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Derive a slug from a human name — lowercase, dash-separated, ASCII only. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    // Strip combining diacriticals (U+0300–U+036F) so "Düsseldorf" → "dusseldorf".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function CustomerForm(props: Props) {
  const router = useRouter();
  const isCreate = props.mode === "create";

  const initial = !isCreate
    ? props.initial
    : { name: "", slug: "", accentColor: "#00A87A", logoUrl: "" };

  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(false);
  const [accentColor, setAccentColor] = useState(initial.accentColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [enginesEnabled, setEnginesEnabled] = useState<string[]>(
    isCreate ? ENGINE_LIST.map((e) => e.slug) : [],
  );
  const [adminEmail, setAdminEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<
    CreateCustomerResult | UpdateBrandingResult | null
  >(null);

  // On the create form the slug auto-tracks the name until the user edits it
  // directly. On the edit form the slug is locked at provisioning time.
  function onNameChange(v: string) {
    setName(v);
    if (isCreate && !slugTouched) setSlug(slugify(v));
  }

  const slugError = useMemo(() => {
    if (!isCreate) return null;
    if (!slug) return "Slug is required.";
    if (!SLUG_RE.test(slug))
      return "Lowercase letters, digits, and dashes only.";
    return null;
  }, [isCreate, slug]);

  function toggleEngine(s: string) {
    setEnginesEnabled((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      if (isCreate) {
        const r = await createCustomer({
          name,
          slug,
          brandingAccentColor: accentColor,
          logoUrl,
          initialEnginesEnabled: enginesEnabled,
          initialAdminEmail: adminEmail,
        });
        setResult(r);
        if (r.status === "created") {
          router.push(`/dashboard/admin/customers/${r.customerId}`);
          router.refresh();
        }
      } else {
        const r = await updateCustomerBranding({
          customerId: props.customerId,
          name,
          brandingAccentColor: accentColor,
          logoUrl,
        });
        setResult(r);
        if (r.status === "updated") router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="card p-5 md:p-6">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            {isCreate ? "Step 1" : "Identity"}
          </span>
          <h2 className="font-display text-xl text-ink">
            {isCreate ? "Customer identity" : "Customer & branding"}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Customer name">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Duke University Health"
              className={inputCls}
            />
          </Field>
          <Field
            label="Slug"
            hint={
              isCreate
                ? "Auto-derived from name. URL-safe; immutable after provisioning."
                : "Locked — set at provisioning time."
            }
            error={slugError}
          >
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              disabled={!isCreate}
              placeholder="duke-health"
              className={inputCls}
            />
          </Field>
          <Field label="Accent color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Accent color"
                value={normalizeHex(accentColor)}
                onChange={(e) => setAccentColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-ink/15 bg-white"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={inputCls}
              />
            </div>
          </Field>
          <Field label="Logo URL">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…/logo.svg"
              className={inputCls}
            />
          </Field>
        </div>
      </div>

      {isCreate && (
        <>
          <div className="card p-5 md:p-6">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                Step 2
              </span>
              <h2 className="font-display text-xl text-ink">
                Engines enabled at launch
              </h2>
            </div>
            <p className="mb-3 text-sm text-ink-2">
              Each enabled engine gets a v1 protocol_config seeded from the
              canonical defaults. License tier defaults to <strong>pilot</strong>
              ; refine per engine after provisioning.
            </p>
            <div className="space-y-1">
              {ENGINE_LIST.map((e) => (
                <label
                  key={e.slug}
                  className="flex cursor-pointer items-center justify-between gap-3 border-b border-ink/5 py-2 last:border-0"
                >
                  <span className="text-sm text-ink-2">
                    {e.title}{" "}
                    <code className="ml-1 font-mono text-[11px] text-ink-3">
                      ({e.slug})
                    </code>
                  </span>
                  <input
                    type="checkbox"
                    checked={enginesEnabled.includes(e.slug)}
                    onChange={() => toggleEngine(e.slug)}
                    className="h-4 w-4 rounded border-ink/20 text-teal"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5 md:p-6">
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                Step 3
              </span>
              <h2 className="font-display text-xl text-ink">
                Initial admin
              </h2>
            </div>
            <p className="mb-3 text-sm text-ink-2">
              Email of the first customer admin. If they don&rsquo;t have an
              AIWIZN account yet, we send a magic-link invite so they can
              activate it.
            </p>
            <Field label="Admin email">
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="director@dukehealth.org"
                className={inputCls}
              />
            </Field>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream-light/90 px-4 py-3">
        {result ? <ResultBanner result={result} /> : <span />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={pending || (isCreate && (!!slugError || enginesEnabled.length === 0))}
          >
            {pending
              ? isCreate
                ? "Provisioning…"
                : "Saving…"
              : isCreate
                ? "Create customer →"
                : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink-3";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-label text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-orange">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

function ResultBanner({
  result,
}: {
  result: CreateCustomerResult | UpdateBrandingResult;
}) {
  if (result.status === "created") {
    return (
      <span className="text-sm text-ink-2">
        ✓ Customer created — {result.enginesEnabled} engines,{" "}
        {result.configsSeeded} configs seeded.
        {result.invitedUser ? " Admin invited via magic-link." : ""}
      </span>
    );
  }
  if (result.status === "updated") {
    return <span className="text-sm text-ink-2">✓ Saved.</span>;
  }
  return (
    <span className="text-sm text-orange">
      <strong>Could not save.</strong> {result.errors.join(" · ")}
    </span>
  );
}

function normalizeHex(v: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#00A87A";
}
