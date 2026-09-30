"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardPlus, MapPin, RefreshCw, Search, Target } from "lucide-react";
import { apiClient, type FieldCampaignVisit } from "@/lib/api-client";
import type { Doctor } from "@zivira/types";

// Phase 1 — Campaign Execution: "Today's Campaign", a real scoped read of
// whatever Campaign Planning wrote for today's date (GET
// /field/campaign-visits?date=today) — exactly the reference app's
// Call Manager list of who to visit today, with a real link into the
// existing DCR form (already supports ?doctorId= preselect) so logging
// the actual visit is one tap away.
//
// Phase 3 — the reference app's "Plan" toggle. ON (default) shows the
// normal planned list above. OFF switches into deviation-browsing mode:
// pick a territory, see doctors there who aren't already in today's plan,
// tap one to request an off-plan visit (confirm modal -> remarks modal),
// which lands as a Pending Approval row for the rep's manager to approve
// or reject — it does not show as a live visit until approved.
function statusBadgeClasses(status: FieldCampaignVisit["status"]) {
  switch (status) {
    case "Completed": return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "Cancelled": return "bg-slate-100 text-slate-600 border-slate-300";
    case "Pending Approval": return "bg-sky-50 text-sky-800 border-sky-300";
    case "Rejected": return "bg-rose-50 text-rose-800 border-rose-300";
    default: return "bg-amber-50 text-amber-800 border-amber-300";
  }
}

const DEVIATION_TYPE_FALLBACK = ["Plan Change", "New Doctor", "Coverage Gap", "Emergency Call", "Other"];

