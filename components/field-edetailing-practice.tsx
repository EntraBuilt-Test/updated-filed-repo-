"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, RefreshCw } from "lucide-react";
import { apiClient, type FieldSlideDownload } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Phase 4 — My Activity -> E-Detailing Practice. Lists whatever the rep
// has downloaded from Master -> E-Detailing Download (GET
// /field/slide-downloads), and opens the actual file by re-fetching it
// from the same real slide document via slideId (GET
// /field/slides/:id/download) — the file itself is never duplicated into
// the download-state record, so this always opens the current version.
export function FieldEDetailingPractice() {
  const [downloads, setDownloads] = useState<FieldSlideDownload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    apiClient.slideDownloads()
      .then((r) => setDownloads(r.data))
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load your downloads"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function open(item: FieldSlideDownload) {
    setBusyId(item.id);
    setError("");
    try {
      const url = await apiClient.viewSlideBlobUrl(item.slideId);
      window.open(url, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this file");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-slate-500">Slides you&apos;ve downloaded from Master → E-Detailing Download.</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && downloads.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">Nothing downloaded yet — go to Master → E-Detailing Download to save a brand&apos;s slides for practice.</p>
      )}

      <div className="space-y-2.5">
        {downloads.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={busyId === item.id}
            onClick={() => void open(item)}
            className="w-full text-left bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3 disabled:opacity-60"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{item.brand || item.fileName || "Untitled"}</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                {typeof item.pages === "number" ? `Pages: ${item.pages} · ` : ""}Downloaded {formatDate(item.downloadedAt)}
              </p>
            </div>
            <Eye size={16} className="text-slate-400 shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
}
