"use client";

import type { ExpenseClaim, ExpenseClaimCategory, TourPlan } from "@zivira/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

const CATEGORIES: ExpenseClaimCategory[] = ["Travel", "Lodging", "Food", "Local Conveyance", "Other"];

function statusBadgeClass(status: ExpenseClaim["status"]) {
  if (status === "REJECTED") return "bg-rose-100 text-rose-900 border-rose-300";
  if (status === "APPROVED") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  return "bg-amber-100 text-amber-900 border-amber-300";
}

export function ExpenseClaims() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [eligibleTps, setEligibleTps] = useState<TourPlan[]>([]);
  const [tpId, setTpId] = useState("");
  const [category, setCategory] = useState<ExpenseClaimCategory>("Travel");
  const [expenseDate, setExpenseDate] = useState("");
  const [amountRs, setAmountRs] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    apiClient.expenseClaims().then((r) => setClaims(r.data)).catch(() => {});
    apiClient.tourPlans().then((r) => {
      const eligible = r.data.filter((tp) => tp.status !== "VOIDED" && tp.status !== "REJECTED");
      setEligibleTps(eligible);
      setTpId((current) => current || eligible[0]?.tpId || "");
    }).catch(() => {});
  }

  useEffect(() => { refresh(); }, []);

  const selectedTp = eligibleTps.find((tp) => tp.tpId === tpId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError(""); setMessage("");
    try {
      if (!tpId) throw new Error("Select a Tour Plan to claim against.");
      const amount = Number(amountRs);
      if (!expenseDate) throw new Error("Expense date is required.");
      if (!amount || amount <= 0) throw new Error("Enter a valid amount.");
      const created = await apiClient.submitExpenseClaim({ tpId, category, expenseDate, amountRs: amount, description: description || undefined });
      setMessage(`Claim ${created.data.claimId} submitted for approval.`);
      setExpenseDate(""); setAmountRs(""); setDescription("");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit expense claim");
    } finally {
      setSubmitting(false);
    }
  }

  const totalAmount = claims.reduce((sum, claim) => sum + claim.amountRs, 0);

  return (
    <section className="space-y-4">
      {/* VOUCHER FORM */}
      <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] space-y-4 relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner border border-emerald-200/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight">New Expense Voucher</h2>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tour Plan Linkage</label>
            <select
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700"
              value={tpId}
              onChange={(e) => setTpId(e.target.value)}
              required
            >
              <option value="" disabled>Select a Tour Plan</option>
              {eligibleTps.map((tp) => (
                <option key={tp.tpId} value={tp.tpId}>{tp.tpId} — {tp.month}</option>
              ))}
            </select>
          </div>

          {selectedTp && (
            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
              GST Branch: <span className="font-bold text-slate-700">{selectedTp.gstBranchName ? `${selectedTp.gstBranchName} — ${selectedTp.gstBranchCode}` : "No specific branch"}</span>
              <br />Routes to {selectedTp.assignedManagerName ?? selectedTp.assignedManager}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expense Type</label>
              <select
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseClaimCategory)}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-700"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Claim Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-700"
                placeholder="0.00"
                value={amountRs}
                onChange={(e) => setAmountRs(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description (Optional)</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700"
              placeholder="Provide context or details about the expense"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

        <div className="pt-2 relative z-10">
          <button
            className="w-full py-3 px-5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 hover:from-emerald-900 hover:to-teal-900 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-900/25 flex items-center justify-center space-x-2 transition-all border border-emerald-600/40 disabled:opacity-70"
            disabled={submitting || !eligibleTps.length}
            type="submit"
          >
            <span>{submitting ? "Submitting…" : "Lodge Expense Claim"}</span>
            <Plus className="w-4 h-4" />
          </button>
          {!eligibleTps.length && (
            <p className="text-[10px] text-center text-slate-500 mt-2">Submit a Tour Plan first — claims are filed against a Tour Plan.</p>
          )}
        </div>
      </form>

      {/* FEED: CLAIMS SUBMITTED */}
      <div className="space-y-3 pt-3">
        <div className="flex items-end justify-between px-1">
          <div>
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">Claims Submitted</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{claims.length} Vouchers Pending or Processed</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Amount</span>
            <p className="text-sm font-black text-emerald-700 tracking-tight">₹{totalAmount.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {claims.length === 0 && <p className="text-sm text-slate-500 italic px-1">No expense claims submitted yet.</p>}

        <div className="space-y-2.5">
          {claims.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-16 bg-slate-50 rounded-bl-full -z-0 opacity-50"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-start space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200/80 shrink-0">
                    <span className="text-[10px] font-black text-slate-700 uppercase leading-none">{new Date(c.expenseDate).getDate()}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase leading-tight">{new Date(c.expenseDate).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">{c.category}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">TP: {c.tpId}</p>
                    {c.description && <p className="text-[10px] text-slate-600 mt-1 italic">{c.description}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-800 tracking-tight">₹{c.amountRs.toLocaleString("en-IN")}</p>
                  <span className={`inline-block mt-1 px-1.5 py-[1px] rounded text-[9px] font-bold uppercase tracking-wider border ${statusBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
              </div>
              {c.status === "REJECTED" && c.rejectReason && (
                <p className="text-[10px] text-rose-600 bg-rose-50 p-2 rounded-lg mt-2 relative z-10">
                  Reason: {c.rejectReason}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