export function CampaignExecution() {
  const [visits, setVisits] = useState<FieldCampaignVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const [planMode, setPlanMode] = useState(true);

  // Deviation-browsing state
  const [territories, setTerritories] = useState<string[]>([]);
  const [territoryQuery, setTerritoryQuery] = useState("");
  const [territory, setTerritory] = useState("");
  const [devDoctors, setDevDoctors] = useState<Doctor[]>([]);
  const [devLoading, setDevLoading] = useState(false);
  const [devError, setDevError] = useState("");

  const [confirmingDoctor, setConfirmingDoctor] = useState<Doctor | null>(null);
  const [remarksDoctor, setRemarksDoctor] = useState<Doctor | null>(null);
  const [deviationTypes, setDeviationTypes] = useState<string[]>(DEVIATION_TYPE_FALLBACK);
  const [deviationType, setDeviationType] = useState(DEVIATION_TYPE_FALLBACK[0]);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [devMessage, setDevMessage] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.campaignVisits(today)
      .then((r) => setVisits(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load today's campaign"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiClient.deviationTypes().then((r) => {
      if (Array.isArray(r.data) && r.data.length) {
        setDeviationTypes(r.data);
        setDeviationType(r.data[0]);
      }
    }).catch(() => {});
  }, []);

  function loadTerritories(q: string) {
    apiClient.deviationTerritories(q.trim() || undefined)
      .then((r) => setTerritories(r.data))
      .catch(() => setTerritories([]));
  }

  useEffect(() => {
    if (!planMode) loadTerritories("");
  }, [planMode]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickTerritory(t: string) {
    setTerritory(t);
    setDevDoctors([]);
    setDevError("");
    setDevLoading(true);
    apiClient.deviationDoctors(t)
      .then((r) => setDevDoctors(r.data))
      .catch((e) => setDevError(e instanceof Error ? e.message : "Unable to load doctors for this territory"))
      .finally(() => setDevLoading(false));
  }

  function openConfirm(doctor: Doctor) {
    setDevMessage("");
    setConfirmingDoctor(doctor);
  }

  function confirmYes() {
    if (!confirmingDoctor) return;
    setRemarksDoctor(confirmingDoctor);
    setConfirmingDoctor(null);
    setRemarks("");
    setDeviationType(deviationTypes[0]);
  }

  async function submitDeviation() {
    if (!remarksDoctor) return;
    setSubmitting(true);
    setDevError("");
    try {
      await apiClient.requestDeviationVisit({ doctorId: remarksDoctor.id, deviationType, remarks: remarks.trim() });
      setDevMessage(`Deviation request for ${remarksDoctor.name} sent to your manager for approval.`);
      setDevDoctors((prev) => prev.filter((d) => d.id !== remarksDoctor.id));
      setRemarksDoctor(null);
      load();
    } catch (e) {
      setDevError(e instanceof Error ? e.message : "Unable to submit this deviation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5"><Target size={15} className="text-emerald-700" /> Today&apos;s Campaign</h2>
          <p className="text-[11px] text-slate-500">
            {planMode ? "Doctors planned for today across all your active campaigns." : "Browsing off-plan — pick a territory to find a doctor."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPlanMode((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${planMode ? "bg-emerald-600" : "bg-slate-300"}`}
            title="Plan"
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${planMode ? "translate-x-6" : ""}`} />
          </button>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Plan</span>
          {planMode && (
            <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {planMode ? (
        <>
          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
          {!loading && visits.length === 0 && !error && (
            <p className="text-sm text-slate-500 italic px-1">Nothing planned for today — add doctors under Campaign Planning, or turn Plan off to find one off-plan.</p>
          )}

          <div className="space-y-2.5">
            {visits.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">{v.doctorName}</h4>
                    <p className="text-[10px] text-slate-500">
                      {v.source === "deviation" ? `Deviation${v.deviationType ? ` · ${v.deviationType}` : ""}` : v.campaignName}
                    </p>
                    {v.status === "Rejected" && v.rejectReason && (
                      <p className="text-[10px] text-rose-600 mt-0.5">Reason: {v.rejectReason}</p>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${statusBadgeClasses(v.status)}`}>
                    {v.status}
                  </span>
                </div>
                {v.status === "Planned" && (
                  <Link
                    href={`/field/dcr?doctorId=${encodeURIComponent(v.doctorId)}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                  >
                    <ClipboardPlus size={13} /> Log DCR for this visit
                  </Link>
                )}
                {v.status === "Pending Approval" && (
                  <p className="text-[11px] text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1.5">
                    Awaiting your manager&apos;s approval — this visit isn&apos;t live yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={territoryQuery}
              onChange={(e) => { setTerritoryQuery(e.target.value); loadTerritories(e.target.value); }}
              placeholder="Search territory..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
            />
          </div>

          {territories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {territories.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => pickTerritory(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${territory === t ? "bg-emerald-700 text-white border-emerald-700" : "bg-white text-slate-700 border-slate-300"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          {devMessage && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">{devMessage}</p>}
          {devError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">{devError}</p>}

          {territory && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 px-0.5">
                <MapPin size={12} /> {territory}
              </div>
              {devLoading && <p className="text-xs text-slate-500 px-1">Loading doctors...</p>}
              {!devLoading && devDoctors.length === 0 && (
                <p className="text-sm text-slate-500 italic px-1">No Data</p>
              )}
              {devDoctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openConfirm(d)}
                  className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-3 shadow-card flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">{d.name}</h4>
                    <p className="text-[10px] text-slate-500">{d.specialty} · {d.city}</p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-emerald-700">Add</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* "You're Deviating Plan" confirmation modal */}
      {confirmingDoctor && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900">You&apos;re Deviating Plan</h3>
            <p className="text-xs text-slate-600">Do you want to continue with an off-plan visit to {confirmingDoctor.name}?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmingDoctor(null)} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl">No</button>
              <button type="button" onClick={confirmYes} className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl">Yes</button>
            </div>
          </div>
        </div>
      )}

      {/* Remarks modal */}
      {remarksDoctor && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-black text-slate-900">Remarks</h3>
            <p className="text-[11px] text-slate-500">{remarksDoctor.name}</p>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Type</label>
              <select value={deviationType} onChange={(e) => setDeviationType(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800">
                {deviationTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Remarks</label>
              <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 resize-none" />
            </div>
            {devError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{devError}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={submitting} onClick={() => setRemarksDoctor(null)} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl disabled:opacity-60">Cancel</button>
              <button type="button" disabled={submitting} onClick={() => void submitDeviation()} className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl disabled:opacity-60">
                {submitting ? "Sending..." : "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
