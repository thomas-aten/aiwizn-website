"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface SubscribeButtonProps {
  tier: "early_bird" | "regular";
  className?: string;
  label?: string;
}

export function SubscribeButton({
  tier,
  className,
  label = "Subscribe now",
}: SubscribeButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Push them to sign-in, then back to /pricing.
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={cn("btn-primary", className)}
      >
        {pending ? "Starting checkout…" : label}
      </button>
      {error && (
        <p className="mt-3 rounded-lg border border-orange/30 bg-orange-dim px-3 py-2 text-xs text-orange">
          {error}
        </p>
      )}
    </>
  );
}
