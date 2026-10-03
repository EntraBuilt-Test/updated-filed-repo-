"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Plus, Save, Search, UserPlus, X } from "lucide-react";
import {
  apiClient,
  type ChemistCallJccRow,
  type ChemistCallPobRow,
  type ChemistCallRcpaRow,
  type ChemistCallShortExpiryRow,
  type FieldChemist,
  type FieldJccColleague,
  type FieldPobProduct
} from "@/lib/api-client";

// Phase 5 — the Chemist Call execution screen (opens once a chemist is
// selected from Today's Campaign). No ChemistCall/RCPA/POB/Short-Expiry/
// JCC backend existed before this phase (confirmed by reading every model
// file); this is the real field-rep UI for the new backend built
// alongside it. Four tabs, one Save persisting all of them as a single
// record (POST /field/chemist-calls, upserted server-side).
type TabKey = "rcpa" | "pob" | "short-expiry" | "jcc";

const TABS: { key: TabKey; label: string }[] = [
  { key: "rcpa", label: "RCPA" },
  { key: "pob", label: "POB" },
  { key: "short-expiry", label: "Short Expiry" },
  { key: "jcc", label: "JCC" }
];

type RcpaRowState = ChemistCallRcpaRow;

export function ChemistCallScreen() {
  const searchParams = useSearchParams();
  const chemistId = searchParams.get("chemistId") || "";

  const [tab, setTab] = useState<TabKey>("rcpa");
  const [chemist, setChemist] = useState<FieldChemist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // RCPA
  const [rcpaRows, setRcpaRows] = useState<RcpaRowState[]>([]);
  const [compPopupIndex, setCompPopupIndex] = useState<number | null>(null);
  const [compBrandInput, setCompBrandInput] = useState("");
  const [compQtyInput, setCompQtyInput] = useState("");

  // POB
  const [pobProducts, setPobProducts] = useState<FieldPobProduct[]>([]);
  const [pobQty, setPobQty] = useState<Record<string, number>>({});
  const [pobSearch, setPobSearch] = useState("");

  // Short Expiry
  const [shortExpiryRows, setShortExpiryRows] = useState<ChemistCallShortExpiryRow[]>([]);

  // Round 36 Item C -- real check-in/out capture for Chemist visits.
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");

  // JCC
  const [colleagues, setColleagues] = useState<FieldJccColleague[]>([]);
  const [jccSelected, setJccSelected] = useState<Record<string, ChemistCallJccRow>>({});
  const [jccSearch, setJccSearch] = useState("");
  const [addingJcc, setAddingJcc] = useState(false);
  const [newJccName, setNewJccName] = useState("");
  const [newJccDesignation, setNewJccDesignation] = useState("");

  useEffect(() => {
    if (!chemistId) { setError("No chemist selected."); setLoading(false); return; }
    setLoading(true);
    setError("");
    Promise.all([
      apiClient.chemists(),
      apiClient.rcpaBrands(),
      apiClient.pobProducts(),
      apiClient.shortExpiryProducts(),
      apiClient.jccColleagues(),
      apiClient.chemistCall(chemistId)
    ])
      .then(([chemistsRes, brandsRes, productsRes, expiryRes, colleaguesRes, callRes]) => {
        const found = chemistsRes.data.find((c) => c.id === chemistId) ?? null;
        setChemist(found);
        setPobProducts(productsRes.data);
        setColleagues(colleaguesRes.data);

        const existing = callRes.data;
        setCheckInTime(existing?.checkInTime || "");
        setCheckOutTime(existing?.checkOutTime || "");
        const existingRcpaByBrand = new Map((existing?.rcpa ?? []).map((r) => [r.brandName, r]));
        setRcpaRows(
          brandsRes.data.map((b): RcpaRowState => {
            const prev = existingRcpaByBrand.get(b.brandName);
            return { brandId: b.id, brandName: b.brandName, myQty: prev?.myQty ?? 0, compBrandName: prev?.compBrandName ?? null, compQty: prev?.compQty ?? null };
          })
        );

        const existingPobByProduct = new Map((existing?.pob ?? []).map((r) => [r.productId, r.qty]));
        setPobQty(Object.fromEntries(productsRes.data.map((p) => [p.id, existingPobByProduct.get(p.id) ?? 0])));

        const existingExpiryByName = new Map((existing?.shortExpiry ?? []).map((r) => [r.medicineName, r]));
        setShortExpiryRows(
          expiryRes.data.map((p): ChemistCallShortExpiryRow => {
            const prev = existingExpiryByName.get(p.medicineName);
            return { medicineName: p.medicineName, expiryDate: prev?.expiryDate ?? p.expiryDate ?? null, qty: prev?.qty ?? 0 };
          })
        );

        const jccMap: Record<string, ChemistCallJccRow> = {};
        for (const row of existing?.jcc ?? []) {
          jccMap[row.employeeCode || row.name] = row;
        }
        setJccSelected(jccMap);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load chemist call data"))
      .finally(() => setLoading(false));
  }, [chemistId]);

  function updateMyQty(index: number, qty: number) {
    setRcpaRows((prev) => prev.map((r, i) => (i === index ? { ...r, myQty: qty } : r)));
  }

  function openCompPopup(index: number) {
    const row = rcpaRows[index];
    setCompBrandInput(row.compBrandName ?? "");
    setCompQtyInput(row.compQty != null ? String(row.compQty) : "");
    setCompPopupIndex(index);
  }

  function submitCompPopup() {
    if (compPopupIndex === null) return;
    const qty = compQtyInput.trim() ? Number(compQtyInput) : null;
    setRcpaRows((prev) => prev.map((r, i) => (i === compPopupIndex ? { ...r, compBrandName: compBrandInput.trim() || null, compQty: qty } : r)));
    setCompPopupIndex(null);
  }

  const filteredPobProducts = useMemo(() => {
    const q = pobSearch.trim().toLowerCase();
    if (!q) return pobProducts;
    return pobProducts.filter((p) => (p.productName || p.name || "").toLowerCase().includes(q) || (p.brandName || "").toLowerCase().includes(q));
  }, [pobProducts, pobSearch]);

  function pobLabel(p: FieldPobProduct) {
    return [p.productName || p.name, p.pack].filter(Boolean).join(" ");
  }

  function updateShortExpiry(index: number, field: "expiryDate" | "qty", value: string) {
    setShortExpiryRows((prev) => prev.map((r, i) => {
      if (i !== index) return r;
      return field === "qty" ? { ...r, qty: Number(value) || 0 } : { ...r, expiryDate: value };
    }));
  }

  const filteredColleagues = useMemo(() => {
    const q = jccSearch.trim().toLowerCase();
    if (!q) return colleagues;
    return colleagues.filter((c) => c.name.toLowerCase().includes(q) || (c.designation || "").toLowerCase().includes(q));
  }, [colleagues, jccSearch]);

  function toggleColleague(c: FieldJccColleague) {
    setJccSelected((prev) => {
      const key = c.employeeCode;
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { employeeCode: c.employeeCode, name: c.name, designation: c.designation };
      return next;
    });
  }

  function addAdHocJcc() {
    if (!newJccName.trim()) return;
    setJccSelected((prev) => ({
      ...prev,
      [`adhoc-${newJccName.trim()}`]: { employeeCode: null, name: newJccName.trim(), designation: newJccDesignation.trim() }
    }));
    setNewJccName(""); setNewJccDesignation(""); setAddingJcc(false);
  }

  async function save() {
    if (!chemistId) return;
    setSaving(true);
    setError("");
    setSaveMessage("");
    try {
      const rcpa = rcpaRows.filter((r) => r.myQty > 0 || r.compQty != null);
      const pob: ChemistCallPobRow[] = pobProducts
        .map((p) => ({ productId: p.id, productName: pobLabel(p) || p.id, qty: pobQty[p.id] ?? 0 }))
        .filter((r) => r.qty > 0);
      const shortExpiry = shortExpiryRows.filter((r) => r.qty > 0);
      const jcc = Object.values(jccSelected);

      await apiClient.saveChemistCall({ chemistId, rcpa, pob, shortExpiry, jcc, checkInTime: checkInTime || undefined, checkOutTime: checkOutTime || undefined });
      setSaveMessage("Chemist Call saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save this Chemist Call");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500 px-1">Loading...</p>;
  if (error && !chemist) return <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>;

  return (
    <div className="space-y-3 pb-24">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card">
        <h2 className="text-sm font-black text-slate-900 truncate">{chemist?.dealerName ?? "Chemist"}</h2>
        <p className="text-[11px] text-slate-500">{[chemist?.city, chemist?.patchName].filter(Boolean).join(" · ")}</p>
        {/* Round 36 Item C -- real check-in/out capture, matching the DCR
            (doctor visit) precedent that already existed. */}
        <div className="flex gap-2 mt-2.5">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Check-in</label>
            <input type="time" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs" />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Check-out</label>
            <input type="time" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className="w-full h-8 px-2 rounded-lg border border-slate-200 text-xs" />
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100/90 rounded-2xl p-1 border border-slate-200/90" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-1.5 text-[11px] rounded-xl font-bold transition-all ${tab === t.key ? "text-white bg-gradient-to-r from-emerald-800 to-teal-800 shadow-md" : "text-slate-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {saveMessage && <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{saveMessage}</p>}

      {tab === "rcpa" && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="grid grid-cols-[1.4fr_0.8fr_1fr_0.4fr] gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
            <span>Brand</span><span>My Qty</span><span>Comp Qty</span><span></span>
          </div>
          <div className="divide-y divide-slate-100">
            {rcpaRows.map((row, i) => (
              <div key={row.brandName} className="grid grid-cols-[1.4fr_0.8fr_1fr_0.4fr] gap-1 items-center px-3 py-2">
                <span className="text-xs font-semibold text-slate-800 truncate">{row.brandName}</span>
                <input
                  type="number" min={0} value={row.myQty}
                  onChange={(e) => updateMyQty(i, Number(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
                />
                <span className="text-[11px] text-slate-600 truncate">
                  {row.compBrandName ? `${row.compBrandName} (${row.compQty ?? 0})` : "—"}
                </span>
                <button type="button" onClick={() => openCompPopup(i)} className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 justify-self-end">
                  <Plus size={13} />
                </button>
              </div>
            ))}
            {rcpaRows.length === 0 && <p className="text-sm text-slate-500 italic px-3 py-4">No brands available.</p>}
          </div>
        </section>
      )}

      {tab === "pob" && (
        <section className="space-y-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={pobSearch}
              onChange={(e) => setPobSearch(e.target.value)}
              placeholder="Search POB Name"
              className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
            />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card divide-y divide-slate-100">
            {filteredPobProducts.slice(0, 200).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-xs font-semibold text-slate-800 truncate">{pobLabel(p) || p.id}</span>
                <input
                  type="number" min={0}
                  value={pobQty[p.id] ?? 0}
                  onChange={(e) => setPobQty((prev) => ({ ...prev, [p.id]: Number(e.target.value) || 0 }))}
                  className="w-20 text-xs border border-slate-300 rounded-lg px-2 py-1.5 text-right"
                />
              </div>
            ))}
            {filteredPobProducts.length === 0 && <p className="text-sm text-slate-500 italic px-3 py-4">No products found.</p>}
          </div>
        </section>
      )}

      {tab === "short-expiry" && (
        <section className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
          <div className="grid grid-cols-[1.4fr_0.9fr_0.6fr] gap-1 px-3 py-2 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
            <span>Name</span><span>Date</span><span>Qty</span>
          </div>
          <div className="divide-y divide-slate-100">
            {shortExpiryRows.map((row, i) => (
              <div key={`${row.medicineName}-${i}`} className="grid grid-cols-[1.4fr_0.9fr_0.6fr] gap-1 items-center px-3 py-2">
                <span className="text-xs font-semibold text-slate-800 truncate">{row.medicineName}</span>
                <input
                  type="date" value={row.expiryDate ?? ""}
                  onChange={(e) => updateShortExpiry(i, "expiryDate", e.target.value)}
                  className="w-full text-[11px] border border-slate-300 rounded-lg px-1.5 py-1.5"
                />
                <input
                  type="number" min={0} value={row.qty}
                  onChange={(e) => updateShortExpiry(i, "qty", e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg px-2 py-1.5"
                />
              </div>
            ))}
            {shortExpiryRows.length === 0 && <p className="text-sm text-slate-500 italic px-3 py-4">No batches nearing expiry.</p>}
          </div>
        </section>
      )}

      {tab === "jcc" && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={jccSearch}
                onChange={(e) => setJccSearch(e.target.value)}
                placeholder="Search JCC"
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
              />
            </div>
            <button type="button" onClick={() => setAddingJcc((v) => !v)} className="px-3 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0">
              <UserPlus size={14} /> JCC
            </button>
          </div>

          {addingJcc && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-card space-y-2">
              <input value={newJccName} onChange={(e) => setNewJccName(e.target.value)} placeholder="Name" className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2" />
              <input value={newJccDesignation} onChange={(e) => setNewJccDesignation(e.target.value)} placeholder="Designation (optional)" className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setAddingJcc(false)} className="flex-1 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">Cancel</button>
                <button type="button" onClick={addAdHocJcc} className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-700 rounded-lg">Add</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card divide-y divide-slate-100">
            {filteredColleagues.map((c) => {
              const checked = Boolean(jccSelected[c.employeeCode]);
              return (
                <button
                  key={c.employeeCode}
                  type="button"
                  onClick={() => toggleColleague(c)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{c.designation}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-md border shrink-0 flex items-center justify-center ${checked ? "bg-emerald-600 border-emerald-600" : "border-slate-300"}`}>
                    {checked && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                </button>
              );
            })}
            {filteredColleagues.length === 0 && <p className="text-sm text-slate-500 italic px-3 py-4">No colleagues found.</p>}
          </div>

          {Object.values(jccSelected).some((r) => !r.employeeCode) && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-card space-y-1.5">
              <p className="text-[11px] font-bold text-slate-600">Added manually</p>
              {Object.entries(jccSelected).filter(([, r]) => !r.employeeCode).map(([key, r]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 font-semibold">{r.name}{r.designation ? ` — ${r.designation}` : ""}</span>
                  <button type="button" onClick={() => setJccSelected((prev) => { const next = { ...prev }; delete next[key]; return next; })} className="text-slate-400">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Comp Qty popup */}
      {compPopupIndex !== null && (
        <div className="fixed inset-0 z-[90] bg-slate-950/70 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Enter Comp Qty</h3>
              <span className="text-[10px] font-bold text-emerald-700 uppercase">+ New</span>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Comp Brand</label>
              <input value={compBrandInput} onChange={(e) => setCompBrandInput(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2" placeholder="Competitor brand name" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Comp Qty</label>
              <input type="number" min={0} value={compQtyInput} onChange={(e) => setCompQtyInput(e.target.value)} className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCompPopupIndex(null)} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl">Cancel</button>
              <button type="button" onClick={submitCompPopup} className="flex-1 py-2 text-xs font-bold text-white bg-emerald-700 rounded-xl">Submit</button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-[70px] left-0 right-0 max-w-md mx-auto px-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Chemist Call"}
        </button>
      </div>
    </div>
  );
}
