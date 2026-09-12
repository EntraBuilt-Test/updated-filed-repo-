"use client";

import type { CompanyBranch, TourPlan, TourPlanLocation } from "@zivira/types";
import { Plus, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthDisplay() {
  const now = new Date();
  return now.toLocaleString('default', { month: 'short' }) + ' ' + now.getFullYear();
}

function statusBadgeClass(status: TourPlan["status"]) {
  if (status === "VOIDED" || status === "REJECTED") return "bg-rose-100 text-rose-900 border-rose-300";
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  return "bg-amber-100 text-amber-900 border-amber-300";
}

export function TourPlanForm({ switchToExpenses }: { switchToExpenses?: () => void }) {
  const [tourPlans, setTourPlans] = useState<TourPlan[]>([]);
  const [branches, setBranches] = useState<CompanyBranch[]>([]);
  const [month, setMonth] = useState(currentMonth());
  const [locations, setLocations] = useState<TourPlanLocation[]>([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
  const [gstBranchCode, setGstBranchCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [conflictTpId, setConflictTpId] = useState<string | null>(null);
  const [addingToExisting, setAddingToExisting] = useState(false);

  function refresh() {
    apiClient.tourPlans().then((r) => setTourPlans(r.data)).catch(() => {});
  }

  useEffect(() => {
    refresh();
    apiClient.branches().then((r) => setBranches(r.data)).catch(() => {});
  }, []);

  function addLocation() {
    setLocations((l) => [...l, { date: "", area: "", town: "", purpose: "Regular Coverage" }]);
  }
  function removeLocation(i: number) {
    setLocations((l) => l.filter((_, idx) => idx !== i));
  }
  function updateLocation(i: number, field: keyof TourPlanLocation, val: string) {
    setLocations((l) => l.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    setConflictTpId(null);
    try {
      const valid = locations.filter((l) => l.date && l.area && l.town);
      if (!valid.length) throw new Error("Add at least one location with date, area and town.");
      const created = await apiClient.submitTourPlan({ month, locations: valid, gstBranchCode: gstBranchCode || undefined });
      setMessage(`Tour Plan ${created.data.tpId} submitted for approval.`);
      setLocations([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit Tour Plan");
      if (e instanceof ApiError && typeof e.details?.existingTpId === "string") {
        setConflictTpId(e.details.existingTpId);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function addToExisting() {
    if (!conflictTpId) return;
    setAddingToExisting(true);
    setError("");
    setMessage("");
    try {
      const valid = locations.filter((l) => l.date && l.area && l.town);
      if (!valid.length) throw new Error("Add at least one location with date, area and town.");
      const updated = await apiClient.addTourPlanLocations(conflictTpId, valid);
      setMessage(`Added ${valid.length} location(s) to ${updated.data.tpId}.`);
      setLocations([{ date: "", area: "", town: "", purpose: "Regular Coverage" }]);
      setConflictTpId(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to add locations to the existing Tour Plan");
    } finally {
      setAddingToExisting(false);
    }
  }

  const selectedBranch = branches.find((b) => b.gstNumber === gstBranchCode);

  return (
    <section className="space-y-4">
      {/* HERO BANNER: Progress Tracking Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white text-slate-800 p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] border border-emerald-200/70 space-y-4">
        {/* Abstract Watermark Shapes */}
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-emerald-100/40 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                Current Roster
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Draft in Progress</span>
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1.5 text-slate-900 flex items-center space-x-2">
              <span>Tour Plan</span>
              <span className="text-emerald-600 font-light">•</span>
              <span className="text-slate-600 text-lg font-bold">{currentMonthDisplay()}</span>
            </h1>
          </div>
        </div>

        {/* GST Linkage Chip */}
        {selectedBranch && (
          <div className="flex items-center space-x-2 bg-emerald-50/70 border border-emerald-200/70 rounded-xl px-3 py-2 text-[11px] text-emerald-900">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></div>
            <p className="truncate font-medium">
              <strong className="text-slate-900">{selectedBranch.branchName}</strong> • {selectedBranch.gstNumber}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] space-y-4 relative overflow-hidden">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Month</label>
              <input
                type="month"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setConflictTpId(null);
                }}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST Branch</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700"
                value={gstBranchCode}
                onChange={(e) => setGstBranchCode(e.target.value)}
              >
                <option value="">No specific branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.gstNumber}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">Planned Itinerary</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 text-slate-700">{locations.length} Stops</span>
            </div>
            <button
              onClick={addLocation}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 hover:text-white hover:bg-emerald-800 bg-emerald-100/70 border border-emerald-300/80 px-3 py-1.5 rounded-xl transition-all active:scale-95 cursor-pointer"
              type="button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stop</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {locations.map((loc, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3 space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-lg bg-emerald-800 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 tracking-tight">Stop {i + 1}</span>
                  </div>
                  {locations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(i)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Date</label>
                    <input
                      type="date"
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                      value={loc.date}
                      onChange={(e) => updateLocation(i, "date", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Purpose</label>
                    <select
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                      value={loc.purpose}
                      onChange={(e) => updateLocation(i, "purpose", e.target.value)}
                    >
                      {["Regular Coverage", "New Launch", "Camp Visit", "Joint Work", "Conference"].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Origin Area</label>
                    <input
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                      placeholder="e.g. Bandra West"
                      value={loc.area}
                      onChange={(e) => updateLocation(i, "area", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Destination Town</label>
                    <input
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-700"
                      placeholder="e.g. Mumbai Central"
                      value={loc.town}
                      onChange={(e) => updateLocation(i, "town", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <div className="pt-2">
          {conflictTpId ? (
            <button
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-70"
              disabled={addingToExisting}
              type="button"
              onClick={addToExisting}
            >
              <span>{addingToExisting ? "Adding…" : `Add to ${conflictTpId}`}</span>
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-900 hover:to-teal-900 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-900/25 flex items-center justify-center space-x-2 transition-all border border-emerald-600/40 cursor-pointer disabled:opacity-70"
              disabled={submitting}
              type="submit"
            >
              <span>{submitting ? "Submitting…" : "Submit Tour Plan"}</span>
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {/* Linked Expense Quick Glance */}
      {switchToExpenses && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 text-slate-800 shadow-sm space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </span>
              <div>
                <h4 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">Associated Expense Claims</h4>
              </div>
            </div>
            <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer" onClick={switchToExpenses}>
              View All
            </button>
          </div>
          <button className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200/70 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer" onClick={switchToExpenses}>
            <span>+ Add New Voucher</span>
          </button>
        </div>
      )}

      {/* History */}
      <div className="space-y-2.5 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Cycle History &amp; Approvals</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            {tourPlans.length} Cycles on Record
          </span>
        </div>

        {tourPlans.length === 0 && <p className="text-sm text-slate-500 italic">No Tour Plans submitted yet.</p>}

        {tourPlans.map((tp) => (
          <div key={tp.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className={`p-1.5 rounded-xl border ${statusBadgeClass(tp.status)} bg-opacity-30`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">{tp.tpId}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Cycle: {tp.month}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${statusBadgeClass(tp.status)}`}>
                {tp.status}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1 border border-slate-100">
              <p><span className="font-bold text-slate-800">{tp.locations.length} location(s)</span></p>
              <p className="text-slate-500">Approver: {tp.assignedManagerName ?? tp.assignedManager}</p>
            </div>
            {tp.status === "VOIDED" && (
              <p className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-lg mt-2">
                Voided by {tp.voidedByName ?? tp.voidedBy} — {tp.voidReason}
                {tp.reassignedToTpId ? ` · Reassigned to ${tp.reassignedToTpId}` : ""}
              </p>
            )}
            {tp.parentTpId && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-2">
                Reassigned from: {tp.parentTpId}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
