"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardPlus, RefreshCw, Target } from "lucide-react";
import { apiClient, type FieldCampaignVisit } from "@/lib/api-client";

// Phase 1 — Campaign Execution: "Today's Campaign", a real scoped read of
// whatever Campaign Planning wrote for today's date (GET
// /field/campaign-visits?date=today) — exactly the reference app's
// Call Manager list of who to visit today, with a real link into the
// existing DCR form (already supports ?doctorId= preselect) so logging
// the actual visit is one tap away. Read-only this round — the later
// Deviation phase is what lets a rep add an off-plan doctor here.
export function CampaignExecution() {
  const [visits, setVisits] = useState<FieldCampaignVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  function load() {
    setLoading(true);
    setError("");
    apiClient.campaignVisits(today)
      .then((r) => setVisits(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load today's campaign"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5"><Target size={15} className="text-emerald-700" /> Today&apos;s Campaign</h2>
          <p className="text-[11px] text-slate-500">Doctors planned for today across all your active campaigns.</p>
        </div>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && visits.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">Nothing planned for today — add doctors under Campaign Planning.</p>
      )}

      <div className="space-y-2.5">
        {visits.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{v.doctorName}</h4>
                <p className="text-[10px] text-slate-500">{v.campaignName}</p>
              </div>
              <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${v.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
                {v.status}
              </span>
            </div>
            {v.status !== "Completed" && (
              <Link
                href={`/field/dcr?doctorId=${encodeURIComponent(v.doctorId)}`}
                className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
              >
                <ClipboardPlus size={13} /> Log DCR for this visit
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
