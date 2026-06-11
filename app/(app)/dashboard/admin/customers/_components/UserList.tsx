"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  inviteCustomerUser,
  removeCustomerUser,
  type CustomerRole,
  type InviteUserResult,
  type RemoveUserResult,
} from "../_actions";

export type UserRow = {
  userId: string;
  email: string;
  role: CustomerRole;
};

type Props = {
  customerId: string;
  customerName: string;
  users: UserRow[];
};

const ROLE_OPTIONS: { value: CustomerRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "educator", label: "Educator" },
  { value: "cno", label: "CNO" },
  { value: "learner", label: "Learner" },
];

export function UserList({ customerId, customerName, users }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CustomerRole>("learner");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setNotice(null);
    setError(null);
    try {
      const r: InviteUserResult = await inviteCustomerUser({
        customerId,
        email,
        role,
      });
      if (r.status === "invited") {
        setNotice(
          r.newUser
            ? `Sent magic-link invite to ${email} and attached as ${role}.`
            : `Attached ${email} as ${role}.`,
        );
        setEmail("");
        setRole("learner");
        router.refresh();
      } else {
        setError(r.errors.join(" · "));
      }
    } finally {
      setPending(false);
    }
  }

  async function onRemove(userId: string, label: string) {
    if (
      !window.confirm(
        `Remove ${label} from ${customerName}? They lose access to this workspace immediately.`,
      )
    ) {
      return;
    }
    setRemovingId(userId);
    setNotice(null);
    setError(null);
    try {
      const r: RemoveUserResult = await removeCustomerUser({
        customerId,
        userId,
      });
      if (r.status === "removed") {
        setNotice(`Removed ${label}.`);
        router.refresh();
      } else {
        setError(r.errors.join(" · "));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onInvite} className="card p-5 md:p-6">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="font-mono text-[10px] uppercase tracking-label text-ink-3">
            Invite
          </span>
          <h2 className="font-display text-xl text-ink">Add a member</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="director@hospital.org"
            className={inputCls}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as CustomerRole)}
            className={inputCls}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={pending}>
            {pending ? "Inviting…" : "Invite"}
          </button>
        </div>
        <p className="mt-3 text-[11px] text-ink-3">
          Unknown emails get a Supabase magic-link invite; existing users are
          attached directly.
        </p>
      </form>

      {(notice || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-orange/25 bg-orange/5 text-orange"
              : "border-teal/25 bg-teal/5 text-ink-2"
          }`}
        >
          {error ?? notice}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-cream-light">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-ink/[0.02] text-left">
              <Th>Email</Th>
              <Th>Role</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-sm text-ink-3"
                >
                  No members yet. Invite the first one above.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.userId} className="border-b border-ink/5 last:border-0">
                <td className="px-4 py-3 text-ink">{u.email}</td>
                <td className="px-4 py-3">
                  <code className="font-mono text-xs text-ink-2">{u.role}</code>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(u.userId, u.email)}
                    disabled={removingId === u.userId}
                    className="font-mono text-[11px] uppercase tracking-label text-orange hover:underline disabled:opacity-50"
                  >
                    {removingId === u.userId ? "Removing…" : "Remove"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/20";

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-label text-ink-3 ${
        className ?? ""
      }`}
    >
      {children}
    </th>
  );
}
