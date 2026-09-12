import type { ApiEnvelope, Attendance, DcrExtended, Doctor, FieldDashboard, ManagerDashboard, Employee, Product, VisitSummaryRow, CompanyBranch, TourPlan, TourPlanLocation, ExpenseClaim, ExpenseClaimCategory, GpsLocation, PayrollStatusRecord, DoctorExceptionReason, DoctorVisitException, LeaveApplication, LeaveReason } from "@zivira/types";

// Item 1 — real notification system. Not (yet) part of the shared
// @zivira/types package, so declared locally here — mirrors the shape
// returned by serializeDocument() over the backend's Notice model
// (src/models/notice.model.ts) via GET /field/notices.
export type FieldNotice = {
  id: string;
  title: string;
  message: string;
  audience: "ALL" | "MR" | "MANAGER" | "ADMIN";
  priority: "NORMAL" | "URGENT";
  postedBy?: string | null;
  targetEmployeeCode?: string | null;
  createdAt: string;
};

// Request D, item 4 — every manager who currently has (or has ever had) one
// of this MR's Tour Plans assigned to them, for the Joint Work
// "Accompanying Manager" dropdown. Via GET /field/managers.
export type FieldManager = {
  employeeCode: string;
  name: string;
  designation?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://zivira-labs-backend-1.onrender.com/api";
const TOKEN_KEY = "zivira.field.token";

export function getToken()  { if (typeof window === "undefined") return null; return window.localStorage.getItem(TOKEN_KEY); }
export function setToken(token: string)  { window.localStorage.setItem(TOKEN_KEY, token); }
export function clearToken() { window.localStorage.removeItem(TOKEN_KEY); }

// Carries the backend's optional structured error payload (e.g. the tpId of
// a conflicting Tour Plan) so callers can offer a real next action instead
// of just displaying the message text.
export class ApiError extends Error {
  details?: Record<string, unknown>;
  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
  });
  const payload = await response.json();
  if (!response.ok) throw new ApiError(payload?.error?.message ?? "API request failed", payload?.error?.details);
  return payload as ApiEnvelope<T>;
}

