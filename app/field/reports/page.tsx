"use client";

import Link from "next/link";
import { CheckSquare, FileText, HelpCircle, ListChecks, Megaphone, Receipt, Search, Stethoscope, Target, Tent, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-components";

// Round 18 — "Reports" hub: modeled on sanpharma's own Activity Reports /
// MIS Reports nav pattern (a menu of read-only report screens, each
// scoped to the logged-in employee). Links to genuinely NEW screens
// (Slides, Activity Status, Tasks, Manuals) plus the two existing screens
// that already cover "My Leave" and "My Expenses" (extended in place this
// round with the entitlement balance / kept as-is respectively — see the
// coordinator's "check first, don't duplicate" guidance) and the DCR
// history report that already existed under the Doctors tab.
//
// Round 19 — added My Quizzes (Item 1) and My Coverage (Item 4). Camp and
// Market Survey (Item 2) live as sub-tabs on the Tour Plan screen instead
// (see app/field/tour-plan/page.tsx), so they're linked here via the same
// ?tab= deep-link pattern "My Expenses" already used.
// Phase 4 — "My Slides" moved to Master -> E-Detailing Download (same
// real GET /field/slides collection, reworked into the reference app's
// brand-list-with-page-count format); no longer linked from here.
const REPORT_LINKS = [
  { title: "My Leave", href: "/field/leave", icon: CheckSquare, description: "Leave status history plus your CL / PL / SL / LOP balance." },
  { title: "My Activity Status", href: "/field/reports/activity", icon: ListChecks, description: "Activities tracked against you and their completion state." },
  { title: "My Tasks", href: "/field/reports/tasks", icon: Stethoscope, description: "Tasks your manager or admin assigned to you." },
  { title: "My Quizzes", href: "/field/reports/quizzes", icon: HelpCircle, description: "Take active quizzes assigned by Admin and view your past scores." },
  { title: "My Coverage", href: "/field/reports/coverage", icon: Target, description: "Your doctor coverage and call-average stats by territory type." },
  { title: "My Expenses", href: "/field/tour-plan?tab=expense-claims", icon: Wallet, description: "Your expense claim submissions, amounts and approval status." },
  { title: "Camp Entry", href: "/field/tour-plan?tab=camp", icon: Tent, description: "Log a Camp you organized and view your past camp entries." },
  { title: "Market Survey", href: "/field/tour-plan?tab=market-survey", icon: Search, description: "Log a competitor Market Survey and view your past submissions." },
  { title: "Manuals", href: "/field/reports/manuals", icon: FileText, description: "Reference documents uploaded by Admin — download to view." },
  { title: "Circulars", href: "/field/reports/circulars", icon: Megaphone, description: "Files Admin sent to your designation — download to view." },
  { title: "My DCR History", href: "/field/doctors?tab=dcr-report", icon: Receipt, description: "Every DCR you've ever logged, grouped by doctor." }
];

export default function ReportsHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="My Reports"
        description="Read-only views of your own data from the Activities / Options screens Admin manages."
      />
      <div className="space-y-2.5">
        {REPORT_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-card hover:border-emerald-300 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">{item.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
