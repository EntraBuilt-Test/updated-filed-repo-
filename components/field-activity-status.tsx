"use client";

import { useEffect, useState } from "react";
import { ListChecks, RefreshCw } from "lucide-react";
import { apiClient, type FieldActivityStatus } from "@/lib/api-client";

// Round 18 item 3 — "My Activity Status". Reads the admin's real
// Activity - Status generic master (GET /field/activity-status), matched
// to this employee by real name server-side since that master has no
// employee foreign key stored on the row (see field.routes.ts).
export function FieldActivityStatusReport() {
  const [rows, setRows] = useState<FieldActivityStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.activityStatus().then((r) => setRows(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Unable to load activity status")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const completed = rows.filter((r) => r.status === "Completed").length;

  return (
    <section className="space-y-3">
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-card flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Completion</p>
          <p className="text-lg font-black text-slate-900">{completed} / {rows.length} completed</p>
        </div>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && rows.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No activities are currently tracked against you.</p>
      )}

      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
              <ListChecks size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{row.activityName || "Activity"}</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{[row.mode, row.month, row.year].filter(Boolean).join(" · ")}</p>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${row.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"}`}>
              {row.status || "Pending"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
