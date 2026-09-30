"use client";

// Item 2 of a post-launch fix round — field-rep Inventory: receiving
// Sample/Input dispatches. Real data source: GET /field/dispatches, now
// actually populated by the admin's Sample/Input Despatch Upload screens
// (previously log-only — see the note on DispatchModel/importDespatchRows
// on the backend). Two real actions per row, matching the reference
// screenshots exactly: a calendar icon (quick Received Date save, no line
// items) and an eye icon (full receive screen with per-item quantities).
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Eye, RefreshCw, X } from "lucide-react";
import { apiClient, type FieldDispatch } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function FieldInventory() {
  const [type, setType] = useState<"INPUT" | "SAMPLE">("SAMPLE");
  const [dispatches, setDispatches] = useState<FieldDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateModalId, setDateModalId] = useState<string | null>(null);
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.dispatches(type)
      .then((r) => setDispatches(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load dispatches"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  const modalDispatch = useMemo(() => dispatches.find((d) => d.id === dateModalId) ?? null, [dispatches, dateModalId]);

  function openDateModal(d: FieldDispatch) {
    setModalError("");
    setReceivedDate(d.receivedDate ? d.receivedDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setDateModalId(d.id);
  }

  async function saveReceivedDate() {
    if (!dateModalId) return;
    setSaving(true);
    setModalError("");
    try {
      await apiClient.setDispatchReceivedDate(dateModalId, receivedDate);
      setDateModalId(null);
      load();
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Unable to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/90" role="tablist">
          {(["SAMPLE", "INPUT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => setType(t)}
              className={`flex-1 py-1.5 px-4 text-xs rounded-xl font-bold transition-all ${
                type === t ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500"
              }`}
            >
              {t === "SAMPLE" ? "Sample" : "Input"}
            </button>
          ))}
        </div>
        <button type="button" onClick={load} className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && dispatches.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No {type === "SAMPLE" ? "Sample" : "Input"} dispatches yet.</p>
      )}

      <div className="space-y-2.5">
        {dispatches.map((d) => {
          const received = formatDate(d.receivedDate);
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900">{d.month} {d.year} Dispatch</h4>
                  <p className="text-[10px] text-slate-500">{d.itemCount} item{d.itemCount === 1 ? "" : "s"} · Dispatched {formatDate(d.dispatchDate)}</p>
                  {received ? (
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Received {received}</p>
                  ) : (
                    <p className="text-[10px] text-amber-700 font-bold mt-0.5">Not yet received</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Set Received Date"
                    aria-label="Set Received Date"
                    onClick={() => openDateModal(d)}
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-600 flex items-center justify-center"
                  >
                    <Calendar size={14} />
                  </button>
                  <Link
                    href={`/field/master/inventory/${d.id}`}
                    title="View / Receive"
                    aria-label="View / Receive"
                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-600 flex items-center justify-center"
                  >
                    <Eye size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalDispatch && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Received Date</h3>
              <button type="button" onClick={() => setDateModalId(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Dispatched Date</label>
              <input readOnly value={formatDate(modalDispatch.dispatchDate) ?? ""} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Received Date</label>
              <input type="date" value={receivedDate} onChange={(e) => setReceivedDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800" />
            </div>
            {modalError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{modalError}</p>}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => setDateModalId(null)} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl disabled:opacity-60">Cancel</button>
              <button type="button" disabled={saving} onClick={() => void saveReceivedDate()} className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
