
"use client";

import { LeaveApply } from "@/components/leave-apply";

export default function LeavePage() {
  return (
    <div className="flex-1 px-4 pt-3.5 pb-28 space-y-4">
      <section>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 border border-brand-200/70 text-[10px] font-bold tracking-wider text-brand-800 uppercase mb-1">
          <svg className="w-3.5 h-3.5 fill-current text-brand-600" viewBox="0 0 24 24">
            <path d="M12 2L3 6v6.5c0 5.07 3.92 9.85 9 11.5 5.08-1.65 9-6.43 9-11.5V6l-9-4zm-1 14l-4-4 1.41-1.41L11 13.17l6.59-6.59L19 8l-8 8z" />
          </svg>
          Leave & Compliance Hub
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">Leave Apply</h1>
        <p className="text-[12px] text-slate-500 font-normal leading-relaxed mt-0.5">
          Choose a reason, tell us how many days, and submit — your reporting manager gets notified for approval.
        </p>
      </section>

      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
            Annual Balance Quota (2026)
          </span>
          <span className="text-[10px] text-brand-700 font-semibold cursor-pointer hover:underline">Leave Policy</span>
        </div>
        
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
          <div className="min-w-[130px] bg-white rounded-2xl p-3 text-slate-800 border border-emerald-200/60 shadow-card flex flex-col justify-between shrink-0">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Sick Leave</span>
              <span className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 text-xs">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl font-extrabold text-slate-900 leading-none">8.5 <span className="text-xs font-medium text-slate-400">/ 12</span></div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Days Available</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "70%" }}></div>
            </div>
          </div>
          
          <div className="min-w-[130px] bg-white rounded-2xl p-3 text-slate-800 border border-slate-200/90 shadow-card flex flex-col justify-between shrink-0">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Casual Leave</span>
              <span className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl font-extrabold text-slate-900 leading-none">4.0 <span className="text-xs font-medium text-slate-400">/ 8</span></div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Days Remaining</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: "50%" }}></div>
            </div>
          </div>
          
          <div className="min-w-[130px] bg-white rounded-2xl p-3 text-slate-800 border border-slate-200/90 shadow-card flex flex-col justify-between shrink-0">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Earned (EL)</span>
              <span className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </span>
            </div>
            <div className="my-2">
              <div className="text-xl font-extrabold text-slate-900 leading-none">14 <span className="text-xs font-medium text-slate-400">/ 18</span></div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Accrued Carryover</p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: "78%" }}></div>
            </div>
          </div>
        </div>
      </section>

      <LeaveApply />
    </div>
  );
}
