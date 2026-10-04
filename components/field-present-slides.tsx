"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { apiClient, type FieldSlide, type FieldSlideView } from "@/lib/api-client";
import type { Doctor, Product } from "@zivira/types";

// Round 45 -- "Present slides": the rep picks a listed doctor and a brand's
// slide deck, opens it, and the time on screen is logged as one slide view.
// Feeds Listed Doctor Slide Analysis, Drs Analyis (e-detailing done) and tags
// that doctor's DCR for the day as an E-detailing call.
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export function FieldPresentSlides() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slides, setSlides] = useState<FieldSlide[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [slideId, setSlideId] = useState("");
  const [productName, setProductName] = useState("");
  const [views, setViews] = useState<FieldSlideView[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    apiClient.doctors().then((r) => setDoctors(r.data)).catch(() => setError("Unable to load your doctors"));
    apiClient.slides().then((r) => setSlides(r.data)).catch(() => setError("Unable to load slides"));
    apiClient.products().then((r) => setProducts(r.data)).catch(() => {});
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []);
  const today = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    if (!doctorId) { setViews([]); return; }
    apiClient.slideViews({ doctorId, date: today }).then((r) => setViews(r.data)).catch(() => setViews([]));
  }, [doctorId, today]);

  const slide = slides.find((s) => s.id === slideId);
  const brandProducts = useMemo(() => products.filter((p) => slide?.brand && (p.brandName || "").toLowerCase() === slide.brand.toLowerCase()), [products, slide]);

  async function start() {
    setError(""); setMessage("");
    if (!doctorId || !slide) { setError("Choose a doctor and a slide deck first."); return; }
    try {
      const url = await apiClient.viewSlideBlobUrl(slide.id);
      window.open(url, "_blank");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not open this deck"); return; }
    const t0 = Date.now();
    setStartedAt(t0); setElapsed(0);
    timer.current = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
  }
  async function stop() {
    if (startedAt === null || !slide) return;
    if (timer.current) clearInterval(timer.current);
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    setBusy(true); setError("");
    try {
      await apiClient.logSlideView({ doctorId, slideId: slide.id, brandName: slide.brand || undefined, productName: productName || undefined, startedAt: new Date(startedAt).toISOString(), durationSec });
      setMessage(`Logged ${fmt(durationSec)} on ${slide.brand || slide.fileName || "slides"}.`);
      setViews((await apiClient.slideViews({ doctorId, date: today })).data);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save this presentation"); }
    finally { setBusy(false); setStartedAt(null); setElapsed(0); }
  }

  return (
    <section className="space-y-3">
      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{message}</p>}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-3">
        <label className="block text-xs font-bold text-slate-700">Doctor
          <select className="mt-1 w-full text-xs rounded-xl border-slate-200 p-2.5 bg-slate-50/50" value={doctorId} disabled={startedAt !== null} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="">Select a doctor</option>
            {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} - {d.specialty}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-slate-700">Slide deck
          <select className="mt-1 w-full text-xs rounded-xl border-slate-200 p-2.5 bg-slate-50/50" value={slideId} disabled={startedAt !== null} onChange={(e) => { setSlideId(e.target.value); setProductName(""); }}>
            <option value="">Select a deck</option>
            {slides.map((s) => <option key={s.id} value={s.id}>{s.brand || s.fileName || "Untitled"}</option>)}
          </select>
        </label>
        {brandProducts.length > 0 && (
          <label className="block text-xs font-bold text-slate-700">Product detailed (optional)
            <select className="mt-1 w-full text-xs rounded-xl border-slate-200 p-2.5 bg-slate-50/50" value={productName} disabled={startedAt !== null} onChange={(e) => setProductName(e.target.value)}>
              <option value="">Whole brand</option>
              {brandProducts.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </label>
        )}
        {startedAt === null ? (
          <button type="button" onClick={() => void start()} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white text-xs font-bold rounded-xl py-2.5"><Play size={14} />Open and start timing</button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void stop()} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white text-xs font-bold rounded-xl py-2.5 disabled:opacity-60"><Square size={14} />Stop and save ({fmt(elapsed)})</button>
        )}
      </div>
      {doctorId && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold text-slate-600 px-1">Shown to this doctor today</p>
          {views.length === 0 && <p className="text-xs text-slate-500 italic px-1">Nothing logged yet.</p>}
          {views.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200/90 px-3 py-2 text-xs flex justify-between"><span>{v.productName || v.brandName || "Slides"}</span><span className="text-slate-500">{fmt(v.durationSec)}</span></div>
          ))}
        </div>
      )}
    </section>
  );
}
