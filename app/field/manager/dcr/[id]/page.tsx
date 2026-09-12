"use client";
import { ArrowLeft, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

export default function ManagerDcrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [dcr, setDcr] = useState<Record<string, unknown> | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState("");

  useEffect(() => {
    let cancelled = false;
    params.then(p => {
      setId(p.id);
      apiClient.getDcrDetail(p.id)
        .then(r => { if (!cancelled) setDcr(r.data as Record<string, unknown>); })
        .catch(e => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove() {
    try {
      await apiClient.approveDcr(id);
      setMsg("DCR Approved!");
      setTimeout(() => router.push("/field/manager/pending"), 1500);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleReject() {
    if (rejectReason.trim().length < 5) { setError("Rejection reason must be at least 5 characters."); return; }
    try {
      await apiClient.rejectDcr(id, rejectReason);
      setMsg("DCR Rejected.");
      setTimeout(() => router.push("/field/manager/pending"), 1500);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }

  if (loading) return <p className="muted">Loading DCR...</p>;
  if (!dcr) return <p className="form-error">DCR not found</p>;

  const samples = (dcr.samplesGiven as { product: string; qty: number }[]) ?? [];
  const inputs  = (dcr.inputsGiven  as { inputType: string; qty: number }[]) ?? [];
  const joint   = dcr.jointWork as { wasJoint: boolean; managerName: string } | undefined;

  // Request D, item 3 — same relabeling as the MR's Prescription Interest
  // dropdown (dcr-form.tsx): the stored value is still HIGH/MEDIUM/LOW, but
  // managers should see it as Interested/Mid interested/Not interested here too.
  const PRESCRIPTION_INTEREST_LABELS: Record<string, string> = {
    HIGH: "Interested",
    MEDIUM: "Mid interested",
    LOW: "Not interested",
    NONE: "Not interested"
  };

  const field = (label: string, val: unknown) => val ? (
    <div key={label} style={{ marginBottom: 10 }}>
      <p style={{ fontWeight: 600, fontSize: 13, color: "#64748b", marginBottom: 2 }}>{label}</p>
      <p>{String(val)}</p>
    </div>
  ) : null;

  return (
    <>
      <div className="page-header">
        <p className="eyebrow">MANAGER · DCR REVIEW</p>
        <h1 className="page-title">Review DCR</h1>
        <p className="page-description">MR: {dcr.employeeName ? `${dcr.employeeName as string} (${dcr.employeeCode as string})` : dcr.employeeCode as string}</p>
      </div>
      <div className="toolbar">
        <Link href="/field/manager/pending" className="button button-secondary"><ArrowLeft size={17} />Back</Link>
      </div>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="badge" style={{ color: "#15803d" }}>{msg}</p>}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {field("Call Session", dcr.callSession)}
        {field("Call Time", dcr.callTime)}
        {field("Hospital / Clinic", dcr.hospitalClinic)}
        {field("Check-in / Check-out", (dcr.checkInTime || dcr.checkOutTime) ? `${(dcr.checkInTime as string) ?? "—"} to ${(dcr.checkOutTime as string) ?? "—"}${dcr.visitDurationMinutes ? ` (${dcr.visitDurationMinutes} min)` : ""}` : null)}
        {field("Visit Outcome", dcr.visitOutcome)}
        {field("Outcome Notes", dcr.outcomeNotes)}
        {field("Products", (dcr.productsDetailed as string[])?.join(", "))}
        {field("Notes", dcr.notes)}
        {field("Prescription Interest", dcr.prescriptionInterest ? (PRESCRIPTION_INTEREST_LABELS[dcr.prescriptionInterest as string] ?? dcr.prescriptionInterest) : null)}
        {field("Product Feedback", dcr.productFeedback)}
        {field("Competitor Mentioned", dcr.competitorMentioned)}
        {field("Promotional Materials Shared", (dcr.promotionalMaterialsShared as string[])?.join(", "))}
        {field("Visual Aid Used", dcr.visualAidUsed ? "Yes" : null)}
        {field("Follow-up Required", dcr.followUpRequired ? (dcr.followUpDate ? `Yes, by ${new Date(dcr.followUpDate as string).toLocaleDateString()}` : "Yes") : null)}
        {field("Next Follow-up", dcr.nextFollowUpDate ? new Date(dcr.nextFollowUpDate as string).toLocaleDateString() : null)}
        {samples.length > 0 && (
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "#64748b" }}>Samples Given</p>
            {samples.map((s, i) => <p key={i}>{s.product} x {s.qty}</p>)}
          </div>
        )}
        {inputs.length > 0 && (
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: "#64748b" }}>Inputs Given</p>
            {inputs.map((s, i) => <p key={i}>{s.inputType} x {s.qty}</p>)}
          </div>
        )}
        {joint?.wasJoint && field("Joint Visit With", joint.managerName)}
      </div>
      {!showReject ? (
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="button" onClick={handleApprove} style={{ background: "#15803d" }}><Check size={17} />Approve</button>
          <button className="button" onClick={() => setShowReject(true)} style={{ background: "#b91c1c" }}><X size={17} />Reject</button>
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16, borderLeft: "4px solid #b91c1c" }}>
          <p style={{ fontWeight: 600 }}>Rejection Reason (min 5 chars)</p>
          <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
            placeholder="Explain why this DCR is being rejected..."
            style={{ marginTop: 8, width: "100%", padding: 8 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button className="button" onClick={handleReject} style={{ background: "#b91c1c" }}>Confirm Reject</button>
            <button className="button button-secondary" onClick={() => setShowReject(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
