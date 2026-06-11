"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerContext } from "@/lib/customerContext";
import { writeAuditEvent } from "@/lib/auditLog";
import { defaultProtocolConfig } from "@/lib/protocolConfig";
import { ENGINE_REGISTRY } from "@/lib/engineRegistry";
import {
  isPlatformAdmin,
  type PlatformAdminCheck,
} from "@/lib/platformAdmin";

/**
 * Server actions for the Sprint 7 customer-onboarding admin UI
 * (/dashboard/admin/customers).
 *
 * Every action runs through {@link assertPlatformAdmin} before any write: a
 * non-platform-admin caller is rejected regardless of what the form submits
 * (the client-side gate is UX only). Every successful write emits an audit_log
 * row via {@link writeAuditEvent} so onboarding decisions are traceable to a
 * named user.
 *
 * Until a dedicated `platform_admin` role exists in `customer_users.role`, the
 * effective platform-admin set is: any user who is `admin` of *every*
 * currently-seeded customer (see {@link isPlatformAdmin}). This intentionally
 * starts narrow — Thomas + co-founders — and widens automatically the moment a
 * named role lands. New customers created via this UI do NOT shift the gate:
 * the platform-admin set is locked to the seed cohort, otherwise creating a
 * new customer would lock the creator out of the next creation.
 */

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

type AdminCtx = {
  userId: string;
  /** Customer the action runs against (omitted on createCustomer). */
  customerId?: string;
};

async function assertPlatformAdmin(): Promise<
  | { ok: true; userId: string; check: PlatformAdminCheck }
  | { ok: false; error: string }
> {
  const ctx = await getCustomerContext();
  if (ctx.status !== "ok") {
    return { ok: false, error: "Not signed in to a workspace." };
  }
  const check = await isPlatformAdmin(ctx.userId);
  if (!check.allowed) {
    return {
      ok: false,
      error:
        "Platform-admin only — your account is not on the platform-admin allow list.",
    };
  }
  return { ok: true, userId: ctx.userId, check };
}

// ---------------------------------------------------------------------------
// createCustomer
// ---------------------------------------------------------------------------

export type EngineSlug = keyof typeof ENGINE_REGISTRY;

export type CreateCustomerInput = {
  name: string;
  slug: string;
  brandingAccentColor: string;
  logoUrl: string;
  /** Engine slugs to enable on day 1 (subset of ENGINE_REGISTRY keys). */
  initialEnginesEnabled: string[];
  /** Email of the first customer admin. May be a brand-new user. */
  initialAdminEmail: string;
};

export type CreateCustomerResult =
  | {
      status: "created";
      customerId: string;
      enginesEnabled: number;
      configsSeeded: number;
      invitedUser: boolean;
    }
  | { status: "error"; errors: string[] };

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validateCreateInput(input: CreateCustomerInput): string[] {
  const errs: string[] = [];
  if (!input.name || input.name.trim().length === 0) {
    errs.push("Customer name is required.");
  }
  if (!input.slug || !SLUG_RE.test(input.slug)) {
    errs.push(
      "Slug must be lowercase letters, digits, and dashes (e.g. 'duke-health').",
    );
  }
  if (!HEX_RE.test(input.brandingAccentColor)) {
    errs.push("Accent color must be a hex value like #00A87A.");
  }
  if (!EMAIL_RE.test(input.initialAdminEmail)) {
    errs.push("Initial admin email is invalid.");
  }
  if (input.initialEnginesEnabled.length === 0) {
    errs.push("At least one engine must be enabled.");
  }
  for (const slug of input.initialEnginesEnabled) {
    if (!(slug in ENGINE_REGISTRY)) {
      errs.push(`Unknown engine slug: ${slug}.`);
    }
  }
  return errs;
}

/**
 * Look up an `auth.users.id` by email. If the email isn't a registered user
 * yet, send a magic-link invite via the admin client and return the new user's
 * id. Never throws — returns an `error` string on failure so the calling action
 * can surface a precise message instead of a 500.
 */
async function resolveOrInviteUser(
  email: string,
): Promise<
  | { userId: string; invited: boolean }
  | { error: string }
