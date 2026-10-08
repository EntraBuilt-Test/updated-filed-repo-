// Round 59 -- display text for a DCR / TP / Leave status cell, built on the shared approvalLabel helper.
// Undecided states keep their existing text; decided ones read "Approved by Admin · 12/10/2026" etc.
import { approvalLabel, approvalDate } from "./approval-label";

const DECIDED = ["MANAGER_APPROVED", "APPROVED", "REJECTED", "CANCELLED"];

export function decidedText(rec: any, fallback: string): string {
  if (!rec || !DECIDED.includes(String(rec.status ?? "").toUpperCase())) return fallback;
  const label = approvalLabel(rec);
  const d = approvalDate(rec);
  const when = d ? new Date(d) : null;
  return when && !Number.isNaN(when.getTime()) ? `${label} · ${when.toLocaleDateString("en-IN")}` : label;
}

export function historyLines(rec: any): string[] {
  const h = Array.isArray(rec?.approvalHistory) ? rec.approvalHistory : [];
  return h.map((x: any) => {
    const who = x.byRole === "ADMIN" ? "Admin" : x.byRole === "MANAGER" ? `Manager${x.byName ? ` (${x.byName})` : ""}` : String(x.byName ?? "");
    const at = x.at ? new Date(x.at).toLocaleString("en-IN") : "-";
    return `${x.action} by ${who} on ${at}${x.remarks ? ` - ${x.remarks}` : ""}`;
  });
}
