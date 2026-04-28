import Link from "next/link";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  href?: string;
  showTagline?: boolean;
}

/**
 * AIWIZN wordmark — quadrant crosshair mark + display-serif word, with optional
 * "Wisdom Engine" tagline. Lifted in spirit from the clinical-engine demo.
 */
export function Wordmark({ className, href = "/", showTagline = true }: WordmarkProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span aria-hidden className="relative h-7 w-7 shrink-0">
        <svg viewBox="0 0 32 32" className="h-7 w-7">
          <rect x="0" y="0" width="16" height="16" fill="#D94B12" />
          <rect x="16" y="0" width="16" height="16" fill="#00A87A" />
          <rect x="0" y="16" width="16" height="16" fill="#0A1826" />
          <rect x="16" y="16" width="16" height="16" fill="#C8920A" />
          <line x1="16" y1="0" x2="16" y2="32" stroke="#FBF8EF" strokeWidth="1.5" />
          <line x1="0" y1="16" x2="32" y2="16" stroke="#FBF8EF" strokeWidth="1.5" />
        </svg>
      </span>
      <span className="leading-none">
        <span className="block font-display text-[1.6rem] font-semibold tracking-tight text-ink">
          AIWIZN
        </span>
        {showTagline && (
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-label text-ink-3">
            Wisdom Engine
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="group inline-flex items-center" aria-label="AIWIZN home">
      {inner}
    </Link>
  );
}
