"use client";

import { useEffect } from "react";

type Props = {
  /** Engine embed URL with the config already encoded in the hash. */
  src: string;
  /** Origin of the engine, used to filter incoming postMessage events. */
  engineOrigin: string;
  title: string;
};

/**
 * Renders the engine iframe and listens for config-update messages from it.
 *
 * For Sprint 2 the listener is log-only — it's the hook the future
 * config-update flow will write back through. We only accept messages whose
 * origin matches the engine to avoid acting on cross-site noise.
 */
export function EngineFrame({ src, engineOrigin, title }: Props) {
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (engineOrigin && event.origin !== engineOrigin) return;
      // TODO(sprint-3): persist config updates back to Supabase.
      console.log("[engine-frame] message from engine", {
        origin: event.origin,
        data: event.data,
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [engineOrigin]);

  return (
    <iframe
      src={src}
      title={title}
      className="absolute inset-0 h-full w-full border-0"
      loading="lazy"
      allow="autoplay; fullscreen; clipboard-write"
      referrerPolicy="no-referrer-when-downgrade"
      // Trusted-but-isolated: the engine is our own deploy on a different
      // origin. allow-same-origin lets it keep ITS OWN origin's storage /
      // postMessage (not the parent's), allow-scripts runs the app, and the
      // form/popup/modal/download grants cover normal engine interactions.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads"
    />
  );
}
