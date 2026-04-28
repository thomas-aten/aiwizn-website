"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AUDIENCES = [
  { value: "", label: "Choose one…" },
  { value: "hospital", label: "Hospital / health system" },
  { value: "school", label: "Nursing school / academic" },
  { value: "investor", label: "Investor" },
  { value: "clinician", label: "Clinician / advisor" },
  { value: "other", label: "Other" },
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [audience, setAudience] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("submit_contact_message", {
        p_name: name,
        p_email: email,
        p_organization: org,
        p_audience: audience || null,
        p_message: message,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8">
        <p className="label">Thank you</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Message received.</h2>
        <p className="mt-3 text-sm text-ink-2">
          We&apos;ll be in touch shortly. For anything urgent, email{" "}
          <a className="underline" href="mailto:Thomas@ateninc.com">
            Thomas@ateninc.com
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-8">
      <p className="label">Send a message</p>
      <h2 className="mt-3 font-display text-2xl text-ink">Tell us a bit about you.</h2>

      <Field id="name" label="Name" value={name} onChange={setName} required />
      <Field
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
      />
      <Field id="org" label="Organisation" value={org} onChange={setOrg} />

      <label className="mt-5 block">
        <span className="label">Audience</span>
        <select
          name="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-5 block">
        <span className="label">Message</span>
        <textarea
          required
          rows={5}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
          placeholder="What would you like to discuss?"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-lg border border-orange/30 bg-orange-dim px-3 py-2 text-xs text-orange">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-6">
        {pending ? "Sending…" : "Send"}
      </button>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-ink-3">
        Your message lands in our database and pings the team.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="mt-5 block">
      <span className="label">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-white/70 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/30"
      />
    </label>
  );
}
