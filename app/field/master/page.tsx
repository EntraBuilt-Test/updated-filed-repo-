"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/page-components";

// Phase 4 — new "Master" top-level nav destination, mirroring the
// reference app's own Master menu group (Customer Master / Inventory /
// E-Detailing Download). Only E-Detailing Download is in scope this
// round; the hub pattern (same as /field/reports) leaves room for the
// others without a nav restructure later.
const MASTER_LINKS = [
  { title: "E-Detailing Download", href: "/field/master/e-detailing", icon: FileText, description: "Browse slide materials uploaded by Admin by brand, and download for offline practice." }
];

export default function MasterHubPage() {
  return (
    <>
      <PageHeader
        eyebrow="Master"
        title="Master"
        description="Reference content Admin manages centrally."
      />
      <div className="space-y-2.5">
        {MASTER_LINKS.map((item) => {
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
