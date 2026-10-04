"use client";

import { useEffect, useState } from "react";
import type { Product } from "@zivira/types";
import { apiClient } from "@/lib/api-client";

// Round 41 -- shared capture widgets for the doctor DCR and the chemist call:
// per-product POB (qty + value), per-product Rx qty, an overall POB amount, and
// the DCR date picker with the "Locked - request release" state.

export type ProductRow = { productCode: string; productName: string; qty: string; valueRs: string };
export const emptyRow = (): ProductRow => ({ productCode: "", productName: "", qty: "", valueRs: "" });

export type CleanPob = { productCode?: string; productName: string; qty: number; valueRs?: number };
export type CleanRx = { productCode?: string; productName: string; qty: number };

function num(label: string, v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${label} must be a number of 0 or more.`);
  return n;
}

// Validates and converts the entered rows; rows left completely blank are ignored.
export function cleanPobRows(rows: ProductRow[]): CleanPob[] {
  const out: CleanPob[] = [];
  for (const r of rows) {
    if (!r.productCode && !r.qty && !r.valueRs) continue;
    if (!r.productCode) throw new Error("Choose a product for every POB row (or clear the row).");
    out.push({ productCode: r.productCode, productName: r.productName, qty: r.qty ? num("POB quantity", r.qty) : 0, ...(r.valueRs ? { valueRs: num("POB value", r.valueRs) } : {}) });
  }
  return out;
}
export function cleanRxRows(rows: ProductRow[]): CleanRx[] {
  const out: CleanRx[] = [];
  for (const r of rows) {
    if (!r.productCode && !r.qty) continue;
    if (!r.productCode) throw new Error("Choose a product for every Rx row (or clear the row).");
    out.push({ productCode: r.productCode, productName: r.productName, qty: r.qty ? num("Rx quantity", r.qty) : 0 });
  }
  return out;
}
export function cleanAmount(v: string): number | undefined {
  return v.trim() === "" ? undefined : num("POB amount", v);
}

const INPUT = "w-full text-xs font-medium text-slate-800 rounded-lg border-slate-200 py-1.5 bg-slate-50/50";

function RowsEditor({ rows, setRows, products, withValue, label }: { rows: ProductRow[]; setRows: (r: ProductRow[]) => void; products: Product[]; withValue: boolean; label: string }) {
  function patch(i: number, p: Partial<ProductRow>) { setRows(rows.map((r, idx) => (idx === i ? { ...r, ...p } : r))); }
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-slate-700 uppercase">{label}</p>
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: withValue ? "2fr 1fr 1fr auto" : "2fr 1fr auto" }}>
          <select className={INPUT} value={r.productCode} onChange={(e) => patch(i, { productCode: e.target.value, productName: products.find((p) => p.code === e.target.value)?.name ?? "" })}>
            <option value="">Product…</option>
            {products.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
          <input className={INPUT} inputMode="decimal" placeholder="Qty" value={r.qty} onChange={(e) => patch(i, { qty: e.target.value })} />
          {withValue && <input className={INPUT} inputMode="decimal" placeholder="Value Rs" value={r.valueRs} onChange={(e) => patch(i, { valueRs: e.target.value })} />}
          <button type="button" aria-label="Remove row" className="text-xs font-bold text-rose-600 px-2" onClick={() => setRows(rows.length > 1 ? rows.filter((_, idx) => idx !== i) : [emptyRow()])}>x</button>
        </div>
      ))}
      <button type="button" className="text-[11px] font-bold text-brand-700" onClick={() => setRows([...rows, emptyRow()])}>+ Add product</button>
    </div>
  );
}

export function PobRxSection({ products, pobRows, setPobRows, rxRows, setRxRows, pobAmount, setPobAmount, showRx = true, heading = "Business (POB) and Rx" }: {
  products: Product[]; pobRows: ProductRow[]; setPobRows: (r: ProductRow[]) => void; rxRows?: ProductRow[]; setRxRows?: (r: ProductRow[]) => void;
  pobAmount: string; setPobAmount: (v: string) => void; showRx?: boolean; heading?: string;
}) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3.5">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">{heading}</h3>
      <RowsEditor rows={pobRows} setRows={setPobRows} products={products} withValue label="POB - product, quantity, value" />
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">Total POB amount (Rs) - optional, used when no per-product value is entered</label>
        <input className={INPUT} inputMode="decimal" placeholder="0" value={pobAmount} onChange={(e) => setPobAmount(e.target.value)} />
      </div>
      {showRx && rxRows && setRxRows && <RowsEditor rows={rxRows} setRows={setRxRows} products={products} withValue={false} label="Rx - prescription quantity per product" />}
    </section>
  );
}

const todayStr = () => new Date().toISOString().slice(0, 10);

// DCR date picker + lock state. Calls onLockedChange(true) when the picked
// date is locked (the form then blocks submit).
export function DcrDateField({ date, setDate, onLockedChange }: { date: string; setDate: (d: string) => void; onLockedChange: (locked: boolean) => void }) {
  const [locks, setLocks] = useState<{ date: string; locked: boolean; releaseRequestedAt: string | null }[]>([]);
  const [delayDays, setDelayDays] = useState(3);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    apiClient.dcrLocks().then((r) => { setLocks(r.data); setDelayDays((r as unknown as { delayDays?: number }).delayDays ?? 3); }).catch(() => setLocks([]));
  }
  useEffect(load, []);

  const lock = locks.find((l) => l.date === date && l.locked);
  useEffect(() => { onLockedChange(Boolean(lock)); }, [lock, onLockedChange]);

  async function request() {
    setBusy(true); setMsg("");
    try { await apiClient.requestDcrRelease(date, note || undefined); setMsg("Release requested. Your manager and admin have been notified."); load(); }
    catch (e) { setMsg(e instanceof Error ? e.message : "Unable to request release"); }
    finally { setBusy(false); }
  }

  const min = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-bold text-slate-700">DCR Date</label>
      <input type="date" value={date} min={min} max={todayStr()} onChange={(e) => setDate(e.target.value)} className="w-full text-xs font-semibold text-slate-800 rounded-xl border-slate-200 py-2 pl-3 bg-slate-50/50" />
      {date !== todayStr() && !lock && <p className="text-[11px] text-slate-500">Back-dated entry for {date}. Dates older than {delayDays} days with no DCR lock automatically.</p>}
      {lock && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 space-y-2 text-xs">
          <p className="font-bold">Locked - request release</p>
          <p>{date} is past the {delayDays}-day reporting window and cannot be submitted until your admin releases it.</p>
          {lock.releaseRequestedAt ? <p className="font-semibold">Release already requested on {lock.releaseRequestedAt.slice(0, 10)}.</p> : (
            <>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (optional)" className="w-full rounded-lg border-rose-200 py-1.5 text-xs bg-white" />
              <button type="button" disabled={busy} onClick={() => void request()} className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg">{busy ? "Sending…" : "Request release"}</button>
            </>
          )}
          {msg && <p className="font-semibold">{msg}</p>}
        </div>
      )}
    </div>
  );
}
