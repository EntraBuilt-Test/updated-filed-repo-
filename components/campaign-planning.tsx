"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Megaphone, Stethoscope } from "lucide-react";
import { apiClient, type FieldCampaign, type FieldCampaignVisit } from "@/lib/api-client";
import type { Doctor } from "@zivira/types";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Phase 1 of the "Call Manager" reference build — Campaign Planning.
// Mirrors the reference app's own two-tab pattern (Planning/Execution):
// this tab lists the real admin-authored campaign catalog
// (GET /field/campaigns), lets the MR pick a campaign + one of their own
// real mapped doctors (GET /field/doctors, the same coverage list every
// other field screen already scopes by) + a date, and submits it as a
// real plan row (POST /field/campaign-visits). The submitted row is what
// Campaign Execution's "Today's Campaign" reads back for today's date.
export function CampaignPlanning() {
  const [campaigns, setCampaigns] = useState<FieldCampaign[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visits, setVisits] = useState<FieldCampaignVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [campaignId, setCampaignId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.all([apiClient.campaigns(), apiClient.doctors(), apiClient.campaignVisits()])
      .then(([campaignsRes, doctorsRes, visitsRes]) => {
        setCampaigns(campaignsRes.data);
        setDoctors(doctorsRes.data);
        setVisits(visitsRes.data);
        if (!campaignId && campaignsRes.data.length) setCampaignId(campaignsRes.data[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load campaign data"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!campaignId) { setError("Please select a campaign."); return; }
    if (!doctorId) { setError("Please select a doctor."); return; }
    setSubmitting(true);
    try {
      await apiClient.planCampaignVisit({ campaignId, doctorId, visitDate, notes: notes.trim() });
      setMessage("Doctor added to your campaign plan.");
      setDoctorId(""); setNotes("");
      load();
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Unable to plan this visit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card space-y-3.5">
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <CalendarPlus size={15} className="text-emerald-700" /> Plan a Campaign Visit
          </span>
        </div>

        {!loading && campaigns.length === 0 && !error && (
          <p className="text-sm text-slate-500 italic px-1">No active campaigns right now — check back once Admin has set one up.</p>
        )}

        {campaigns.length > 0 && (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Campaign</label>
              <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs">
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.campaignName}{c.brand ? ` — ${c.brand}` : ""}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Doctor</label>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs">
                <option value="">— Select doctor —</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Visit Date</label>
              <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold text-slate-700">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-700 shadow-2xs resize-none" />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
            {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded">{message}</p>}
            <button type="submit" disabled={submitting} className="w-full py-3 text-sm font-black text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md disabled:opacity-60">
              {submitting ? "Adding..." : "Add to Campaign Plan"}
            </button>
          </form>
        )}
        {error && campaigns.length === 0 && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      </section>

      <section className="space-y-2.5">
        <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5"><Megaphone size={15} className="text-emerald-700" /> Your Planned Visits ({visits.length})</h2>
        {!loading && visits.length === 0 && <p className="text-sm text-slate-500 italic px-1">No campaign visits planned yet.</p>}
        <div className="space-y-2">
          {visits.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0"><Stethoscope size={14} /></div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">{v.doctorName}</h4>
                    <p className="text-[10px] text-slate-500">{v.campaignName} · {formatDate(v.visitDate)}</p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase border ${
                  v.status === "Completed" ? "bg-emerald-50 text-emerald-800 border-emerald-300" :
                  v.status === "Cancelled" ? "bg-slate-100 text-slate-600 border-slate-300" :
                  v.status === "Pending Approval" ? "bg-sky-50 text-sky-800 border-sky-300" :
                  v.status === "Rejected" ? "bg-rose-50 text-rose-800 border-rose-300" :
                  "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  {v.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
