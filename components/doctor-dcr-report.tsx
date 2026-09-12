"use client";

// Request C, item 2 — "a new report tab inside the doctor tab ... showcasing
// the details of the Mr dcr exactly." Groups this MR's own DCR history
// (GET /field/dcrs, same data already used by the DCR pages) by doctor, so
// each doctor on the Doctor tab shows every visit logged against them —
// date, status, products detailed and notes — without adding a new backend
// route. Read-only; does not touch DCR submission or approval.
//
// Follow-up — "must be having Visit count like the dropdowns have ... like
// a table visit count and the date." Two counts are shown per doctor now,
// same data sources the rest of the app already uses (no new backend
// routes): the all-time total (visits.length, from GET /field/dcrs — every
// DCR ever logged for this doctor, any status) as a plain badge, and the
// same "this month" colour-coded badge (GREEN/YELLOW/RED, PRD 12.2 soft
// cap) the DCR form's doctor dropdown already shows, from GET
// /field/visit-summary. Each doctor's visits render as an actual table
// (Date / Status / Products / Notes) instead of a bullet list. Because
// `load()` re-fetches all three on every call, hitting Refresh here (or
// switching back into this tab) after submitting a new DCR immediately
// reflects the new visit in both counts and the table — no separate
// "refresh after submit" wiring needed.
import type { DcrExtended, Doctor, VisitSummaryRow } from "@zivira/types";
import { RefreshCw, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "./page-components";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Same colour mapping as the DCR form's doctor dropdown badge.
function monthlyBadgeClass(badge: "GREEN" | "YELLOW" | "RED" | undefined) {
  if (badge === "RED") return "badge badge-danger";
  if (badge === "YELLOW") return "badge badge-warning";
  if (badge === "GREEN") return "badge badge-success";
  return "badge";
}

export function DoctorDcrReport() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [dcrsByDoctor, setDcrsByDoctor] = useState<Record<string, DcrExtended[]>>({});
  const [visitSummaryByDoctor, setVisitSummaryByDoctor] = useState<Record<string, VisitSummaryRow>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [doctorsRes, dcrsRes, visitSummaryRes] = await Promise.all([
        apiClient.doctors(),
        apiClient.dcrs(),
        apiClient.visitSummary()
      ]);
      setDoctors(doctorsRes.data);

      const grouped: Record<string, DcrExtended[]> = {};
      for (const dcr of dcrsRes.data) {
        const doctorId = typeof dcr.doctorId === "string" ? dcr.doctorId : dcr.doctorId?.id;
        if (!doctorId) continue;
        if (!grouped[doctorId]) grouped[doctorId] = [];
        grouped[doctorId].push(dcr);
      }
      // Newest visit first within each doctor's table.
      for (const doctorId of Object.keys(grouped)) {
        grouped[doctorId].sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      }
      setDcrsByDoctor(grouped);

      const summaryByDoctor: Record<string, VisitSummaryRow> = {};
      for (const row of visitSummaryRes.data) summaryByDoctor[row.doctorId] = row;
      setVisitSummaryByDoctor(summaryByDoctor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load DCR report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className="toolbar">
        <button className="button button-secondary" onClick={load} type="button">
          <RefreshCw size={17} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!loading && doctors.length === 0 ? <p className="muted">No doctors assigned yet.</p> : null}
      <div style={{ display: "grid", gap: 12 }}>
        {doctors.map((doctor) => {
          const visits = dcrsByDoctor[doctor.id] ?? [];
          const monthly = visitSummaryByDoctor[doctor.id];
          return (
            <article className="card" key={doctor.id}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <p style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, margin: 0 }}>
                  <Stethoscope size={16} /> {doctor.name}
                  <span className="muted" style={{ fontWeight: 400 }}>· {doctor.specialty}</span>
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="badge">
                    {visits.length} visit{visits.length === 1 ? "" : "s"} total
                  </span>
                  {monthly ? (
                    <span className={monthlyBadgeClass(monthly.badge)}>
                      {monthly.visitCount} visit{monthly.visitCount === 1 ? "" : "s"} this month
                    </span>
                  ) : null}
                </div>
              </div>
              {visits.length === 0 ? (
                <p className="muted">No DCR entries logged for this doctor yet.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr>
                        {["Date", "Status", "Products", "Notes"].map((heading) => (
                          <th
                            key={heading}
                            style={{
                              textAlign: "left",
                              padding: "6px 8px",
                              borderBottom: "1px solid var(--line)",
                              color: "var(--muted)",
                              fontSize: 12,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: 0.3
                            }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((visit) => (
                        <tr key={visit.id}>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--line)", whiteSpace: "nowrap", fontWeight: 700 }}>
                            {formatDate(visit.visitDate)}
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
                            <StatusBadge status={visit.status} />
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
                            {visit.productsDetailed?.length ? visit.productsDetailed.join(", ") : <span className="muted">—</span>}
                          </td>
                          <td style={{ padding: "8px", borderBottom: "1px solid var(--line)" }}>
                            {visit.notes ? visit.notes : <span className="muted">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
