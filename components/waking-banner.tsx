"use client";

import { useEffect, useState } from "react";
import { WAKING_EVENT, startKeepWarm } from "@/lib/resilience";

// Round 48 Part C -- friendly "server is waking up" state (auto-retry happens in the api-client)
// plus the keep-warm ping. Honours prefers-reduced-motion (no animation, text only).
export function WakingBanner({ apiBase, tokenKey }: { apiBase: string; tokenKey: string }) {
  const [waking, setWaking] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setWaking(!!(e as CustomEvent<{ active: boolean }>).detail?.active);
    window.addEventListener(WAKING_EVENT, on);
    const stop = startKeepWarm(apiBase, tokenKey);
    return () => { window.removeEventListener(WAKING_EVENT, on); stop(); };
  }, [apiBase, tokenKey]);
  if (!waking) return null;
  return (
    <div role="status" aria-live="polite" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ margin: 8, padding: "8px 16px", borderRadius: 10, background: "#fff7e0", color: "#7a5200", border: "1px solid #f0d58a", fontSize: 13, boxShadow: "0 2px 10px rgba(0,0,0,.15)" }}>
        <span className="zv-waking-dot" aria-hidden="true" /> The server is waking up - retrying automatically, this usually takes under a minute.
      </div>
      <style>{`.zv-waking-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#e0a100;margin-right:8px;animation:zvpulse 1s ease-in-out infinite}@keyframes zvpulse{50%{opacity:.25}}@media (prefers-reduced-motion:reduce){.zv-waking-dot{animation:none}}`}</style>
    </div>
  );
}
