"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Search } from "lucide-react";
import { apiClient, type FieldMarketSurveyEntry } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const AVAILABILITY = ["Available", "Out of Stock", "Short Supply"] as const;

// Round 19 item 2 — Market Survey entry. Maps onto the admin's
// marketSurveyEntry generic master. hq/patch/chemist are accepted as free
// text — those fields reference master collections (territoryHqMaster /
// patchNameMaster / dealers) with no existing field-portal list endpoint,
// and a competitor survey's HQ/patch/chemist context is informational
// rather than a real FK the rest of the system joins against, so building
// three new single-use picker endpoints this round was judged
// disproportionate. employee is always the caller's own real name, forced
// server-side.
export function FieldMarketSurveyForm() {
  const [surveys, setSurveys] = useState<FieldMarketSurveyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [surveyDate, setSurveyDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hq, setHq] = useState("");
  const [patch, setPatch] = useState("");
  const [chemist, setChemist] = useState("");
  const [competitorCompany, setCompetitorCompany] = useState("");
  const [competitorBrand, setCompetitorBrand] = useState("");
  const [competitorProduct, setCompetitorProduct] = useState("");
  const [competitorMrp, setCompetitorMrp] = useState("");
  const [availability, setAvailability] = useState<typeof AVAILABILITY[number]>("Available");
  const [feedback, setFeedback] = useState("");
  const [remarks, setRemarks] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.marketSurveys()
      .then((r) => setSurveys(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load market surveys"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!competitorBrand.trim()) { setError("Please enter the competitor brand."); return; }
    setSubmitting(true);
    try {
      await apiClient.submitMarketSurvey({
        surveyDate,
        hq: hq.trim(),
        patch: patch.trim(),
        chemist: chemist.trim(),
        competitorCompany: competitorCompany.trim(),
        competitorBrand: competitorBrand.trim(),
        competitorProduct: competitorProduct.trim(),
        competitorMrp: Number(competitorMrp) || 0,
        availability,
        feedback: feedback.trim(),
        remarks: remarks.trim()
      });
      setMessage("Market survey submitted.");
      setCompetitorCompany(""); setCompetitorBrand(""); setCompetitorProduct(""); setCompetitorMrp(""); setFeedback(""); setRemarks("");
      load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Unable to submit market survey");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Search size={15} className="text-emerald-700" /> New Market Survey
          </span>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700">Survey Date</label>
            <input type="date" value={surveyDate} onChange={(e) => setSurveyDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">HQ</label>
              <input type="text" value={hq} onChange={(e) => setHq(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Patch</label>
              <input type="text" value={patch} onChange={(e) => setPatch(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Chemist</label>
              <input type="text" value={chemist} onChange={(e) => setChemist(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Competitor Company</label>
              <input type="text" value={competitorCompany} onChange={(e) => setCompetitorCompany(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Competitor Brand *</label>
              <input type="text" value={competitorBrand} onChange={(e) => setCompetitorBrand(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Competitor Product</label>
              <input type="text" value={competitorProduct} onChange={(e) => setCompetitorProduct(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Competitor MRP</label>
              <input type="number" min={0} value={competitorMrp} onChange={(e) => setCompetitorMrp(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700">Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value as typeof AVAILABILITY[number])} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs">
              {AVAILABILITY.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700">Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={2} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 shadow-2xs resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700">Remarks</label>
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 shadow-2xs resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">{message}</p>}
          <button type="submit" disabled={submitting} className="w-full py-3 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit Market Survey"}
          </button>
        </form>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-extrabold text-slate-900">Your Past Surveys ({surveys.length})</h2>
        {!loading && surveys.length === 0 && <p className="text-sm text-slate-500 italic px-1">No market survey entries submitted yet.</p>}
        {surveys.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0"><ClipboardList size={14} /></div>
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{s.competitorBrand}</h4>
                  <p className="text-[10px] text-slate-500">{s.competitorCompany || "—"} · {formatDate(s.surveyDate)}</p>
                </div>
              </div>
              <span className="shrink-0 px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300">{s.availability}</span>
            </div>
            {s.feedback && <p className="text-[11px] text-slate-600">{s.feedback}</p>}
          </div>
        ))}
      </section>
    </>
  );
}
