"use client";

import { useEffect, useState } from "react";
import { Building2, MapPin, Plus, RefreshCw, Store } from "lucide-react";
import { apiClient, type FieldVisitLog } from "@/lib/api-client";
import type { Product } from "@zivira/types";

type VisitKind = "Stockist" | "UnlistedDoctor" | "CIP" | "Hospital";
const VISIT_TYPES: { key: VisitKind; label: string; icon: typeof Store }[] = [
  { key: "Stockist", label: "Stockist", icon: Store },
  { key: "UnlistedDoctor", label: "Unlisted Doctor", icon: Building2 },
  { key: "CIP", label: "CIP", icon: MapPin },
  { key: "Hospital", label: "Hospital", icon: Building2 }
];

// Round 36 Item C — "My Visit Log". Before this round there was genuinely
// no way anywhere in this app for a field rep to log a visit to a
// Stockist, an Unlisted Doctor, or a CIP (Camp/Institution Program) — not
// just no report of it, no capture mechanism at all. This is the real,
// minimal capture screen: pick a type, name the entity, optionally record
// check-in/out times, Save — persisted as a real FieldVisitLogModel row.
export function FieldVisitLogScreen() {
  const [logs, setLogs] = useState<FieldVisitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [visitType, setVisitType] = useState<VisitKind>("Stockist");
  const [entityName, setEntityName] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [notes, setNotes] = useState("");
  // Round 55: products detailed on an Unlisted Doctor visit (multi-select from the product master).
  const [products, setProducts] = useState<Product[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    apiClient.visitLogs()
      .then((r) => setLogs(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load visit log"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { apiClient.products().then((r) => setProducts(r.data)).catch(() => setProducts([])); }, []);
  const toggleProduct = (name: string) => setPicked((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  async function save() {
    if (!entityName.trim()) {
      setSaveError("Enter the name of who you visited.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await apiClient.submitVisitLog({
        visitType,
        entityName: entityName.trim(),
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        notes: notes.trim() || undefined,
        productsDetailed: visitType === "UnlistedDoctor" && picked.length ? picked : undefined
      });
      setPicked([]);
      setEntityName(""); setCheckInTime(""); setCheckOutTime(""); setNotes("");
      setAdding(false);
      load();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unable to save visit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{logs.length} visit(s) logged today</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Log a Visit
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2.5">
          <div className="flex gap-1.5">
            {VISIT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setVisitType(t.key)}
                  className={`flex-1 py-2 rounded-lg border text-[11px] font-bold flex flex-col items-center gap-1 ${
                    visitType === t.key ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
          <input
            type="text"
            placeholder={`${VISIT_TYPES.find((t) => t.key === visitType)?.label} name`}
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs"
          />
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Check-in</label>
              <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Check-out</label>
              <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs" />
            </div>
          </div>
          {visitType === "UnlistedDoctor" && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Products detailed (optional)</label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 p-1.5 grid grid-cols-2 gap-x-2 gap-y-1">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                    <input type="checkbox" checked={picked.includes(p.name)} onChange={() => toggleProduct(p.name)} />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
                {products.length === 0 && <span className="text-[11px] text-slate-400 italic">No products available.</span>}
              </div>
            </div>
          )}
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs"
            rows={2}
          />
          {saveError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{saveError}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
            <button type="button" disabled={saving} onClick={save} className="flex-1 py-2 text-xs font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg disabled:opacity-60">
              {saving ? "Saving..." : "Save Visit"}
            </button>
          </div>
        </div>
      )}

      {!loading && logs.length === 0 && !adding && (
        <p className="text-sm text-slate-500 italic px-1">No visits logged today.</p>
      )}

      <div className="space-y-2">
        {logs.map((l) => (
          <div key={l.id} className="bg-white rounded-xl border border-slate-200/90 p-2.5 flex items-center justify-between text-[11px]">
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">{l.entityName} <span className="text-slate-400 font-semibold">· {l.visitType}</span></p>
              {l.productsDetailed && l.productsDetailed.length > 0 && <p className="text-slate-500 truncate">Products: {l.productsDetailed.join(", ")}</p>}
              {(l.checkInTime || l.checkOutTime) && (
                <p className="text-slate-400">{l.checkInTime || "--:--"} to {l.checkOutTime || "--:--"}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
