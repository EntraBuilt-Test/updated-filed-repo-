"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-components";
import { CampaignPlanning } from "@/components/campaign-planning";
import { CampaignExecution } from "@/components/campaign-execution";

// Phase 1 of the "Call Manager" reference build — mirrors the reference
// app's own "Campaign" nav group with its two Planning/Execution sub-tabs
// (see the reference screenshot: a Campaign menu expanded to "Campaign
// Planning" and "Campaign Execution"). Same Suspense-wrapped
// useSearchParams() idiom as app/field/tour-plan/page.tsx so a future
// deep-link (e.g. a post-submit redirect) can land on a specific tab.
type TabKey = "planning" | "execution";

function CampaignPageInner() {
  const searchParams = useSearchParams();
  const initialTab: TabKey = searchParams.get("tab") === "execution" ? "execution" : "planning";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <>
      <PageHeader
        eyebrow="Campaign"
        title="Campaign Planning & Execution"
        description="Plan which doctors you'll visit under each active campaign, then track today's planned visits here."
      />

      <div className="sticky top-[60px] z-20 mt-1 p-1 bg-slate-100/90 rounded-2xl flex border border-slate-200/90 shadow-inner backdrop-blur-md" role="tablist">
        <button
          aria-selected={activeTab === "planning"}
          className={`flex-1 py-2 px-3 text-xs rounded-xl transition-all font-semibold ${
            activeTab === "planning"
              ? "font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md shadow-emerald-950/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("planning")}
          role="tab"
        >
          Campaign Planning
        </button>
        <button
          aria-selected={activeTab === "execution"}
          className={`flex-1 py-2 px-3 text-xs rounded-xl transition-all font-semibold ${
            activeTab === "execution"
              ? "font-bold text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md shadow-emerald-950/20"
              : "text-slate-600 hover:text-slate-900"
          }`}
          onClick={() => setActiveTab("execution")}
          role="tab"
        >
          Campaign Execution
        </button>
      </div>

      <div className="pb-10 space-y-4 pt-3">
        {activeTab === "planning" ? <CampaignPlanning /> : <CampaignExecution />}
      </div>
    </>
  );
}

export default function CampaignPage() {
  return (
    <Suspense fallback={null}>
      <CampaignPageInner />
    </Suspense>
  );
}
