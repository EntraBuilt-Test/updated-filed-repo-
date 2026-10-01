
"use client";

import { useEffect, useState } from "react";
import { LeaveApply } from "@/components/leave-apply";
import { apiClient, type FieldLeaveEntitlement } from "@/lib/api-client";

// Coordinator follow-up round (Item 3) -- this "Annual Balance Quota" block
// used to be 100% hardcoded static markup (fixed 8.5/12, 4.0/8, 14/18
// numbers that never changed no matter what Admin entered via Leave
// Entitlement - Entry). That was the actual root cause of "doesn't
// reflect" -- the real per-employee entitlement data (GET
// /field/leave-entitlement, the same real collection Admin's "Apply to
// all" bulk-entry writes to) was always available, it just wasn't wired
// to this card UI at all. Now driven by that real data. CL/PL/SL/LOP are
// the real governed categories (see the Leave Setup screen, Item 1); this
// labels them with their plain-English names for the same friendly card
// look the mockup had, rather than fabricating different leave-type names
// (Sick/Casual/Earned) that don't correspond to anything real here.
const QUOTA_CARDS: { key: "Cl" | "Pl" | "Sl" | "Lop"; label: string; caption: string; accent: string; iconBg: string; iconColor: string }[] = [
  { key: "Cl", label: "Casual Leave", caption: "Days Remaining", accent: "bg-blue-500", iconBg: "bg-blue-50", iconColor: "text-blue-600" },
  { key: "Sl", label: "Sick Leave", caption: "Days Available", accent: "bg-emerald-500", iconBg: "bg-emerald-50", iconColor: "text-emerald-700" },
  { key: "Pl", label: "Privilege Leave", caption: "Accrued Balance", accent: "bg-amber-500", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
  { key: "Lop", label: "Loss of Pay", caption: "Days Used (LOP)", accent: "bg-rose-500", iconBg: "bg-rose-50", iconColor: "text-rose-600" }
];

export default function LeavePage() {
  const [entitlement, setEntitlement] = useState<FieldLeaveEntitlement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiClient.leaveEntitlement()
      .then((r) => setEntitlement(r.data[0] ?? null))
      .catch(() => setEntitlement(null))
      .finally(() => setLoaded(true));
  }, []);

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
            Annual Balance Quota {entitlement?.year ? `(${entitlement.year})` : ""}
          </span>
        </div>

        {!loaded ? (
          <p className="text-[11px] text-slate-400 italic px-0.5">Loading your leave balance...</p>
        ) : !entitlement ? (
          <p className="text-[11px] text-slate-500 italic px-0.5 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
            Admin hasn&apos;t set up your Leave Entitlement for this year yet — once they do (Leave Entitlement - Entry), your real balance will show here.
          </p>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
            {QUOTA_CARDS.map((card) => {
              const entitlementRecord = entitlement as unknown as Record<string, number | undefined>;
              const quota = Number(entitlementRecord[card.key.toLowerCase()] ?? 0);
              const balance = Number(entitlementRecord[`balance${card.key}`] ?? quota);
              const pct = quota > 0 ? Math.max(0, Math.min(100, Math.round((balance / quota) * 100))) : 0;
              return (
                <div key={card.key} className="min-w-[130px] bg-white rounded-2xl p-3 text-slate-800 border border-slate-200/90 shadow-card flex flex-col justify-between shrink-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{card.label}</span>
                    <span className={`w-5 h-5 rounded-full ${card.iconBg} flex items-center justify-center ${card.iconColor} text-xs font-bold`}>
                      {card.key}
                    </span>
                  </div>
                  <div className="my-2">
                    <div className="text-xl font-extrabold text-slate-900 leading-none">
                      {balance} <span className="text-xs font-medium text-slate-400">/ {quota}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{card.caption}</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`${card.accent} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <LeaveApply />
    </div>
  );
}
