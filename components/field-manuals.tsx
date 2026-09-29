"use client";

import { useEffect, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { apiClient, type FieldManual } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Round 18 item 6 — "Manuals". Reads the admin's real User Manual Upload
// collection (GET /field/manuals) — the exact same one Round 17 cleaned
// the fake "Subject 1"/"File Name 1" seeded rows out of, so this always
// shows genuinely uploaded manuals, never placeholders. Download hands
// back the real stored file (same base64 blob the admin's own panel
// writes), not a broken link.
export function FieldManuals() {
  const [manuals, setManuals] = useState<FieldManual[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    apiClient.manuals().then((r) => setManuals(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Unable to load manuals")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function download(manual: FieldManual) {
    setBusyId(manual.id);
    setError("");
    try {
      await apiClient.downloadManual(manual.id, manual.fileName || "manual");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{manuals.length} document(s)</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && manuals.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No manuals uploaded by Admin yet.</p>
      )}

      <div className="space-y-2.5">
        {manuals.map((manual) => (
          <div key={manual.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{manual.subject || manual.fileName || "Manual"}</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{manual.fileName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(manual.uploadedOn)}</p>
            </div>
            <button type="button" disabled={busyId === manual.id} onClick={() => download(manual)} className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shrink-0" aria-label="Download">
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
