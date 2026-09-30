"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TourPlanForm } from "@/components/tour-plan-form";
import { ExpenseClaims } from "@/components/expense-claims";
import { FieldCampEntryForm } from "@/components/field-camp-entry";
import { FieldMarketSurveyForm } from "@/components/field-market-survey";

// Round 18 — the Reports hub's "My Expenses" link and the Expense Claim
// success toast both land here with ?tab=expense-claims, so a field rep
// coming from either place sees the claims summary (this IS "My Expenses"
// — see expense-claims.tsx, already a full submission + history view) tab
// pre-selected instead of the Tour Plan form. useSearchParams() requires a
// <Suspense> boundary, hence the wrapper default export below.
//
// Round 19 item 2 — Camp entry and Market Survey entry sit here too, as
// two more sub-tabs alongside Expense Claims, per the coordinator's
// suggested placement ("as sub-tabs the same way Expense Claims sits
// under Tour Plan") rather than adding two more top-level bottom-nav tabs.
type TabKey = "tour-plan" | "expense-claims" | "camp" | "market-survey";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "tour-plan", label: "Tour Plan", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { key: "expense-claims", label: "Expenses", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { key: "camp", label: "Camp", icon: "M12 21v-8m0 0L4.5 9M12 13l7.5-4M12 13V3m-7.5 6L12 5l7.5 4M4.5 9v8L12 21l7.5-4V9" },
  { key: "market-survey", label: "Survey", icon: "M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" }
];

function TourPlanPageInner() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab: TabKey = (TABS.some((t) => t.key === requestedTab) ? requestedTab : "tour-plan") as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <div className="space-y-4">
      {/* Segmented Interactive Switcher */}
      <div className="sticky top-[60px] z-20 mt-1 p-1 bg-slate-100/90 rounded-2xl flex border border-slate-200/90 shadow-inner backdrop-blur-md overflow-x-auto" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            aria-selected={activeTab === tab.key}
            className={`flex-1 py-2 px-2 text-[11px] rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === tab.key
                ? "font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md shadow-emerald-950/20"
                : "font-semibold text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setActiveTab(tab.key)}
            role="tab"
          >
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.key ? "text-emerald-300" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d={tab.icon} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="pb-10 space-y-4">
        {activeTab === "tour-plan" && <TourPlanForm switchToExpenses={() => setActiveTab("expense-claims")} />}
        {activeTab === "expense-claims" && <ExpenseClaims />}
        {activeTab === "camp" && <FieldCampEntryForm />}
        {activeTab === "market-survey" && <FieldMarketSurveyForm />}
      </div>
    </div>
  );
}

export default function TourPlanPage() {
  return (
    <Suspense fallback={null}>
      <TourPlanPageInner />
    </Suspense>
  );
}
