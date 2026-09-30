"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-components";

// Phase 4 — new "My Activity" top-level nav destination (the reference
// app's own My Activity menu group). Only E-Detailing Practice is in
// scope this round; the hub pattern leaves room for future sub-tabs.
const ACTIVITY_LINKS = [
  { title: "E-Detailing Practice", href: "/field/activity/e-detailing-practice", icon: FileText, description: "Slides you've downloaded for offline practice — tap one to open it." }
];

export default function ActivityHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="My Activity"
        title="My Activity"
        description="Your own practice and activity tracking."
      />
      <div className="space-y-2.5">
        {ACTIVITY_LINKS.map((item) => {
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
