import { DcrForm } from "@/components/dcr-form";

export default function DcrPage() {
  return (
    <main className="max-w-md mx-auto w-full px-3.5 pt-3 space-y-3.5 pb-24">
      {/* Page Title & Progress Pill Header */}
      <section className="px-1 pt-1 flex items-start justify-between">
        <div>
          <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/70">
            Call Reporting
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Daily Call Report (DCR)</h2>
          <p className="text-[12px] text-slate-500 leading-snug">Capture detailing, samples, and sync to territory pipeline.</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs">
            Stop #1
          </span>
          <span className="text-[10px] text-slate-500 font-semibold mt-1">1 of 8 planned</span>
        </div>
      </section>

      <DcrForm />
    </main>
  );
}
