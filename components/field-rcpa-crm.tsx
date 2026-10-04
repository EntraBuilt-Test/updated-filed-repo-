"use client";

import { useEffect, useState } from "react";
import type { Doctor, Product } from "@zivira/types";
import { apiClient, type CrmEntry, type FieldChemist, type RcpaEntry } from "@/lib/api-client";

// Round 41 -- field entry for doctor RCPA (our vs competitor Rx counts), CRM
// given to a doctor, and the doctor's supportive chemists.
type Tab = "rcpa" | "crm" | "supportive";
const INPUT = "w-full text-xs font-medium text-slate-800 rounded-lg border border-slate-200 py-2 px-2 bg-slate-50/50";
const CARD = "bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-2.5";
const BTN = "px-4 py-2 rounded-xl bg-brand-700 text-white text-xs font-bold disabled:opacity-50";
const today = () => new Date().toISOString().slice(0, 10);
const idOf = (r: { id?: string; _id?: string }) => String(r.id ?? r._id);

export function FieldRcpaCrmScreen() {
  const [tab, setTab] = useState<Tab>("rcpa");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [chemists, setChemists] = useState<FieldChemist[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiClient.doctors().then((r) => setDoctors(r.data)).catch(() => {});
    apiClient.products().then((r) => setProducts(r.data)).catch(() => {});
    apiClient.chemists().then((r) => setChemists(r.data)).catch(() => {});
  }, []);

  const tabBtn = (k: Tab, label: string) => (
    <button key={k} type="button" onClick={() => { setTab(k); setError(""); setMsg(""); }} className={`flex-1 py-2 rounded-lg text-xs font-bold ${tab === k ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>{label}</button>
  );

  return (
    <section className="space-y-3.5">
      <div className="flex gap-1.5">{tabBtn("rcpa", "RCPA")}{tabBtn("crm", "CRM")}{tabBtn("supportive", "Supportive Chemists")}</div>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium">{error}</div>}
      {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium">{msg}</div>}
      {tab === "rcpa" && <RcpaTab doctors={doctors} products={products} chemists={chemists} setError={setError} setMsg={setMsg} />}
      {tab === "crm" && <CrmTab doctors={doctors} setError={setError} setMsg={setMsg} />}
      {tab === "supportive" && <SupportiveTab doctors={doctors} chemists={chemists} setError={setError} setMsg={setMsg} />}
    </section>
  );
}

type TabProps = { setError: (m: string) => void; setMsg: (m: string) => void };

function RcpaTab({ doctors, products, chemists, setError, setMsg }: TabProps & { doctors: Doctor[]; products: Product[]; chemists: FieldChemist[] }) {
  const [rows, setRows] = useState<RcpaEntry[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [chemistId, setChemistId] = useState("");
  const [date, setDate] = useState(today());
  const [ourProduct, setOurProduct] = useState("");
  const [ourQty, setOurQty] = useState("");
  const [compProduct, setCompProduct] = useState("");
  const [compQty, setCompQty] = useState("");
  const [ourPtr, setOurPtr] = useState("");
  const [compName, setCompName] = useState("");
  const [compPtr, setCompPtr] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => { apiClient.rcpaEntries(today().slice(0, 7)).then((r) => setRows(r.data)).catch(() => setRows([])); };
  useEffect(load, []);

  async function save() {
    setError(""); setMsg("");
    const our = Number(ourQty); const comp = compQty.trim() === "" ? undefined : Number(compQty);
    if (!doctorId) { setError("Choose the doctor."); return; }
    if (!ourProduct) { setError("Choose our product."); return; }
    if (!Number.isFinite(our) || our < 0) { setError("Our Rx quantity must be 0 or more."); return; }
    if (comp !== undefined && (!Number.isFinite(comp) || comp < 0)) { setError("Competitor quantity must be 0 or more."); return; }
    const optNum = (v: string) => (v.trim() === "" ? undefined : Number(v));
    const ptr = optNum(ourPtr), cptr = optNum(compPtr);
    if ((ptr !== undefined && (!Number.isFinite(ptr) || ptr < 0)) || (cptr !== undefined && (!Number.isFinite(cptr) || cptr < 0))) { setError("PTR must be 0 or more."); return; }
    setSaving(true);
    try {
      await apiClient.addRcpa({ doctorId, chemistId: chemistId || undefined, date, ourProduct, ourQty: our, ourPtr: ptr, competitorName: compName.trim() || undefined, competitorProduct: compProduct.trim() || undefined, competitorQty: comp, competitorPtr: cptr });
      setOurQty(""); setCompProduct(""); setCompQty(""); setOurPtr(""); setCompName(""); setCompPtr(""); setMsg("RCPA entry saved."); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save RCPA"); }
    finally { setSaving(false); }
  }
  return (
    <>
      <div className={CARD}>
        <select className={INPUT} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}><option value="">Doctor…</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select className={INPUT} value={chemistId} onChange={(e) => setChemistId(e.target.value)}><option value="">Chemist (optional)…</option>{chemists.map((c) => <option key={c.id} value={c.id}>{c.dealerName}</option>)}</select>
        <input type="date" className={INPUT} value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <select className={INPUT} value={ourProduct} onChange={(e) => setOurProduct(e.target.value)}><option value="">Our product…</option>{products.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}</select>
          <input className={INPUT} inputMode="decimal" placeholder="Our Rx qty" value={ourQty} onChange={(e) => setOurQty(e.target.value)} />
        </div>
        <input className={INPUT} inputMode="decimal" placeholder="Our PTR (Rs, optional - master value used if blank)" value={ourPtr} onChange={(e) => setOurPtr(e.target.value)} />
        <input className={INPUT} placeholder="Competitor company (optional)" value={compName} onChange={(e) => setCompName(e.target.value)} />
        <div className="grid grid-cols-[2fr_1fr] gap-2">
          <input className={INPUT} placeholder="Competitor product" value={compProduct} onChange={(e) => setCompProduct(e.target.value)} />
          <input className={INPUT} inputMode="decimal" placeholder="Their Rx qty" value={compQty} onChange={(e) => setCompQty(e.target.value)} />
        </div>
        <input className={INPUT} inputMode="decimal" placeholder="Competitor PTR (Rs, optional)" value={compPtr} onChange={(e) => setCompPtr(e.target.value)} />
        <button type="button" className={BTN} disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save RCPA"}</button>
      </div>
      <div className={CARD}>
        <p className="text-xs font-bold text-slate-900">This month ({rows.length})</p>
        {rows.map((r) => (
          <div key={idOf(r)} className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
            <span><strong>{r.date}</strong> {r.doctorName} - {r.ourProduct} {r.ourQty}{r.competitorProduct ? ` vs ${r.competitorProduct} ${r.competitorQty ?? 0}` : ""}</span>
            <button type="button" className="text-rose-600 font-bold" onClick={() => { void apiClient.deleteRcpa(idOf(r)).then(load).catch((e) => setError(e instanceof Error ? e.message : "Delete failed")); }}>Delete</button>
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-500">No RCPA entries this month.</p>}
      </div>
    </>
  );
}

function CrmTab({ doctors, setError, setMsg }: TabProps & { doctors: Doctor[] }) {
  const [rows, setRows] = useState<CrmEntry[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState(today());
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () => { apiClient.crmEntries(today().slice(0, 7)).then((r) => setRows(r.data)).catch(() => setRows([])); };
  useEffect(load, []);

  async function save() {
    setError(""); setMsg("");
    const amt = Number(amount);
    if (!doctorId) { setError("Choose the doctor."); return; }
    if (!type.trim()) { setError("Enter the CRM type (for example Gift, Conference, Sponsorship)."); return; }
    if (!Number.isFinite(amt) || amt < 0) { setError("Amount must be 0 or more."); return; }
    setSaving(true);
    try {
      await apiClient.addCrm({ doctorId, date, type: type.trim(), amountRs: amt, notes: notes.trim() || undefined });
      setType(""); setAmount(""); setNotes(""); setMsg("CRM entry saved and sent for approval."); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save CRM"); }
    finally { setSaving(false); }
  }
  return (
    <>
      <div className={CARD}>
        <select className={INPUT} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}><option value="">Doctor…</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input type="date" className={INPUT} value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
        <input className={INPUT} placeholder="CRM type (Gift, Conference…)" value={type} onChange={(e) => setType(e.target.value)} />
        <input className={INPUT} inputMode="decimal" placeholder="Amount (Rs)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className={INPUT} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button type="button" className={BTN} disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save CRM"}</button>
      </div>
      <div className={CARD}>
        <p className="text-xs font-bold text-slate-900">This month ({rows.length})</p>
        {rows.map((r) => (
          <div key={idOf(r)} className="flex items-center justify-between text-xs border-t border-slate-100 pt-2">
            <span><strong>{r.date}</strong> {r.doctorName} - {r.type} Rs {r.amountRs} <em>({r.status})</em></span>
            {r.status === "PENDING" && <button type="button" className="text-rose-600 font-bold" onClick={() => { void apiClient.deleteCrm(idOf(r)).then(load).catch((e) => setError(e instanceof Error ? e.message : "Delete failed")); }}>Delete</button>}
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs text-slate-500">No CRM entries this month.</p>}
      </div>
    </>
  );
}

function SupportiveTab({ doctors, chemists, setError, setMsg }: TabProps & { doctors: Doctor[]; chemists: FieldChemist[] }) {
  const [doctorId, setDoctorId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const d = doctors.find((x) => x.id === doctorId);
    setSelected(new Set((d?.supportiveChemists ?? []).map((c) => c.dealerId)));
  }, [doctorId, doctors]);
  function toggle(id: string) { setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  async function save() {
    setError(""); setMsg(""); setSaving(true);
    try { await apiClient.setSupportiveChemists(doctorId, Array.from(selected)); setMsg("Supportive chemists saved."); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save"); }
    finally { setSaving(false); }
  }
  return (
    <div className={CARD}>
      <select className={INPUT} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}><option value="">Doctor…</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
      {doctorId && chemists.map((c) => (
        <label key={c.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} /> {c.dealerName}{c.city ? ` - ${c.city}` : ""}</label>
      ))}
      {doctorId && chemists.length === 0 && <p className="text-xs text-slate-500">No chemists are mapped to you yet.</p>}
      <button type="button" className={BTN} disabled={!doctorId || saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button>
    </div>
  );
}