> {
  const admin = createAdminClient();
  // listUsers is paginated by email filter; for the cohort sizes we deal with
  // (single-digit per call) a default page is plenty.
  try {
    // @supabase/supabase-js typings expose listUsers with no filter, so we
    // scan one page and match on email — acceptable until we have >1k users.
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) return { error: listErr.message };
    const found = list?.users?.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (found) return { userId: found.id, invited: false };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `User lookup failed: ${err.message}`
          : "User lookup failed.",
    };
  }

  // Brand-new user — send a magic-link invite. Supabase creates the row, and
  // the user finishes setting up via the link in their inbox.
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data?.user) {
    return { error: error?.message ?? "Invite returned no user." };
  }
  return { userId: data.user.id, invited: true };
}

/**
 * Provision a brand-new customer in a single server action.
 *
 * Inserts (for the canonical Duke / UNC / Atrium-style case with 3 engines
 * enabled): 1× customers + 3× customer_engine_access + 3× protocol_configs +
 * 1× customer_users = 8 rows, plus 1 audit_log event. The first three groups
 * are kept independent — a failure mid-way leaves a partial customer that the
 * UI surfaces as such; we do NOT wrap in a transaction here because Supabase
 * server actions can't open one across separate insert calls, and the
 * idempotency cost (re-running with the same slug yields a 23505 unique
 * violation we can show the user) is acceptable for the rare provisioning path.
 */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CreateCustomerResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { status: "error", errors: [auth.error] };

  const errs = validateCreateInput(input);
  if (errs.length > 0) return { status: "error", errors: errs };

  const admin = createAdminClient();

  // 1. customers row -------------------------------------------------------
  const { data: customer, error: custErr } = await admin
    .from("customers")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      branding: {
        accent_color: input.brandingAccentColor,
        logo_url: input.logoUrl.trim(),
      },
    })
    .select("id")
    .single();

  if (custErr || !customer) {
    return {
      status: "error",
      errors: [`Could not create customer: ${custErr?.message ?? "no row"}`],
    };
  }
  const customerId = customer.id as string;

  // 2. customer_engine_access rows ----------------------------------------
  const engineRows = input.initialEnginesEnabled.map((slug) => ({
    customer_id: customerId,
    engine_slug: slug,
    enabled: true,
    license_tier: "pilot",
    seats: null,
  }));
  if (engineRows.length > 0) {
    const { error: engErr } = await admin
      .from("customer_engine_access")
      .insert(engineRows);
    if (engErr) {
      return {
        status: "error",
        errors: [
          `Customer created but engine access failed: ${engErr.message}. Customer id: ${customerId}.`,
        ],
      };
    }
  }

  // 3. protocol_configs rows (v1 per enabled engine, canonical default) ---
  const seedConfig = defaultProtocolConfig(input.slug, input.name);
  const configRows = input.initialEnginesEnabled.map((slug) => ({
    customer_id: customerId,
    engine_slug: slug,
    config_json: seedConfig,
    version: 1,
    effective_from: new Date().toISOString(),
    created_by: auth.userId,
  }));
  if (configRows.length > 0) {
    const { error: cfgErr } = await admin
      .from("protocol_configs")
      .insert(configRows);
    if (cfgErr) {
      return {
        status: "error",
        errors: [
          `Customer + engines created but config seed failed: ${cfgErr.message}. Customer id: ${customerId}.`,
        ],
      };
    }
  }

  // 4. customer_users row for the initial admin (with invite if new) ------
  const resolved = await resolveOrInviteUser(input.initialAdminEmail.trim());
  if ("error" in resolved) {
    return {
      status: "error",
      errors: [
        `Customer scaffolded but initial admin could not be attached: ${resolved.error}. Customer id: ${customerId}.`,
      ],
    };
  }

  const { error: memberErr } = await admin.from("customer_users").insert({
    customer_id: customerId,
    user_id: resolved.userId,
    role: "admin",
  });
  if (memberErr) {
    return {
      status: "error",
      errors: [
        `Customer + engines + configs created, but admin membership failed: ${memberErr.message}.`,
      ],
    };
  }

  await writeAuditEvent({
    customerId,
    userId: auth.userId,
    eventType: "customer_user.role_changed",
    resourceType: "customer_users",
    resourceId: null,
    payload: {
      action: "customer_provisioned",
      slug: input.slug,
      engines_enabled: input.initialEnginesEnabled,
      initial_admin_email: input.initialAdminEmail,
      initial_admin_invited: resolved.invited,
    },
  });

  revalidatePath("/dashboard/admin/customers");
  // The dashboard nav reads memberships — refresh so the newly-attached admin
  // (when they sign in) gets the right nav. Cheap blanket revalidate.
  revalidatePath("/dashboard", "layout");

  return {
    status: "created",
    customerId,
    enginesEnabled: input.initialEnginesEnabled.length,
    configsSeeded: input.initialEnginesEnabled.length,
    invitedUser: resolved.invited,
  };
}

