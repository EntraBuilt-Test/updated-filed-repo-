// Round 59 -- display text for a DCR / TP / Leave status cell, built on the shared approvalLabel helper.
// Undecided states keep their existing text; decided ones read "Approved by Admin · 12/10/2026" etc.
import { approvalLabel, approvalDate } from "./approval-label";

const DECIDED = ["MANAGER_APPROVED", "APPROVED", "REJECTED", "CANCELLED"];
type Rec = Record<string, unknown>;
const asRec = (v: unknown): Rec | null => (v && typeof v === "object" ? (v as Rec) : null);
const isDecided = (r: Rec) => DECIDED.includes(String(r.status ?? "").toUpperCase());

export function decidedText(rec: object | null | undefined, fallback: string): string {
  const r = asRec(rec);
  if (!r || !isDecided(r)) return fallback;
  // the server builds statusLabel / statusDate from the stored approval trail (Round 60); fall back to computing it here for older responses
  const label = typeof r.statusLabel === "string" && r.statusLabel ? r.statusLabel : approvalLabel(r);
  const d = r.statusDate ?? approvalDate(r);
  const when = d ? new Date(String(d)) : null;
  return when && !Number.isNaN(when.getTime()) ? `${label} · ${when.toLocaleDateString("en-IN")}` : label;
}

/** The reason / remarks that came with the decision (rejection reason, cancellation reason, approver remarks), or "". */
export function decisionRemarks(rec: object | null | undefined): string {
  const r = asRec(rec);
  if (!r || !isDecided(r)) return "";
  const v = r.statusRemarks ?? asRec(r.approval)?.remarks ?? r.cancelReason ?? r.rejectReason ?? "";
  return String(v).trim();
}

export function historyLines(rec: object | null | undefined): string[] {
  const h = asRec(rec)?.approvalHistory;
  const list: unknown[] = Array.isArray(h) ? h : [];
  return list.map((item) => {
    const x = asRec(item) ?? {};
    const who = x.byRole === "ADMIN" ? "Admin" : x.byRole === "MANAGER" ? `Manager${x.byName ? ` (${String(x.byName)})` : ""}` : String(x.byName ?? "");
    const at = x.at ? new Date(String(x.at)).toLocaleString("en-IN") : "-";
    return `${String(x.action ?? "")} by ${who} on ${at}${x.remarks ? ` - ${String(x.remarks)}` : ""}`;
  });
}
