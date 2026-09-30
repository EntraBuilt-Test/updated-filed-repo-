"use client";

// Item 2 — the eye-icon detail/receive screen: each dispatched product
// expands to show Dispatch Quantity (read-only), Received Quantity
// (editable, defaults to dispatch qty), Available Inventory (this rep's
// real running stock from InventoryStockModel, read-only), and a Remarks
// dropdown that becomes required once Received Qty differs from Dispatch
// Qty — exactly the reference screenshots' behavior. Submit persists all
// lines at once via POST /field/dispatches/:id/receive.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Save } from "lucide-react";
import { apiClient, type FieldDispatchDetail, type FieldDispatchItem } from "@/lib/api-client";

const REMARKS_OPTIONS = ["Short Qty Received", "Excess", "Breakage"];

type RowState = { receivedQty: number; remarks: string };

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function FieldInventoryDetail({ dispatchId }: { dispatchId: string }) {
  const router = useRouter();
  const [dispatch, setDispatch] = useState<FieldDispatchDetail | null>(null);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    apiClient.dispatch(dispatchId)
      .then((r) => {
        setDispatch(r.data);
        const initial: Record<string, RowState> = {};
        for (const it of r.data.items) {
          initial[it.code] = { receivedQty: it.receivedQty ?? it.dispatchQty, remarks: it.remarks ?? "" };
        }
        setRows(initial);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load dispatch"))
      .finally(() => setLoading(false));
  }, [dispatchId]);

  function setRow(code: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [code]: { ...prev[code], ...patch } }));
  }

  function remarksMissing(it: FieldDispatchItem): boolean {
    const row = rows[it.code];
    if (!row) return false;
    return row.receivedQty !== it.dispatchQty && !row.remarks;
  }

  async function submit() {
    if (!dispatch) return;
    setError(""); setMessage("");
    for (const it of dispatch.items) {
      if (remarksMissing(it)) {
        setError(`Select a Remarks reason for "${it.name}" — Received Qty differs from Dispatch Qty.`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const items = dispatch.items.map((it) => ({
        code: it.code,
        receivedQty: rows[it.code]?.receivedQty ?? it.dispatchQty,
        remarks: rows[it.code]?.remarks || null
      }));
      await apiClient.receiveDispatch(dispatch.id, items);
      setMessage("Receipt saved.");
      setTimeout(() => router.push("/field/master/inventory"), 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save this receipt");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500 px-1">Loading...</p>;
  if (error && !dispatch) return <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>;
  if (!dispatch) return null;

  return (
    <section className="space-y-3 pb-24">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-slate-900">{dispatch.type === "SAMPLE" ? "Sample" : "Input"} Dispatch</h3>
          <p className="text-[10px] text-slate-500">Dispatched {formatDate(dispatch.dispatchDate)} · Received {formatDate(dispatch.receivedDate)}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
          dispatch.status === "Received" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-800 border-amber-300"
        }`}>
          {dispatch.status}
        </span>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{message}</p>}

      <div className="space-y-2">
        {dispatch.items.map((it) => {
          const row = rows[it.code] ?? { receivedQty: it.dispatchQty, remarks: "" };
          const isOpen = expanded === it.code;
          const mismatch = row.receivedQty !== it.dispatchQty;
          return (
            <div key={it.code} className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : it.code)}
                className="w-full flex items-center justify-between gap-2 p-3.5 text-left"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{it.name}</h4>
                  <p className="text-[10px] text-slate-500">Qty: {it.dispatchQty}</p>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 space-y-2.5 border-t border-slate-100 pt-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Dispatch Qty</label>
                      <input readOnly value={it.dispatchQty} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Received Qty</label>
                      <input
                        type="number"
                        min={0}
                        value={row.receivedQty}
                        onChange={(e) => setRow(it.code, { receivedQty: Math.max(0, Number(e.target.value)) })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Available Inventory</label>
                    <input readOnly value={it.availableInventory} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-500" />
                  </div>
                  {mismatch && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks (required)</label>
                      <select
                        value={row.remarks}
                        onChange={(e) => setRow(it.code, { remarks: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800"
                      >
                        <option value="">— Select —</option>
                        {REMARKS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-[70px] left-0 right-0 px-4">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="w-full py-3 flex items-center justify-center gap-2 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-lg disabled:opacity-60"
          >
            <Save size={16} /> {submitting ? "Saving..." : "Submit"}
          </button>
        </div>
      </div>
    </section>
  );
}
