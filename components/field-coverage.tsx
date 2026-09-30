"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Target } from "lucide-react";
import { apiClient, type FieldCoverageRow } from "@/lib/api-client";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Round 19 item 4 — "My Coverage". Reuses the exact same real aggregation
// the admin's Coverage Analysis 2 report runs (computeCoverageAnalysis2,
// src/utils/coverage-analysis.ts), scoped to just this employee via
// GET /field/coverage (employeeCode forced server-side to the caller's own).
export function FieldCoverage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [row, setRow] = useState<FieldCoverageRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.coverage(month, year)
      .then((r) => setRow(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load coverage"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const territoryTypes: Array<"HQ" | "EX" | "OS"> = ["HQ", "EX", "OS"];
  const labels: Record<string, string> = { HQ: "Headquarters", EX: "Extension", OS: "Outstation" };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 shadow-2xs"
        >
          {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="button" onClick={load} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && !row && !error && (
        <p className="text-sm text-slate-500 italic px-1">No coverage data found for this month.</p>
      )}

      {row && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold text-slate-900">{row.fieldForceName}</p>
              <p className="text-[10px] text-slate-500">{row.designation} · {row.hq}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Doctors Mapped</p>
              <p className="text-lg font-black text-slate-900">{row.ttlDrs}</p>
            </div>
          </div>

          {territoryTypes.map((tt) => {
            const t = row.territoryTypes?.[tt];
            if (!t) return null;
            return (
              <div key={tt} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2.5">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-700" /> {labels[tt]} ({tt})
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Total Calls</p>
                    <p className="text-sm font-black text-slate-900">{t.tc}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Days Worked</p>
                    <p className="text-sm font-black text-slate-900">{t.dw}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Doctors Seen</p>
                    <p className="text-sm font-black text-slate-900">{t.seen}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-2">
                    <p className="text-[9px] font-bold text-emerald-700 uppercase">Coverage %</p>
                    <p className="text-sm font-black text-emerald-900">{t.coverage === "-" ? "-" : `${t.coverage}%`}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-2 col-span-2">
                    <p className="text-[9px] font-bold text-emerald-700 uppercase">Call Average / Day</p>
                    <p className="text-sm font-black text-emerald-900">{t.calAvg}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
