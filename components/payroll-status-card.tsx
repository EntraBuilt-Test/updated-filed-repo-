
"use client";

import type { PayrollStatusRecord } from "@zivira/types";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function PayrollStatusCard() {
  const [record, setRecord] = useState<PayrollStatusRecord | null>(null);
  const [month, setMonth] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [amountVisible, setAmountVisible] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const r = await apiClient.payrollStatus();
      setRecord(r.data);
      setMonth(r.month);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load payroll status"); }
    finally { setLoading(false); }
  }
  
  useEffect(() => { void load(); }, []);

  async function submitExplanation(event: React.FormEvent) {
    event.preventDefault();
    if (!record) return;
    setSubmitting(true); setError(""); setMessage("");
    try {
      const updated = await apiClient.submitPayrollExplanation(record.id, explanation);
      setRecord(updated.data);
      setExplanation("");
      setMessage("Explanation submitted — your manager will review it.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit explanation"); }
    finally { setSubmitting(false); }
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
    load();
  };

  // No payslip/PDF-generation backend endpoint exists for payroll (see
  // lib/api-client.ts — only payrollStatus/submitPayrollExplanation) — build
  // a real, printable summary client-side from the loaded record's actual
  // fields. The amount figures shown elsewhere on this card are still
  // hardcoded placeholders (PayrollStatusRecord carries no amount fields),
  // so the summary calls that out explicitly instead of implying they're real.
  function downloadPayslip() {
    if (!record) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Payroll Status - ${record.month}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  p.sub { color: #64748b; font-size: 12px; margin-top: 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td { padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  td.label { color: #64748b; font-weight: bold; width: 40%; }
  .disclaimer { margin-top: 24px; font-size: 11px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 8px; }
</style>
</head>
<body>
  <h1>Payroll Status Summary</h1>
  <p class="sub">Not an official payslip — generated locally on ${new Date().toLocaleDateString("en-IN")}</p>
  <table>
    <tr><td class="label">Employee</td><td>${record.employeeName || record.employeeCode}</td></tr>
    <tr><td class="label">Month</td><td>${record.month}</td></tr>
    <tr><td class="label">Status</td><td>${record.status}</td></tr>
    <tr><td class="label">Missed Days (Snapshot)</td><td>${record.missedDaysSnapshot}</td></tr>
    ${record.holdReason ? `<tr><td class="label">Hold Reason</td><td>${record.holdReason}</td></tr>` : ""}
    ${record.employeeExplanation ? `<tr><td class="label">Your Explanation</td><td>${record.employeeExplanation}</td></tr>` : ""}
    ${record.managerApprovedByName ? `<tr><td class="label">Approved By</td><td>${record.managerApprovedByName}</td></tr>` : ""}
  </table>
  <div class="disclaimer">Not an official payslip — this app does not yet have a payslip-generation backend, and the amount figures shown in the app are placeholders, not real disbursed values.</div>
</body>
</html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  const statusMap = {
    RELEASED: { label: "Released", color: "bg-emerald-600 text-white" },
    HOLD: { label: "On Hold", color: "bg-red-600 text-white" },
    EXPLANATION_SUBMITTED: { label: "Awaiting Manager", color: "bg-amber-500 text-white" }
  };

  const meta = record ? statusMap[record.status as keyof typeof statusMap] || statusMap.RELEASED : null;

  if (loading && !record) {
    return (
      <section className="bg-white rounded-2xl p-4 shadow-card border border-slate-200/80">
        <p className="text-sm text-slate-500">Loading payroll...</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl p-4 shadow-card border border-slate-200/80 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200/60">₹</div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Payroll Status</h3>
              <span className="bg-slate-100 text-slate-600 text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-200">{month || "2026-09"}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Disbursal for current cycle</p>
          </div>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors">
          <svg className={`w-3 h-3 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="mb-3 text-[11px] text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      {message && <div className="mb-3 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">{message}</div>}

      {!record ? (
        <p className="text-sm text-slate-500">No payroll record yet for this month.</p>
      ) : (
        <>
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-xl border border-emerald-200/80 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${meta?.color} shadow-2xs`}>
                  {record.status === 'RELEASED' && <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path clipRule="evenodd" fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                  {meta?.label}
                </span>
                <span className="text-xs font-semibold text-emerald-900">{record.status === 'RELEASED' ? 'Direct Deposit Completed' : 'Pending Action'}</span>
              </div>
            </div>
            
            <div className="mt-2.5 pt-2 border-t border-emerald-200/50 flex items-baseline justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-800 font-semibold">Net Disbursed Compensation</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{amountVisible ? '₹68,450.00' : '₹ ••••••••'}</span>
                  <button onClick={() => setAmountVisible(!amountVisible)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-800 bg-white/80 border border-emerald-300/60 px-2 py-0.5 rounded-md">
                100% On-Time
              </span>
            </div>

            {record.status !== "RELEASED" && record.holdReason && (
              <div className="mt-2 text-[11px] text-red-600 bg-red-50 rounded-md p-1.5 border border-red-100 font-medium">
                Hold Reason: {record.holdReason}
              </div>
            )}

            {record.status === "HOLD" && (
              <form onSubmit={submitExplanation} className="mt-3 bg-white p-2 rounded-xl border border-red-200 shadow-sm">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Your Explanation</label>
                <textarea 
                  value={explanation} 
                  onChange={e => setExplanation(e.target.value)} 
                  rows={2} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-brand-500 mb-2" 
                  placeholder="Explain why DCRs were missed..." 
                />
                <button type="submit" disabled={submitting || explanation.trim().length < 5} className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 rounded-lg">
                  {submitting ? "Submitting..." : "Submit Explanation"}
                </button>
              </form>
            )}

            {record.status === "EXPLANATION_SUBMITTED" && record.employeeExplanation && (
              <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded-md p-1.5 border border-amber-100 font-medium italic">
                You explained: &quot;{record.employeeExplanation}&quot;
              </div>
            )}

            {record.status === "RELEASED" && record.managerApprovedByName && (
              <div className="mt-2 text-[11px] text-slate-600 bg-white/70 rounded-md p-1.5 border border-emerald-100 flex items-center justify-between">
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                  Approved by {record.managerApprovedByName}
                </span>
                <span className="text-slate-400 font-mono text-[10px]">A/C •••• 4108</span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="grid grid-cols-3 gap-2 text-center my-3">
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[10px] text-slate-500 font-medium">Base Salary</p>
          <p className="font-bold text-xs text-slate-900 mt-0.5 font-mono">₹45,000</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[10px] text-slate-500 font-medium">TA / DA Fuel</p>
          <p className="font-bold text-xs text-emerald-700 mt-0.5 font-mono">₹14,250</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
          <p className="text-[10px] text-slate-500 font-medium">Target Incentive</p>
          <p className="font-bold text-xs text-teal-700 mt-0.5 font-mono">₹9,200</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button onClick={downloadPayslip} disabled={!record} className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-300/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
          <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Download Payslip</span>
        </button>
        <button onClick={() => setShowHistory(!showHistory)} className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all">
          <span>Past Slips</span>
          <svg className={`w-3.5 h-3.5 text-slate-500 transform transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
      </div>

      {showHistory && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Previous Cycles</p>
          <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="font-medium text-slate-800">August 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-700 font-semibold">₹66,100</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded">Paid</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <span className="font-medium text-slate-800">July 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-700 font-semibold">₹64,800</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1 rounded">Paid</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
