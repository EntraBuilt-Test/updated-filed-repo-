"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileImage, RefreshCw } from "lucide-react";
import { apiClient, type FieldSlide } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Round 18 item 1 — "My Slides". Reuses the admin's real Slide Upload -
// E-Detailing collection (GET /field/slides, scoped read-only) with the
// same Division / Sub Division / Brand filtering shape the admin's own
// View tab uses (that master has no separate Speciality/Therapy fields to
// filter by — see field.routes.ts). "View" opens the real stored file
// inline in a new tab; "Download" saves it, same authed-blob pattern the
// rest of this app already uses for file downloads.
export function FieldSlides() {
  const [slides, setSlides] = useState<FieldSlide[]>([]);
  const [division, setDivision] = useState("");
  const [subDivision, setSubDivision] = useState("");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    apiClient.slides({ division: division || undefined, subDivision: subDivision || undefined, brand: brand || undefined })
      .then((r) => setSlides(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load slides"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const divisions = useMemo(() => Array.from(new Set(slides.map((s) => s.division).filter(Boolean))) as string[], [slides]);
  const subDivisions = useMemo(() => Array.from(new Set(slides.map((s) => s.subDivision).filter(Boolean))) as string[], [slides]);
  const brands = useMemo(() => Array.from(new Set(slides.map((s) => s.brand).filter(Boolean))) as string[], [slides]);

  async function view(slide: FieldSlide) {
    setBusyId(slide.id);
    try {
      const url = await apiClient.viewSlideBlobUrl(slide.id);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open slide");
    } finally {
      setBusyId(null);
    }
  }

  async function download(slide: FieldSlide) {
    setBusyId(slide.id);
    try {
      await apiClient.downloadSlide(slide.id, slide.fileName || "slide");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-card space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <select className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-800" value={division} onChange={(e) => setDivision(e.target.value)}>
            <option value="">All Divisions</option>
            {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-800" value={subDivision} onChange={(e) => setSubDivision(e.target.value)}>
            <option value="">All Sub Divisions</option>
            {subDivisions.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-[11px] font-semibold text-slate-800" value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">All Brands</option>
            {brands.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <button type="button" onClick={load} className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200/70 flex items-center justify-center gap-1.5">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && slides.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No slides uploaded by Admin yet.</p>
      )}

      <div className="space-y-2.5">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
              <FileImage size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{slide.fileName || "Untitled slide"}</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
                {[slide.division, slide.subDivision, slide.brand].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(slide.uploadedOn)}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" disabled={busyId === slide.id} onClick={() => view(slide)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" aria-label="View">
                <Eye size={15} />
              </button>
              <button type="button" disabled={busyId === slide.id} onClick={() => download(slide)} className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800" aria-label="Download">
                <Download size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
