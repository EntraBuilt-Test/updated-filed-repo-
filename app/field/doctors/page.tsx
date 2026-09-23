
"use client";

import { useState } from "react";
import { DoctorList } from "@/components/doctor-list";
import { DoctorDcrReport } from "@/components/doctor-dcr-report";

export default function DoctorsPage() {
  const [tab, setTab] = useState<"list" | "dcr-report">("list");
  const [reloadSignal, setReloadSignal] = useState(0);
  const [syncing, setSyncing] = useState(false);

  function handleSync() {
    setSyncing(true);
    setReloadSignal((n) => n + 1);
    setTimeout(() => setSyncing(false), 600);
  }

  return (
    <div className="flex-1 px-4 pt-4 pb-24 space-y-4">
      {/* Section Title & Subheading */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zivira-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Territory Directory</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Assigned Doctors</h2>
          <p className="text-xs text-slate-500 font-normal">Mapped to your employee code for monthly call compliance.</p>
        </div>
        {/* Refresh Button */}
        <button
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm active:scale-95 transition-all"
          onClick={handleSync}
        >
          <svg className={`w-3.5 h-3.5 text-slate-600 ${syncing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>Sync</span>
        </button>
      </div>

      {/* Segmented Switcher (Doctor List vs DCR Coverage) */}
      <div className="p-1 bg-slate-200/70 rounded-xl flex items-center font-medium text-xs text-slate-600 mb-2">
        <button 
          onClick={() => setTab("list")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${tab === 'list' ? 'bg-brand-700 text-white font-semibold shadow-sm' : 'hover:text-slate-900'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>Doctor List</span>
        </button>
        <button 
          onClick={() => setTab("dcr-report")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${tab === 'dcr-report' ? 'bg-brand-700 text-white font-semibold shadow-sm' : 'hover:text-slate-900'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>DCR Coverage</span>
        </button>
      </div>

      {tab === "list" ? <DoctorList reloadSignal={reloadSignal} /> : <DoctorDcrReport />}
    </div>
  );
}
