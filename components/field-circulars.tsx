"use client";

import { useEffect, useState } from "react";
import { Download, Megaphone, RefreshCw } from "lucide-react";
import { apiClient, type FieldCircular } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Item 4 (post-launch robustness round) — "Circulars". Reads the admin's
// real File Upload (Designation-wise) collection (GET /field/circulars),
// already filtered server-side to this rep's own designation (or "All"),
// so this always shows only what admin actually targeted at this rep,
// never a fake or unfiltered list. Download hands back the real stored
// file, same base64 blob the admin's own panel writes.
export function FieldCirculars() {
  const [circulars, setCirculars] = useState<FieldCircular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    apiClient.circulars().then((r) => setCirculars(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Unable to load circulars")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function download(circular: FieldCircular) {
    setBusyId(circular.id);
    setError("");
    try {
      await apiClient.downloadCircular(circular.id, circular.fileName || "circular");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{circulars.length} document(s)</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && circulars.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No circulars sent to your designation yet.</p>
      )}

      <div className="space-y-2.5">
        {circulars.map((circular) => (
          <div key={circular.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 shrink-0">
              <Megaphone size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-slate-900 truncate">{circular.subject || circular.fileName || "Circular"}</h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">{circular.fileName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(circular.uploadedOn)}</p>
            </div>
            <button type="button" disabled={busyId === circular.id} onClick={() => download(circular)} className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 shrink-0" aria-label="Download">
              <Download size={16} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
