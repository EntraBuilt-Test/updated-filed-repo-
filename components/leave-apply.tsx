
"use client";

import type { LeaveApplication, LeaveReason } from "@zivira/types";
import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function LeaveApply() {
  const [reasons, setReasons] = useState<LeaveReason[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [days, setDays] = useState("1");
  const [duration, setDuration] = useState("full");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [reasonsRes, appsRes] = await Promise.all([apiClient.leaveReasons(), apiClient.leaveApplications()]);
      setReasons(reasonsRes.data);
      if (!reason && reasonsRes.data.length) setReason(reasonsRes.data[0]);
      setApplications(appsRes.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load leave data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDayIncrement = () => {
    const val = parseFloat(days) || 1;
    if (val < 30) setDays(String(val + (duration === 'full' ? 1 : 0.5)));
  };

  const handleDayDecrement = () => {
    const val = parseFloat(days) || 1;
    const step = duration === 'full' ? 1 : 0.5;
    if (val > step) setDays(String(val - step));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setMessage("");

    const parsedDays = Number(days);
    if (!reason) { setError("Please choose a reason for leave."); return; }
    if (reason === "Other" && !customReason.trim()) { setError("Please describe your reason for leave."); return; }
    if (!Number.isFinite(parsedDays) || parsedDays <= 0) { setError("Enter a valid number of days."); return; }

    setSubmitting(true);
    try {
      await apiClient.applyLeave({
        reason,
        customReason: reason === "Other" ? customReason.trim() : undefined,
        days: parsedDays,
        fromDate
      });
      setMessage("Leave submitted for manager approval.");
      setCustomReason("");
      setDays("1");
      await load();
    } catch (submitError) {
      setError(submitError instanceof ApiError ? submitError.message : submitError instanceof Error ? submitError.message : "Unable to submit leave request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11v6m-3-3h6" /></svg>
            New Application Request
          </span>
          <span className="text-[10px] bg-brand-50 text-brand-800 font-bold px-2 py-0.5 rounded border border-brand-200/60">
            Self Service
          </span>
        </div>

        <form onSubmit={submit} className="space-y-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-bold text-slate-800">Reason for leave</label>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Medical slip if &gt;2 days
              </span>
            </div>
            <div className="relative">
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none pr-10"
              >
                {reasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {reason === "Other" && (
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Please specify</label>
              <textarea 
                value={customReason} 
                onChange={e => setCustomReason(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 shadow-2xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none" 
                placeholder="Describe your reason..." 
                rows={2}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">From date</label>
              <input 
                type="date" 
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 tracking-wide" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">To date</label>
              <input 
                type="date" 
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 tracking-wide" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-600">Duration Option</span>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 text-center">
              <button type="button" onClick={() => setDuration('full')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${duration === 'full' ? 'bg-white text-brand-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}>Full Day</button>
              <button type="button" onClick={() => setDuration('first')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${duration === 'first' ? 'bg-white text-brand-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}>First Half</button>
              <button type="button" onClick={() => setDuration('second')} className={`py-1.5 text-xs font-bold rounded-lg transition-colors ${duration === 'second' ? 'bg-white text-brand-900 shadow-xs border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'}`}>Second Half</button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[13px] font-bold text-slate-800">Number of days</label>
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={days}
                readOnly
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-left pl-3" 
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button type="button" onClick={handleDayDecrement} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center text-sm border border-slate-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                </button>
                <button type="button" onClick={handleDayIncrement} className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg flex items-center justify-center text-sm border border-slate-200">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-slate-700">Remarks / Handoff Note (Optional)</label>
            <textarea 
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 shadow-2xs placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none" 
              placeholder="Add brief note for manager..." 
              rows={2}
            ></textarea>
          </div>

          <div className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 leading-none">Medical Proof / Prescription</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PDF or JPG up to 5MB</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-200/60">Upload</span>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">{message}</p>}

          <div className="pt-1">
            <button type="submit" disabled={submitting} className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 hover:from-brand-800 hover:to-brand-800 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all">
              <span>{submitting ? "Submitting..." : "Apply for Leave"}</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Your Leave Requests</h2>
            <p className="text-[11px] text-slate-500 font-normal">Past applications & real-time workflow status</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-bold">
            <button className="px-2 py-0.5 rounded-md bg-white text-slate-900 shadow-2xs">All ({applications.length})</button>
            <button className="px-2 py-0.5 rounded-md text-slate-600 hover:text-slate-900">Approved</button>
          </div>
        </div>

        {applications.map((app) => {
          const isApproved = app.status === 'APPROVED';
          const isPending = app.status === 'PENDING';
          const isRejected = app.status === 'REJECTED';

          const colorTheme = isApproved 
            ? { border: 'border-emerald-200/90 hover:border-emerald-300', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300', lightBg: 'bg-emerald-50/80 border-emerald-100', accent: 'text-emerald-700' }
            : isPending 
              ? { border: 'border-amber-200/90', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', badgeBg: 'bg-amber-50 text-amber-800 border-amber-300', lightBg: 'bg-amber-50/40 border-amber-100', accent: 'text-amber-900' }
              : { border: 'border-rose-200/90', iconBg: 'bg-rose-50', iconColor: 'text-rose-600', badgeBg: 'bg-rose-50 text-rose-800 border-rose-300', lightBg: 'bg-rose-50/80 border-rose-100', accent: 'text-rose-700' };

          return (
            <article key={app.id} className={`bg-white rounded-2xl p-4 border shadow-card space-y-2.5 transition ${colorTheme.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl ${colorTheme.iconBg} flex items-center justify-center ${colorTheme.iconColor}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-[14px] font-extrabold text-slate-900 leading-tight">{app.leaveType}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{app.days > 2 ? 'Extended Leave' : 'Short Leave'}</p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider border uppercase ${colorTheme.badgeBg}`}>
                  {isApproved && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                  {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>}
                  {app.status}
                </span>
              </div>

              <div className={`${colorTheme.lightBg} rounded-xl px-3 py-2 border flex items-center justify-between text-xs`}>
                <div className="text-slate-600 font-medium">
                  <span className="font-bold text-slate-800">{formatDate(app.fromDate)}</span>
                  <span className="text-slate-400 mx-1">—</span>
                  <span className="font-bold text-slate-800">{formatDate(app.toDate)}</span>
                </div>
                <span className={`font-bold ${colorTheme.accent} bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]`}>{app.days} day(s)</span>
              </div>

              <div className="flex items-center justify-between pt-0.5 text-[11px] text-slate-500">
                {isApproved && (
                  <>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-brand-700" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      Approved by <strong className="text-slate-700 font-semibold">{app.approvedByName || 'Manager'}</strong>
                    </span>
                    <button className="text-brand-700 font-bold hover:underline">View Slip</button>
                  </>
                )}
                {isPending && (
                  <>
                    <span className="text-slate-500 font-medium">Routed to Regional Office Review</span>
                    <button className="text-red-600 font-bold hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200/60">Withdraw</button>
                  </>
                )}
                {isRejected && (
                  <>
                    <span className="text-slate-500 font-medium">Rejected: {app.rejectReason}</span>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
