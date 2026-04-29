import Link from "next/link";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  href?: string;
  showTagline?: boolean;
}

/**
 * AIWIZN wordmark — rotated-square diamond mark + display word + optional
 * "Wisdom Engine" tagline. Mirrors the master logo at public/aiwizn-logo.svg.
 */
export function Wordmark({ className, href = "/", showTagline = true }: WordmarkProps) {
  const inner = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <DiamondMark className="h-8 w-8 shrink-0" />
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

export function DiamondMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="AIWIZN mark"
    >
      <defs>
        <linearGradient id="m-tl" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9A6C" />
          <stop offset="100%" stopColor="#D94B12" />
        </linearGradient>
        <linearGradient id="m-tr" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00EDB4" />
          <stop offset="100%" stopColor="#00A87A" />
        </linearGradient>
        <linearGradient id="m-bl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A4A70" />
          <stop offset="100%" stopColor="#0D2D47" />
        </linearGradient>
        <linearGradient id="m-br" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0BBCD4" />
          <stop offset="100%" stopColor="#076A80" />
        </linearGradient>
      </defs>
      <polygon points="200,20 20,200 200,200" fill="url(#m-tl)" />
      <polygon points="200,20 200,200 380,200" fill="url(#m-tr)" />
      <polygon points="20,200 200,380 200,200" fill="url(#m-bl)" />
      <polygon points="200,200 200,380 380,200" fill="url(#m-br)" />
      <line x1="200" y1="20" x2="200" y2="380" stroke="#FAF7F2" strokeWidth="3" strokeOpacity="0.55" />
      <line x1="20" y1="200" x2="380" y2="200" stroke="#FAF7F2" strokeWidth="3" strokeOpacity="0.55" />
      <polygon
        points="200,20 380,200 200,380 20,200"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2"
        strokeOpacity="0.25"
      />
      <circle cx="200" cy="200" r="6" fill="#ffffff" fillOpacity="0.25" />
    </svg>
  );
}
