"use client";

import { useState } from "react";
import { TourPlanForm } from "@/components/tour-plan-form";
import { ExpenseClaims } from "@/components/expense-claims";

export default function TourPlanPage() {
  const [activeTab, setActiveTab] = useState<"tour-plan" | "expense-claims">("tour-plan");

  return (
    <div className="space-y-4">
      {/* Segmented Interactive Switcher with Financial counter badge */}
      <div className="sticky top-[60px] z-20 mt-1 p-1 bg-slate-100/90 rounded-2xl flex border border-slate-200/90 shadow-inner backdrop-blur-md" role="tablist">
        <button
          aria-selected={activeTab === "tour-plan"}
          className={`flex-1 py-2 px-3 text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "tour-plan"
              ? "font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md shadow-emerald-950/20"
              : "font-semibold text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("tour-plan")}
          role="tab"
        >
          <svg className={`w-4 h-4 ${activeTab === "tour-plan" ? "text-emerald-300" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>Tour Plan</span>
        </button>
        <button
          aria-selected={activeTab === "expense-claims"}
          className={`flex-1 py-2 px-3 text-xs rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "expense-claims"
              ? "font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md shadow-emerald-950/20"
              : "font-semibold text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("expense-claims")}
          role="tab"
        >
          <svg className={`w-4 h-4 ${activeTab === "expense-claims" ? "text-emerald-300" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
          </svg>
          <span>Expense Claims</span>
        </button>
      </div>

      <div className="pb-10">
        {activeTab === "tour-plan" ? <TourPlanForm switchToExpenses={() => setActiveTab("expense-claims")} /> : <ExpenseClaims />}
      </div>
    </div>
  );
}
