"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ATTENDING_NAMING_OPTIONS,
  SCENARIO_ENGINES,
  SCENARIO_SET_OPTIONS,
  SCENARIO_VARIANT_OPTIONS,
  STAFF_ROLES,
  STAFF_SCOPE_FIELDS,
  STANDING_ORDER_GROUPS,
  STANDING_ORDER_MODE_OPTIONS,
  TERMINOLOGY_FIELDS,
  TIMING_FIELDS,
  validateProtocolConfig,
  type ProtocolConfigV11,
  type ScenarioOverridesConfig,
  type StaffRolesConfig,
  type StandingOrderEntry,
  type StandingOrderMode,
  type StandingOrderPathway,
  type StandingOrdersConfig,
} from "@/lib/protocolConfig";
import type { CustomerRole } from "@/lib/customerContext";
import { publishConfig, type PublishResult } from "../_actions";
import { diffConfigs, type ConfigDiff } from "./diff";

type Props = {
  initialConfig: ProtocolConfigV11;
  currentVersion: number;
  canEdit: boolean;
  role: CustomerRole;
};

export function ConfigEditor({
  initialConfig,
  currentVersion,
  canEdit,
  role,
}: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<ProtocolConfigV11>(initialConfig);
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  const ro = !canEdit;

  // --- immutable section updaters -----------------------------------------
  function patch<K extends keyof ProtocolConfigV11>(
    key: K,
    value: ProtocolConfigV11[K],
  ) {
    setConfig((c) => ({ ...c, [key]: value }));
    setResult(null);
  }
  const setBranding = (p: Partial<ProtocolConfigV11["branding"]>) =>
    patch("branding", { ...config.branding, ...p });
  const setTimings = (p: Partial<ProtocolConfigV11["timings"]>) =>
    patch("timings", { ...config.timings, ...p });
  /**
   * Update a single (pathway, orderKey) entry. The standing-orders schema is
   * nested two levels deep — the top-level setter clones the pathway record
   * before splicing in the new entry so React state stays immutable. The
   * pathway interfaces don't share keys, so we tunnel through an indexable
   * record type to keep the spread well-typed.
   */
  const setStandingOrder = (
    pathway: StandingOrderPathway,
    orderKey: string,
    mode: StandingOrderMode,
  ) => {
    const so = config.standing_orders as unknown as Record<
      StandingOrderPathway,
      Record<string, StandingOrderEntry>
    >;
    const nextPathway: Record<string, StandingOrderEntry> = {
      ...so[pathway],
      [orderKey]: { mode },
    };
    patch(
      "standing_orders",
      ({ ...so, [pathway]: nextPathway } as unknown) as StandingOrdersConfig,
    );
  };
  const setTerm = (p: Partial<ProtocolConfigV11["terminology"]>) =>
    patch("terminology", { ...config.terminology, ...p });
  const setScenario = (
    engine: keyof ScenarioOverridesConfig,
    p: Partial<ScenarioOverridesConfig[keyof ScenarioOverridesConfig]>,
  ) =>
    patch("scenario_overrides", {
      ...config.scenario_overrides,
      [engine]: { ...config.scenario_overrides[engine], ...p },
    });
  const setStaff = (
    roleKey: keyof StaffRolesConfig,
    p: Partial<StaffRolesConfig[keyof StaffRolesConfig]>,
  ) =>
    patch("staff_roles", {
      ...config.staff_roles,
      [roleKey]: { ...config.staff_roles[roleKey], ...p },
    });
  const setClinical = (p: Partial<ProtocolConfigV11["clinical_overrides"]>) =>
    patch("clinical_overrides", { ...config.clinical_overrides, ...p });

  // --- diff ----------------------------------------------------------------
  const diff: ConfigDiff = useMemo(
    () => diffConfigs(initialConfig, config),
    [initialConfig, config],
  );
  const dirty = diff.length > 0;

  // local validation for inline error preview before opening the diff
  const localErrors = useMemo(() => {
    const v = validateProtocolConfig(config);
    return v.ok ? [] : v.errors;
  }, [config]);

  async function onConfirmPublish() {
    setPending(true);
    setResult(null);
    try {
      const r = await publishConfig(config);
      setResult(r);
      if (r.status === "published" || r.status === "staged_for_review") {
        setReviewing(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Mode banner ------------------------------------------------------ */}
      {ro ? (
        <Banner tone="info">
          <strong>View-only.</strong> You&rsquo;re signed in as{" "}
          <code className="font-mono text-xs">{role}</code>. Contact your AIWIZN
          admin to edit this configuration.
        </Banner>
      ) : (
        <Banner tone="neutral">
          Editing as <strong>admin</strong>. Changes are staged locally until you
          review &amp; publish a new version.
        </Banner>
      )}

      {/* 1. Branding ------------------------------------------------------ */}
      <Section title="Customer & branding" n={1}>
        <Grid>
          <TextField
            label="Customer name"
            value={config.branding.customer_name}
            onChange={(v) => setBranding({ customer_name: v })}
            disabled={ro}
          />
          <TextField
            label="Slug"
            value={config.branding.slug}
            onChange={() => {}}
            disabled
            hint="Read-only — set at provisioning."
          />
          <TextField
            label="Hospital display name"
            value={config.branding.hospital_name_display}
            onChange={(v) => setBranding({ hospital_name_display: v })}
            disabled={ro}
          />
          <TextField
            label="Logo URL"
            value={config.branding.logo_url}
            onChange={(v) => setBranding({ logo_url: v })}
            disabled={ro}
            placeholder="https://…/logo.svg"
          />
          <div>
            <FieldLabel>Accent color</FieldLabel>
            <div className="flex items-center gap-3">
              <input
                type="color"
                aria-label="Accent color"
                value={normalizeHex(config.branding.accent_color)}
                onChange={(e) => setBranding({ accent_color: e.target.value })}
                disabled={ro}
                className="h-10 w-12 cursor-pointer rounded border border-ink/15 bg-white disabled:cursor-not-allowed disabled:opacity-50"
              />
              <input
                type="text"
                value={config.branding.accent_color}
                onChange={(e) => setBranding({ accent_color: e.target.value })}
                disabled={ro}
                className={inputCls}
              />
            </div>
          </div>
          <SelectField
            label="Attending naming"
            value={config.branding.attending_naming}
            onChange={(v) =>
              setBranding({
                attending_naming:
                  v as ProtocolConfigV11["branding"]["attending_naming"],
              })
            }
            options={ATTENDING_NAMING_OPTIONS}
            disabled={ro}
          />
        </Grid>
      </Section>

      {/* 2. Timings ------------------------------------------------------- */}
      <Section title="Timing targets" n={2}>
        <Grid>
          {TIMING_FIELDS.map((f) => (
            <div key={f.key}>
              <FieldLabel>{f.label}</FieldLabel>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={f.min}
                  max={f.max}
                  value={config.timings[f.key]}
                  onChange={(e) =>
                    setTimings({ [f.key]: e.target.valueAsNumber } as never)
                  }
                  disabled={ro}
                  className={inputCls}
                />
                <span className="font-mono text-xs text-ink-3">{f.unit}</span>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-ink-3">
                {f.anchor}
              </p>
            </div>
          ))}
        </Grid>
      </Section>

      {/* 3. Standing orders (pathway-grouped) ---------------------------- */}
      <Section title="Standing orders" n={3}>
        <p className="mb-3 text-[11px] leading-snug text-ink-3">
          Orders are grouped by pathway. Each toggle is ternary —{" "}
          <strong>Off</strong>, <strong>On</strong>, or{" "}
          <strong>On + parallel notify</strong> (executes and pages the
          supervising clinician in parallel).
        </p>
        <div className="space-y-3">
          {STANDING_ORDER_GROUPS.map((group) => {
            const pathway = config.standing_orders[
              group.key
            ] as unknown as Record<string, StandingOrderEntry>;
            return (
              <PathwayGroupCard
                key={group.key}
                label={group.label}
                anchor={group.anchor}
              >
                {group.orders.map((order) => {
                  const entry = pathway[order.key];
                  return (
                    <ModeRow
                      key={order.key}
                      label={order.label}
                      tooltip={order.tooltip}
                      mode={entry?.mode ?? "off"}
                      onChange={(m) =>
                        setStandingOrder(group.key, order.key, m)
                      }
                      disabled={ro}
                    />
                  );
                })}
              </PathwayGroupCard>
            );
          })}
        </div>
      </Section>

      {/* 4. Terminology --------------------------------------------------- */}
      <Section title="Terminology overrides" n={4}>
        <Grid>
          {TERMINOLOGY_FIELDS.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              value={config.terminology[f.key]}
              onChange={(v) => setTerm({ [f.key]: v } as never)}
              disabled={ro}
              placeholder={f.default}
            />
          ))}
        </Grid>
      </Section>

      {/* 5. Scenario overrides ------------------------------------------- */}
      <Section title="Scenario overrides" n={5}>
        <div className="grid gap-4 md:grid-cols-2">
          {SCENARIO_ENGINES.map((e) => {
            const ov = config.scenario_overrides[e.key];
            return (
              <div key={e.key} className="card p-5">
                <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Engine
                </p>
                <h3 className="mt-0.5 font-display text-lg text-ink">
                  {e.label}
                </h3>
                <div className="mt-4 space-y-4">
                  <SelectField
                    label="Variant"
                    value={ov.variant}
                    onChange={(v) =>
                      setScenario(e.key, { variant: v as typeof ov.variant })
                    }
                    options={SCENARIO_VARIANT_OPTIONS}
                    disabled={ro}
                  />
                  <SelectField
                    label="Scenario set"
                    value={ov.scenario_set}
                    onChange={(v) =>
                      setScenario(e.key, {
                        scenario_set: v as typeof ov.scenario_set,
                      })
                    }
                    options={SCENARIO_SET_OPTIONS}
                    disabled={ro}
                  />
                  <ToggleRow
                    label="Show internal codes"
                    checked={ov.show_internal_codes}
                    onChange={(v) =>
                      setScenario(e.key, { show_internal_codes: v })
                    }
                    disabled={ro}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 6. Staff roles --------------------------------------------------- */}
      <Section title="Staff roles" n={6}>
        <div className="grid gap-4 md:grid-cols-3">
          {STAFF_ROLES.map((r) => {
            const roleCfg = config.staff_roles[r.key];
            return (
              <div key={r.key} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg text-ink">{r.label}</h3>
                    <p className="text-[11px] text-ink-3">{r.expand}</p>
                  </div>
                  <Switch
                    checked={roleCfg.enabled}
                    onChange={(v) => setStaff(r.key, { enabled: v })}
                    disabled={ro}
                    label={`${r.label} enabled`}
                  />
                </div>
                <div
                  className={`mt-4 space-y-1 ${roleCfg.enabled ? "" : "opacity-40"}`}
                >
                  {STAFF_SCOPE_FIELDS.map((s) => (
                    <ToggleRow
                      key={s.key}
                      label={s.label}
                      checked={roleCfg[s.key]}
                      onChange={(v) => setStaff(r.key, { [s.key]: v } as never)}
                      disabled={ro || !roleCfg.enabled}
                      compact
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 7. Clinical overrides (collapsed, governance-gated) ------------- */}
      <ClinicalOverrides
        config={config}
        onChange={setClinical}
        disabled={ro}
      />

      {/* Action bar ------------------------------------------------------- */}
      {!ro && (
        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 bg-cream-light/90 px-4 py-3 backdrop-blur">
          <div className="text-sm text-ink-2">
            {dirty ? (
              <span>
                <strong>{diff.length}</strong> change
                {diff.length === 1 ? "" : "s"} staged
                {localErrors.length > 0 && (
                  <span className="ml-2 text-orange">
                    · {localErrors.length} validation issue
                    {localErrors.length === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-ink-3">No changes since v{currentVersion}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setConfig(initialConfig);
                setResult(null);
              }}
              disabled={!dirty || pending}
            >
              Revert
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setReviewing(true)}
              disabled={!dirty || pending}
            >
              Review &amp; publish →
            </button>
          </div>
        </div>
      )}

      {/* Result toast ----------------------------------------------------- */}
      {result && (
        <ResultNotice result={result} />
      )}

      {/* Diff modal ------------------------------------------------------- */}
      {reviewing && (
        <DiffModal
          diff={diff}
          errors={localErrors}
          pending={pending}
          result={result}
          onCancel={() => setReviewing(false)}
          onConfirm={onConfirmPublish}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Clinical overrides — collapsed by default, governance banner
// ---------------------------------------------------------------------------

function ClinicalOverrides({
  config,
  onChange,
  disabled,
}: {
  config: ProtocolConfigV11;
  onChange: (p: Partial<ProtocolConfigV11["clinical_overrides"]>) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const co = config.clinical_overrides;
  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-ink/[0.02]"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Section 7 · Governance-gated
          </p>
          <h2 className="mt-0.5 font-display text-xl text-ink">
            Clinical overrides
          </h2>
        </div>
        <span className="font-mono text-xs text-ink-3">
          {open ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>
      {open && (
        <div className="border-t border-ink/10 px-5 py-5">
          <Banner tone="warn">
            These edits require <strong>medical-reviewer approval</strong> before
            taking effect (see governance docs). Saving here stages the change
            for review — it does not publish.
          </Banner>
          <div className="mt-4 space-y-4">
            <TextareaField
              label="Additional contraindications"
              value={co.additional_contraindications}
              onChange={(v) => onChange({ additional_contraindications: v })}
              disabled={disabled}
              placeholder="One per line — appended to the protocol's contraindication list."
            />
            <TextareaField
              label="Additional inclusion criteria"
              value={co.additional_inclusion_criteria}
              onChange={(v) => onChange({ additional_inclusion_criteria: v })}
              disabled={disabled}
              placeholder="Local inclusion criteria layered on top of the canonical protocol."
            />
            <TextareaField
              label="Sepsis notes"
              value={co.sepsis_notes}
              onChange={(v) => onChange({ sepsis_notes: v })}
              disabled={disabled}
              placeholder="Free-text guidance shown alongside the sepsis pathway."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff modal
// ---------------------------------------------------------------------------

function DiffModal({
  diff,
  errors,
  pending,
  result,
  onCancel,
  onConfirm,
}: {
  diff: ConfigDiff;
  errors: string[];
  pending: boolean;
  result: PublishResult | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const blocked = errors.length > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-hidden bg-cream-light">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
              Review changes
            </p>
            <h2 className="mt-0.5 font-display text-xl text-ink">
              {diff.length} change{diff.length === 1 ? "" : "s"} to publish
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono text-xs text-ink-3 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {blocked && (
            <Banner tone="warn">
              <strong>Cannot publish.</strong> Fix these first:
              <ul className="mt-1 list-disc pl-5">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </Banner>
          )}

          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <th className="py-2 pr-3 font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Field
                </th>
                <th className="py-2 pr-3 font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Current (v-published)
                </th>
                <th className="py-2 font-mono text-[10px] uppercase tracking-label text-ink-3">
                  Proposed
                </th>
              </tr>
            </thead>
            <tbody>
              {diff.map((d) => (
                <tr key={d.path} className="border-b border-ink/5 align-top">
                  <td className="py-2 pr-3">
                    <span className="font-mono text-xs text-ink">{d.label}</span>
                    {d.governance && (
                      <span className="ml-1 rounded bg-orange/10 px-1 py-0.5 font-mono text-[9px] uppercase tracking-label text-orange">
                        review
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    <code className="rounded bg-ink/5 px-1 py-0.5 text-xs text-ink-2 line-through">
                      {d.before}
                    </code>
                  </td>
                  <td className="py-2">
                    <code className="rounded bg-teal/10 px-1 py-0.5 text-xs text-teal-dark">
                      {d.after}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {diff.some((d) => d.governance) && (
            <p className="mt-3 text-[11px] leading-snug text-orange">
              Rows marked <strong>review</strong> are clinical overrides — they
              will be staged for medical-reviewer approval instead of publishing
              immediately.
            </p>
          )}

          {result && <div className="mt-3"><ResultNotice result={result} /></div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-ink/10 px-5 py-4">
          <button
            type="button"
            className="btn-ghost"
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={pending || blocked}
          >
            {pending ? "Publishing…" : "Confirm & publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultNotice({ result }: { result: PublishResult }) {
  if (result.status === "published") {
    return (
      <Banner tone="success">
        Published <strong>v{result.version}</strong>. Engines will pick up the
        new config on next load.
      </Banner>
    );
  }
  if (result.status === "staged_for_review") {
    return (
      <Banner tone="warn">
        Clinical-override change <strong>staged for medical-reviewer
        approval</strong>.{" "}
        {result.published_version
          ? `Your other (non-clinical) edits published as v${result.published_version}.`
          : "No non-clinical changes were pending, so no new version was published."}{" "}
        Track it under{" "}
        <a
          href="/dashboard/admin/reviews"
          className="font-medium text-orange underline underline-offset-2"
        >
          Pending reviews
        </a>
        .
      </Banner>
    );
  }
  return (
    <Banner tone="warn">
      <strong>Could not publish.</strong>
      <ul className="mt-1 list-disc pl-5">
        {result.errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </Banner>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink-3";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block font-mono text-[11px] uppercase tracking-label text-ink-2">
      {children}
    </label>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Section({
  title,
  n,
  children,
}: {
  title: string;
  n: number;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-baseline gap-2">
        <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
          Section {n}
        </span>
        <h2 className="font-display text-xl text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={inputCls}
      />
      {hint && <p className="mt-1 text-[11px] text-ink-3">{hint}</p>}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        className={`${inputCls} resize-y`}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={inputCls}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-teal" : "bg-ink/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/**
 * Collapsible pathway-group container for standing orders. Open by default;
 * collapses on click. Mirrors the visual weight of a Section without the
 * numbered chrome (the parent Section already owns the numbering).
 */
function PathwayGroupCard({
  label,
  anchor,
  children,
}: {
  label: string;
  anchor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-ink/10 bg-cream-light/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-ink/[0.02]"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Pathway
          </p>
          <h3 className="mt-0.5 font-display text-lg text-ink">{label}</h3>
          <p className="mt-0.5 text-[11px] text-ink-3">{anchor}</p>
        </div>
        <span className="font-mono text-xs text-ink-3">
          {open ? "Collapse ▲" : "Expand ▼"}
        </span>
      </button>
      {open && (
        <div className="border-t border-ink/10 px-4 py-3">{children}</div>
      )}
    </div>
  );
}

/** Three-button radio for a standing-order mode (Off / On / Parallel notify). */
function ModeRow({
  label,
  tooltip,
  mode,
  onChange,
  disabled,
}: {
  label: string;
  tooltip: string;
  mode: StandingOrderMode;
  onChange: (m: StandingOrderMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/5 py-2.5 last:border-0">
      <span className="flex max-w-[60%] items-center gap-1.5 text-sm text-ink-2">
        {label}
        <span
          tabIndex={0}
          title={tooltip}
          className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-ink/20 font-mono text-[9px] text-ink-3"
          aria-label={tooltip}
        >
          i
        </span>
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex shrink-0 overflow-hidden rounded-lg border border-ink/15 bg-white"
      >
        {STANDING_ORDER_MODE_OPTIONS.map((opt) => {
          const active = opt.value === mode;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.hint}
              disabled={disabled}
              onClick={() => !disabled && onChange(opt.value)}
              className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-label transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "bg-teal text-white"
                  : "text-ink-3 hover:bg-ink/[0.04] hover:text-ink"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  tooltip,
  checked,
  onChange,
  disabled,
  compact,
}: {
  label: string;
  tooltip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-ink/5 ${
        compact ? "py-1.5" : "py-2.5"
      } last:border-0`}
    >
      <span className="flex items-center gap-1.5 text-sm text-ink-2">
        {label}
        {tooltip && (
          <span
            tabIndex={0}
            title={tooltip}
            className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-ink/20 font-mono text-[9px] text-ink-3"
            aria-label={tooltip}
          >
            i
          </span>
        )}
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={label}
      />
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: "info" | "warn" | "success" | "neutral";
  children: React.ReactNode;
}) {
  const cls = {
    info: "border-teal/20 bg-teal/5 text-ink-2",
    warn: "border-orange/25 bg-orange/5 text-ink-2",
    success: "border-teal/30 bg-teal/10 text-ink",
    neutral: "border-ink/10 bg-ink/[0.02] text-ink-2",
  }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

function normalizeHex(v: string): string {
  // <input type="color"> requires a 7-char #rrggbb; coerce best-effort.
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, r, g, b] = v;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#00A87A";
}