export const apiClient = {
  login(username: string, password: string) {
    return request<{ token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password, portal: "FIELD_FORCE" }) });
  },
  dashboard()  { return request<FieldDashboard>("/field/dashboard"); },
  doctors()    { return request<Doctor[]>("/field/doctors"); },
  managers()   { return request<FieldManager[]>("/field/managers"); },
  // Item — Doctor DCR Report tab needs this MR's FULL visit history (not
  // just the last 30) so every doctor's card shows every visit ever
  // logged against them. Other callers (dashboard "recent activity" etc.)
  // can still pass a smaller limit.
  dcrs(limit?: number) { return request<DcrExtended[]>(`/field/dcrs${limit ? `?limit=${limit}` : "?limit=500"}`); },
  submitDcr(input: {
    doctorId?: string; productsDetailed: string[]; notes?: string;
    callSession?: "MORNING"|"AFTERNOON"|"EVENING"; callTime?: string;
    samplesGiven?: { productName: string; productCode?: string; qty: number; batchNumber?: string; priority?: "HIGH"|"MEDIUM"|"LOW" }[];
    inputsGiven?:  { inputName: string; itemType?: string; qty: number; valueRs?: number }[];
    jointWork?: { accompanyingManager?: string; jointWorkType?: string; managerObservations?: string };
    overrideOverVisitWarning?: boolean;
    // Zivira_Project_Basic.docx Topic 1 — Visit Information / Product Promotion / Doctor Feedback
    checkInTime?: string; checkOutTime?: string; gpsLocation?: GpsLocation;
    hospitalClinic?: string; visitDurationMinutes?: number;
    promotionalMaterialsShared?: string[]; visualAidUsed?: boolean;
    prescriptionInterest?: "HIGH"|"MEDIUM"|"LOW"|"NONE";
    productFeedback?: string; competitorMentioned?: string;
    followUpRequired?: boolean; followUpDate?: string;
  }) {
    return request<DcrExtended>("/field/dcrs", { method: "POST", body: JSON.stringify(input) }) as Promise<ApiEnvelope<DcrExtended> & { overVisitFlag?: boolean; overVisitCount?: number | null }>;
  },
  checkIn(location: { label: string; latitude: number; longitude: number; accuracy: number }) {
    return request<Attendance>("/field/attendance/check-in", { method: "POST", body: JSON.stringify({ location }) });
  },
  checkOut()  { return request<Attendance>("/field/attendance/check-out", { method: "POST" }); },

  // PRD 12.2 — MR-to-Doctor Visit Tracking
  visitSummary(month?: string)      { return request<VisitSummaryRow[]>(`/field/visit-summary${month ? `?month=${month}` : ""}`); },
  unvisitedDoctors(month?: string)  { return request<Doctor[]>(`/field/unvisited-doctors${month ? `?month=${month}` : ""}`); },

  // Zivira_Project_Basic.docx Topic 8 — Doctor Exception Management
  exceptionReasons() { return request<DoctorExceptionReason[]>("/field/exception-reasons"); },
  logDoctorException(input: { doctorId: string; reason: DoctorExceptionReason; notes?: string; month?: string }) {
    return request<DoctorVisitException>("/field/doctor-exceptions", { method: "POST", body: JSON.stringify(input) });
  },

  // PRD 12.3A/B — product + gift-item pickers (no free-text entry allowed)
  products()   { return request<Product[]>("/field/products"); },
  giftItems()  { return request<string[]>("/field/gift-items"); },

  // PRD 12.5 — GST branch lookup for the Tour Plan form
  branches()               { return request<CompanyBranch[]>("/field/branches"); },
  branchLookup(gst: string) { return request<CompanyBranch>(`/field/branches/lookup?gst=${encodeURIComponent(gst)}`); },

  // PRD 12.1 — Tour Plan (submit + view own)
  tourPlans() { return request<TourPlan[]>("/field/tour-plans"); },
  submitTourPlan(input: { month: string; locations: TourPlanLocation[]; gstBranchCode?: string }) {
    return request<TourPlan>("/field/tour-plans", { method: "POST", body: JSON.stringify(input) });
  },
  addTourPlanLocations(tpId: string, locations: TourPlanLocation[]) {
    return request<TourPlan>(`/field/tour-plans/${tpId}/locations`, { method: "PATCH", body: JSON.stringify({ locations }) });
  },

  // Zivira_Project_Basic.docx Topic 3 — Salary Integration Engine (self view)
  payrollStatus(month?: string) {
    return request<PayrollStatusRecord | null>(`/field/payroll-status${month ? `?month=${month}` : ""}`) as Promise<ApiEnvelope<PayrollStatusRecord | null> & { month: string }>;
  },
  submitPayrollExplanation(id: string, explanation: string) {
    return request<PayrollStatusRecord>(`/field/payroll-status/${id}/explanation`, { method: "PATCH", body: JSON.stringify({ explanation }) });
  },

  // Item 1 — real field-force notifications (replaces the static
  // "Notification engine placeholder" copy). `since` (ISO timestamp) lets
  // the notifications page poll for only what's new since its last check.
  notices(since?: string) {
    return request<FieldNotice[]>(`/field/notices${since ? `?since=${encodeURIComponent(since)}` : ""}`);
  },

  // New "Leave Apply" tab — reason dropdown (+ free-text "Other"), days,
  // and own leave history. Submitting notifies the reporting manager
  // (server-side) who approves/rejects it from the Manager portal.
  leaveReasons()        { return request<LeaveReason[]>("/field/leave-reasons"); },
  leaveApplications()   { return request<LeaveApplication[]>("/field/leave-applications"); },
  applyLeave(input: { reason: string; customReason?: string; days: number; fromDate?: string }) {
    return request<LeaveApplication>("/field/leave-applications", { method: "POST", body: JSON.stringify(input) });
  },

  // PRD 12.5 follow-up — Expense Claims linked to a Tour Plan's GST branch
  expenseClaims() { return request<ExpenseClaim[]>("/field/expense-claims"); },
  submitExpenseClaim(input: { tpId: string; category: ExpenseClaimCategory; expenseDate: string; amountRs: number; description?: string }) {
    return request<ExpenseClaim>("/field/expense-claims", { method: "POST", body: JSON.stringify(input) });
  },

  // Manager endpoints (for manager-role field users)
  managerDashboard() { return request<ManagerDashboard>("/manager/dashboard"); },
  managerTeam()      { return request<Employee[]>("/manager/team"); },
  managerDcrs()      { return request<DcrExtended[]>("/manager/dcrs"); },
  getDcrDetail(id: string) { return request<DcrExtended>(`/manager/dcrs/${id}`); },
  approveDcr(id: string) { return request<DcrExtended>(`/manager/dcrs/${id}/approve`, { method: "POST" }); },
  rejectDcr(id: string, reason?: string) { return request<DcrExtended>(`/manager/dcrs/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }); },

  // PRD 12.1 — Manager Tour Plan review / void / reassign / cross-team
  managerTourPlans()        { return request<TourPlan[]>("/manager/tour-plans"); },
  managerTourPlansCrossTeam() { return request<TourPlan[]>("/manager/tour-plans/cross-team"); },
  approveTourPlan(tpId: string) { return request<TourPlan>(`/manager/tour-plans/${tpId}/approve`, { method: "PATCH" }); },
  rejectTourPlan(tpId: string, reason?: string) { return request<TourPlan>(`/manager/tour-plans/${tpId}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }); },
  voidTourPlan(tpId: string, reason: string) { return request<TourPlan>(`/manager/tour-plans/${tpId}/void`, { method: "PATCH", body: JSON.stringify({ reason }) }); },
  reassignTourPlan(tpId: string, reason: string) {
    return request<{ original: TourPlan; created: TourPlan }>(`/manager/tour-plans/${tpId}/reassign`, { method: "POST", body: JSON.stringify({ reason }) });
  },
  managerVisitCoverage(month?: string) {
    return request<{ month: string; mrs: { employeeCode: string; name: string }[]; rows: { doctorId: string; doctorName: string; mappedEmployeeCode?: string; cells: { employeeCode: string; visitCount: number }[] }[] }>(`/manager/visit-coverage${month ? `?month=${month}` : ""}`);
  }
};
