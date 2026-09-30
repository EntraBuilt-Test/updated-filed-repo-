"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stethoscope, Pill } from "lucide-react";
import { PageHeader } from "@/components/page-components";
import { CampaignPlanning } from "@/components/campaign-planning";
import { CampaignExecution } from "@/components/campaign-execution";

// Phase 1 of the "Call Manager" reference build — mirrors the reference
// app's own "Campaign" nav group with its two Planning/Execution sub-tabs
// (see the reference screenshot: a Campaign menu expanded to "Campaign
// Planning" and "Campaign Execution"). Same Suspense-wrapped
// useSearchParams() idiom as app/field/tour-plan/page.tsx so a future
// deep-link (e.g. a post-submit redirect) can land on a specific tab.
//
// Post-launch fix — the user's own words: "For the campaign i need to
// choose the doctors in the list, so there is no doctors and no chemist
// for the campaign... if I click the campaign tab, add two tabs Doctor
// and Chemist." Phase 5 already built the chemist flow as a parameterized
// version of this exact Doctor flow (entityType prop, shared
// components/endpoints) but it only ever shipped behind a SEPARATE
// "Chemist" bottom-nav tab (app/field/chemist-campaign) — this was pure
// UI wiring debt, not a missing feature. That separate tab is now removed
// (lib/nav.ts) and its Doctor/Chemist picker is folded into this same
// Campaign screen instead:
//   - Campaign Planning gets a Doctor/Chemist sub-toggle that switches
//     which picker (and which real backend list — GET /field/doctors vs
//     GET /field/chemists) the form shows, via CampaignPlanning's existing
//     entityType prop.
//   - Campaign Execution ("Today's Campaign") defaults to an "All" filter
//     that shows both doctor and chemist planned visits together (both
//     already live in the same CampaignVisitModel), with Doctor/Chemist
//     filter buttons to narrow it — and to actually browse deviations,
//     since an off-plan request needs one concrete type per backend call.
type TabKey = "planning" | "execution";
type EntityType = "doctor" | "chemist";
type ExecFilter = "all" | EntityType;

function EntityToggle({ value, onChange }: { value: EntityType; onChange: (v: EntityType) => void }) {
  return (
    <div className="flex gap-1.5" role="tablist" aria-label="Doctor or Chemist">
      <button
        type="button"
        role="tab"
        aria-selected={value === "doctor"}
        onClick={() => onChange("doctor")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl font-bold transition-all border ${
          value === "doctor"
            ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
            : "bg-white text-slate-600 border-slate-200"
        }`}
      >
        <Stethoscope size={13} /> Doctor
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "chemist"}
        onClick={() => onChange("chemist")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl font-bold transition-all border ${
          value === "chemist"
            ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
            : "bg-white text-slate-600 border-slate-200"
        }`}
      >
        <Pill size={13} /> Chemist
      </button>
    </div>
  );
}

function CampaignPageInner() {
  const searchParams = useSearchParams();
  const initialTab: TabKey = searchParams.get("tab") === "execution" ? "execution" : "planning";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [planEntity, setPlanEntity] = useState<EntityType>("doctor");
  const [execFilter, setExecFilter] = useState<ExecFilter>("all");

  return (
    <>
      <PageHeader
        eyebrow="Campaign"
        title="Campaign Planning & Execution"
        description="Plan which doctors or chemists you'll visit under each active campaign, then track today's planned visits here."
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
        {activeTab === "planning" ? (
          <>
            <EntityToggle value={planEntity} onChange={setPlanEntity} />
            <CampaignPlanning entityType={planEntity} />
          </>
        ) : (
          <>
            <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90" role="tablist" aria-label="Filter by Doctor or Chemist">
              {(["all", "doctor", "chemist"] as ExecFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={execFilter === f}
                  onClick={() => setExecFilter(f)}
                  className={`flex-1 py-1.5 px-3 text-[11px] rounded-xl font-bold transition-all capitalize ${
                    execFilter === f
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </div>
            <CampaignExecution entityType={execFilter} />
          </>
        )}
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
