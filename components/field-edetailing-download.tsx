"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Eye, FileText, Search } from "lucide-react";
import { apiClient, type FieldSlide, type FieldSlideDownload } from "@/lib/api-client";

// Phase 4 — Master -> E-Detailing Download. Reuses the exact same real
// collection "My Slides" (Reports, earlier round) already read from
// (GET /field/slides, the admin's own Slide Upload - E-Detailing panel),
// reworked into the reference app's brand-list-with-page-count format:
// a Search Brand Name bar, one row per brand with its page count (only
// ever shown when the admin's upload was a real PDF the backend could
// count pages from — never a faked number) and a download action.
// "Download" here means: fetch the file (view/download both hit the same
// authed blob route) AND record it in the rep's own download-state
// (POST /field/slides/:id/mark-downloaded) so My Activity -> E-Detailing
// Practice knows what's available.
export function FieldEDetailingDownload() {
  const [slides, setSlides] = useState<FieldSlide[]>([]);
  const [downloads, setDownloads] = useState<FieldSlideDownload[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([apiClient.slides(), apiClient.slideDownloads()])
      .then(([slidesRes, downloadsRes]) => {
        setSlides(slidesRes.data);
        setDownloads(downloadsRes.data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load slides"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const downloadedIds = useMemo(() => new Set(downloads.map((d) => d.slideId)), [downloads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slides;
    return slides.filter((s) =>
      (s.brand || "").toLowerCase().includes(q) || (s.fileName || "").toLowerCase().includes(q)
    );
  }, [slides, query]);

  async function view(slide: FieldSlide) {
    setBusyId(slide.id);
    setError("");
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
    setError("");
    try {
      await apiClient.downloadSlide(slide.id, slide.fileName || "slide");
      await apiClient.markSlideDownloaded(slide.id);
      setDownloads((prev) => [
        { id: `local-${slide.id}`, slideId: slide.id, fileName: slide.fileName, division: slide.division, subDivision: slide.subDivision, brand: slide.brand, mimeType: slide.mimeType, pages: slide.pages, downloadedAt: new Date().toISOString() },
        ...prev.filter((d) => d.slideId !== slide.id)
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Brand Name"
          className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
        />
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && filtered.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No slides uploaded by Admin yet.</p>
      )}

      <div className="space-y-2.5">
        {filtered.map((slide) => {
          const isDownloaded = downloadedIds.has(slide.id);
          return (
            <div key={slide.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 truncate flex items-center gap-1.5">
                  {slide.brand || slide.fileName || "Untitled"}
                  {isDownloaded && <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />}
                </h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {typeof slide.pages === "number" ? `Pages: ${slide.pages}` : ""}
                  {typeof slide.pages === "number" && slide.uploadedOn ? " · " : ""}
                  {slide.uploadedOn ? new Date(slide.uploadedOn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </p>
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
          );
        })}
      </div>
    </section>
  );
}
