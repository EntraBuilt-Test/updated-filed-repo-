// Round 48 Part C -- shared by the admin, manager and field api-clients.
// Cold-start resilience: idempotent GETs are retried with back-off while a sleeping host wakes
// up (network error, timeout, or a 502/503/504 from the proxy), and a "waking up" event is
// broadcast so the UI can show a friendly banner instead of an error. Writes are never retried
// automatically (a retried POST could duplicate data).
export const WAKING_EVENT = "zivira:waking";
const RETRY_DELAYS_MS = [2000, 4000, 8000, 12000];
const WAKE_STATUSES = new Set([502, 503, 504]);

export function emitWaking(active: boolean) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(WAKING_EVENT, { detail: { active } }));
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export function isWakeError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return /taking too long|cannot reach the server|waking up|unexpected response/i.test(m);
}

export async function fetchWithRetry(doFetch: () => Promise<Response>, method = "GET"): Promise<Response> {
  const attempts = method.toUpperCase() === "GET" ? RETRY_DELAYS_MS.length + 1 : 1;
  for (let i = 0; ; i++) {
    try {
      const res = await doFetch();
      if (WAKE_STATUSES.has(res.status) && i < attempts - 1) { emitWaking(true); await sleep(RETRY_DELAYS_MS[i]); continue; }
      emitWaking(false);
      return res;
    } catch (e) {
      if (isWakeError(e) && i < attempts - 1) { emitWaking(true); await sleep(RETRY_DELAYS_MS[i]); continue; }
      emitWaking(false);
      throw e;
    }
  }
}

/** Pings /health while a signed-in tab is visible so the free-tier host is not spun down mid-session. */
export function startKeepWarm(apiBase: string, tokenKey: string): () => void {
  if (typeof window === "undefined") return () => {};
  const ping = () => {
    try {
      if (document.visibilityState !== "visible" || !window.localStorage.getItem(tokenKey)) return;
    } catch { return; }
    fetch(`${apiBase}/health`, { cache: "no-store" }).catch(() => {});
  };
  ping();
  const id = window.setInterval(ping, 4 * 60 * 1000);
  const onVisible = () => { if (document.visibilityState === "visible") ping(); };
  document.addEventListener("visibilitychange", onVisible);
  return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
}