// ---------------------------------------------------------------------------
// updateCustomerBranding
// ---------------------------------------------------------------------------

export type UpdateBrandingInput = {
  customerId: string;
  name?: string;
  brandingAccentColor?: string;
  logoUrl?: string;
};

export type UpdateBrandingResult =
  | { status: "updated" }
  | { status: "error"; errors: string[] };

export async function updateCustomerBranding(
  input: UpdateBrandingInput,
): Promise<UpdateBrandingResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { status: "error", errors: [auth.error] };

  if (
    input.brandingAccentColor !== undefined &&
    !HEX_RE.test(input.brandingAccentColor)
  ) {
    return {
      status: "error",
      errors: ["Accent color must be a hex value like #00A87A."],
    };
  }

  const admin = createAdminClient();

  // Read first so we can merge into the existing `branding` JSONB without
  // clobbering keys we don't know about.
  const { data: row, error: readErr } = await admin
    .from("customers")
    .select("name, branding")
    .eq("id", input.customerId)
    .maybeSingle();
  if (readErr || !row) {
    return {
      status: "error",
      errors: [`Customer not found: ${readErr?.message ?? "no row"}`],
    };
  }

  const branding: Record<string, unknown> =
    (row.branding as Record<string, unknown> | null) ?? {};
  if (input.brandingAccentColor !== undefined) {
    branding.accent_color = input.brandingAccentColor;
  }
  if (input.logoUrl !== undefined) branding.logo_url = input.logoUrl;

  const patch: Record<string, unknown> = { branding };
  if (input.name !== undefined && input.name.trim() !== "") {
    patch.name = input.name.trim();
  }

  const { error: updErr } = await admin
    .from("customers")
    .update(patch)
    .eq("id", input.customerId);
  if (updErr) {
    return {
      status: "error",
      errors: [`Could not update customer: ${updErr.message}`],
    };
  }

  await writeAuditEvent({
    customerId: input.customerId,
    userId: auth.userId,
    eventType: "customer_user.role_changed",
    resourceType: "customer_users",
    resourceId: null,
    payload: {
      action: "branding_updated",
      changed: Object.keys(patch),
    },
  });

  revalidatePath(`/dashboard/admin/customers/${input.customerId}`);
  revalidatePath("/dashboard/admin/customers");
  return { status: "updated" };
}

// ---------------------------------------------------------------------------
// inviteCustomerUser
// ---------------------------------------------------------------------------

export type CustomerRole = "admin" | "educator" | "cno" | "learner";

export type InviteUserInput = {
  customerId: string;
  email: string;
  role: CustomerRole;
};

export type InviteUserResult =
  | { status: "invited"; userId: string; newUser: boolean }
  | { status: "error"; errors: string[] };

const ROLES: CustomerRole[] = ["admin", "educator", "cno", "learner"];

export async function inviteCustomerUser(
  input: InviteUserInput,
): Promise<InviteUserResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { status: "error", errors: [auth.error] };

  if (!EMAIL_RE.test(input.email)) {
    return { status: "error", errors: ["Email is invalid."] };
  }
  if (!ROLES.includes(input.role)) {
    return { status: "error", errors: [`Unknown role: ${input.role}.`] };
  }

  const resolved = await resolveOrInviteUser(input.email.trim());
  if ("error" in resolved) {
    return { status: "error", errors: [resolved.error] };
  }

  const admin = createAdminClient();
  const { error: insErr } = await admin.from("customer_users").insert({
    customer_id: input.customerId,
    user_id: resolved.userId,
    role: input.role,
  });
  if (insErr) {
    return {
      status: "error",
      errors: [`Could not attach user: ${insErr.message}`],
    };
  }

  await writeAuditEvent({
    customerId: input.customerId,
    userId: auth.userId,
    eventType: "customer_user.role_changed",
    resourceType: "customer_users",
    resourceId: null,
    payload: {
      action: "user_invited",
      email: input.email,
      role: input.role,
      new_user: resolved.invited,
    },
  });

  revalidatePath(`/dashboard/admin/customers/${input.customerId}/users`);
  return {
    status: "invited",
    userId: resolved.userId,
    newUser: resolved.invited,
  };
}

