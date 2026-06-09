-- multitenancy_010_clinical_override_proposals
--
-- Sprint 5.5 — review queue for governance-gated clinical_overrides edits.
--
-- The customer-admin config editor (Sprint 5) stages clinical_overrides changes
-- instead of auto-publishing them. Each staged change becomes a row here; a
-- reviewer approves (which merges the override into a new protocol_configs
-- version) or rejects it. Non-clinical config sections continue to publish
-- directly to protocol_configs.
--
-- Depends on helpers from earlier multitenancy migrations:
--   public.is_user_member_of_customer(uuid, uuid)
--   public.is_customer_admin(uuid)
-- and tables public.customers, public.protocol_configs.

create table public.clinical_override_proposals (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  engine_slug text not null,
  proposed_clinical_overrides jsonb not null,
  proposed_by uuid not null references auth.users(id),
  proposed_at timestamptz default now(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewer_id uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  resulting_config_id uuid references public.protocol_configs(id)
);

alter table public.clinical_override_proposals enable row level security;

-- SELECT: own customer
create policy cop_select_own_customer
on public.clinical_override_proposals for select
to authenticated
using (public.is_user_member_of_customer(auth.uid(), customer_id));

-- INSERT: customer admin proposes
create policy cop_insert_admin
on public.clinical_override_proposals for insert
to authenticated
with check (public.is_customer_admin(customer_id));

-- UPDATE: reviewer (currently AIWIZN-central; later per-customer medical director role)
-- For now, allow any admin of any customer to act as reviewer — gated more tightly later.
create policy cop_update_reviewer
on public.clinical_override_proposals for update
to authenticated
using (public.is_customer_admin(customer_id));

create index cop_pending_idx on public.clinical_override_proposals (status, proposed_at desc)
  where status = 'pending';

create index cop_customer_idx on public.clinical_override_proposals (customer_id, proposed_at desc);
