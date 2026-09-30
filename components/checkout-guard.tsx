"use client";

// Phase 2 — DCR day-checkout gating. If GET /field/checkout-status reports
// an unclosed prior day, this renders a full-screen blocking prompt instead
// of the app's normal children, mirroring how attendance/checkin systems
// typically hard-block until the outstanding item is resolved. Rendered
// inside FieldShell, above the normal page content.

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

type OutstandingVisit = { id: string; doctorName?: string };

type CheckoutStatus = {
  blocked: boolean;
  openDate?: string;
  checkInAt?: string;
  outstandingCount?: number;
  outstandingVisits?: OutstandingVisit[];
};

export function CheckoutGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function refresh() {
    try {
      const res = await apiClient.checkoutStatus();
      setStatus(res.data);
    } catch {
      // If the status check itself fails (e.g. offline), don't lock the
      // person out of the app — fail open, same as every other best-effort
      // read in this portal.
      setStatus({ blocked: false });
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function attemptCheckout() {
    setBusy(true);
    setError("");
    try {
      await apiClient.checkOut();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check out");
    } finally {
      setBusy(false);
    }
  }

  async function markMissed(visitId: string) {
    setBusy(true);
    setError("");
    try {
      await apiClient.resolveCampaignVisit(visitId, { status: "Cancelled", notes: reason || "Marked missed while closing out a prior day" });
      setResolvingId(null);
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update this visit");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return null;
  }

  if (!status?.blocked) {
    return <>{children}</>;
  }

  const outstanding = status.outstandingVisits ?? [];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-rose-700 text-white px-4 py-3.5">
          <h2 className="text-sm font-black tracking-tight">Checkout Required</h2>
          <p className="text-[11px] text-rose-100 mt-0.5">
            You never checked out for {status.openDate}. Resolve the day below before continuing.
          </p>
        </div>

        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {outstanding.length === 0 ? (
            <p className="text-xs text-slate-600">
              No outstanding planned visits remain for {status.openDate}. You can check out now.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                {status.outstandingCount} planned visit{status.outstandingCount === 1 ? "" : "s"} from {status.openDate} still {status.outstandingCount === 1 ? "needs" : "need"} a DCR or an explanation before you can check out:
              </p>
              <ul className="space-y-2">
                {outstanding.map((visit) => (
                  <li key={visit.id} className="border border-slate-200 rounded-xl p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{visit.doctorName ?? "Doctor"}</span>
                      <button
                        className="shrink-0 px-2 py-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-60"
                        disabled={busy}
                        onClick={() => setResolvingId(resolvingId === visit.id ? null : visit.id)}
                      >
                        Mark missed
                      </button>
                    </div>
                    {resolvingId === visit.id && (
                      <div className="mt-2 space-y-1.5">
                        <input
                          className="w-full text-[11px] px-2 py-1.5 border border-slate-200 rounded-lg"
                          placeholder="Reason (optional)"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                        <button
                          className="w-full text-[11px] font-semibold text-white bg-slate-800 rounded-lg py-1.5 disabled:opacity-60"
                          disabled={busy}
                          onClick={() => void markMissed(visit.id)}
                        >
                          Confirm missed visit
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400">
                A DCR can only be logged for today, so a visit from a past day must be marked missed to close it out.
              </p>
            </>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold disabled:opacity-60"
            disabled={busy || outstanding.length > 0}
            onClick={() => void attemptCheckout()}
          >
            {busy ? "Checking out..." : `Check out for ${status.openDate}`}
          </button>
        </div>
      </div>
    </div>
  );
}