// ---------------------------------------------------------------------------
// removeCustomerUser
// ---------------------------------------------------------------------------

export type RemoveUserInput = { customerId: string; userId: string };

export type RemoveUserResult =
  | { status: "removed" }
  | { status: "error"; errors: string[] };

export async function removeCustomerUser(
  input: RemoveUserInput,
): Promise<RemoveUserResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { status: "error", errors: [auth.error] };

  const admin = createAdminClient();

  // Refuse if this is the last admin — leaving zero admins locks the customer
  // out of their own workspace. The check is best-effort (TOCTOU race exists
  // if two admins are deleted in parallel) but adequate for a human-driven
  // admin UI.
  const { count: adminCount, error: cntErr } = await admin
    .from("customer_users")
    .select("user_id", { count: "exact", head: true })
    .eq("customer_id", input.customerId)
    .eq("role", "admin");
  if (cntErr) {
    return {
      status: "error",
      errors: [`Could not check admin count: ${cntErr.message}`],
    };
  }

  // If the user we're removing is an admin AND they're the only admin, refuse.
  const { data: target, error: tgtErr } = await admin
    .from("customer_users")
    .select("role")
    .eq("customer_id", input.customerId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (tgtErr || !target) {
    return {
      status: "error",
      errors: [`Membership not found: ${tgtErr?.message ?? "no row"}`],
    };
  }
  if (target.role === "admin" && (adminCount ?? 0) <= 1) {
    return {
      status: "error",
      errors: [
        "Refusing to remove the last admin — promote another member to admin first.",
      ],
    };
  }

  const { error: delErr } = await admin
    .from("customer_users")
    .delete()
    .eq("customer_id", input.customerId)
    .eq("user_id", input.userId);
  if (delErr) {
    return {
      status: "error",
      errors: [`Could not remove user: ${delErr.message}`],
    };
  }

  await writeAuditEvent({
    customerId: input.customerId,
    userId: auth.userId,
    eventType: "customer_user.role_changed",
    resourceType: "customer_users",
    resourceId: null,
    payload: {
      action: "user_removed",
      removed_user_id: input.userId,
      removed_role: target.role,
    },
  });

  revalidatePath(`/dashboard/admin/customers/${input.customerId}/users`);
  return { status: "removed" };
}

// ---------------------------------------------------------------------------
// updateEngineAccess
// ---------------------------------------------------------------------------

export type UpdateEngineAccessInput = {
  customerId: string;
  engineSlug: string;
  enabled: boolean;
  licenseTier: string;
  seats?: number | null;
};

export type UpdateEngineAccessResult =
  | { status: "updated" }
  | { status: "error"; errors: string[] };

export async function updateEngineAccess(
  input: UpdateEngineAccessInput,
): Promise<UpdateEngineAccessResult> {
  const auth = await assertPlatformAdmin();
  if (!auth.ok) return { status: "error", errors: [auth.error] };

  if (!(input.engineSlug in ENGINE_REGISTRY)) {
    return {
      status: "error",
      errors: [`Unknown engine slug: ${input.engineSlug}.`],
    };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("customer_engine_access")
    .upsert(
      {
        customer_id: input.customerId,
        engine_slug: input.engineSlug,
        enabled: input.enabled,
        license_tier: input.licenseTier,
        seats: input.seats ?? null,
      },
      { onConflict: "customer_id,engine_slug" },
    );

  if (error) {
    return {
      status: "error",
      errors: [`Could not update engine access: ${error.message}`],
    };
  }

  await writeAuditEvent({
    customerId: input.customerId,
    userId: auth.userId,
    eventType: "customer_user.role_changed",
    resourceType: "customer_users",
    resourceId: null,
    payload: {
      action: "engine_access_updated",
      engine_slug: input.engineSlug,
      enabled: input.enabled,
      license_tier: input.licenseTier,
      seats: input.seats ?? null,
    },
  });

  revalidatePath(`/dashboard/admin/customers/${input.customerId}/engines`);
  return { status: "updated" };
}

