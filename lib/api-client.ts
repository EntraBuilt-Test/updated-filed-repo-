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

// Round 18 — Field Rep Reports hub. These mirror the shape of
// serializeDocument()/plain generic-master rows returned by the new
// GET /field/slides, /field/manuals, /field/leave-entitlement,
// /field/activity-status, /field/tasks routes (src/routes/field.routes.ts).
// Not (yet) part of @zivira/types, same precedent as FieldNotice/FieldManager
// above — declared locally here.
export type FieldSlide = {
  id: string;
  division?: string | null;
  subDivision?: string | null;
  brand?: string | null;
  fileName?: string | null;
  uploadedOn?: string | null;
  mimeType?: string | null;
  status?: string;
};

export type FieldManual = {
  id: string;
  subject?: string | null;
  fileName?: string | null;
  uploadedOn?: string | null;
  mimeType?: string | null;
  status?: string;
};

// Leave Entitlement - Entry generic-master row, matched to this employee by
// name server-side (see field.routes.ts's nameMatchesEmployee) — it has no
// employeeCode stored on the row itself.
export type FieldLeaveEntitlement = {
  id: string;
  fieldForceName?: string;
  year?: string;
  balanceCl?: number; balancePl?: number; balanceSl?: number; balanceLop?: number;
  cl?: number; pl?: number; sl?: number; lop?: number;
};

// Activity - Status generic-master row, same name-matched pattern.
export type FieldActivityStatus = {
  id: string;
  fieldForceName?: string;
  mode?: string;
  month?: string;
  year?: string;
  activityName?: string;
  status?: "Completed" | "Pending" | string;
};

export type FieldTask = {
  id: string;
  modeOfTask: string;
  priority: "High" | "Medium" | "Low";
  assignedByName?: string | null;
  deadlineFrom?: string | null;
  deadlineTo?: string | null;
  description?: string;
  status: "New" | "Pending" | "Completed" | "Closed" | "ReOpen" | "Hold" | "Cancel";
  createdAt?: string;
};

// Round 19 — My Quizzes. Mirrors GET /field/quizzes (list + this
// employee's attempt summary), GET /field/quizzes/:id (answers stripped,
// for the take-flow), and GET /field/quiz-attempts (full history).
export type FieldQuizSummary = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  questionCount: number;
  totalPossible: number;
  attemptCount: number;
  bestScore: number | null;
  lastAttemptAt?: string | null;
};

export type FieldQuizQuestion = { questionText: string; options: string[]; points: number };
export type FieldQuizDetail = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  questions: FieldQuizQuestion[];
};

export type FieldQuizAttemptResult = {
  id: string;
  quizId: string;
  employeeCode: string;
  answers: { questionIndex: number; selectedOptionIndex: number }[];
  score: number;
  totalPossible: number;
  submittedAt: string;
};

export type FieldQuizAttemptHistory = {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalPossible: number;
  submittedAt: string;
};

// Round 19 — Camp entry (campEntry generic master). organizer is always
// server-forced to the caller's own name; campCode is server-generated.
export type FieldCampEntry = {
  id: string;
  campCode?: string;
  campName?: string;
  campDate?: string;
  hospital?: string;
  doctor?: string;
  organizer?: string;
  noOfPatients?: number;
  productsDisplayed?: string;
  remarks?: string;
  status?: string;
};

// Round 19 — Market Survey entry (marketSurveyEntry generic master).
// hq/patch/chemist are free text (see field.routes.ts comment — no
// field-portal list endpoint exists yet for those master collections).
export type FieldMarketSurveyEntry = {
  id: string;
  surveyDate?: string;
  employee?: string;
  hq?: string;
  patch?: string;
  chemist?: string;
  competitorCompany?: string;
  competitorBrand?: string;
  competitorProduct?: string;
  competitorMrp?: number;
  availability?: "Available" | "Out of Stock" | "Short Supply";
  feedback?: string;
  remarks?: string;
};

// Round 19 — "My Coverage", field-scoped Coverage Analysis 2 row (same
// shape the admin's report returns per employee, via
// computeCoverageAnalysis2()).
export type FieldCoverageTerritory = {
  tc: number; dw: number; met: number; seen: number;
  coverage: number | string; calAvg: number | string; amt: string; amtPerCall: string;
};
export type FieldCoverageRow = {
  empCode: string;
  fieldForceName: string;
  designation: string;
  hq: string;
  ttlDrs: number;
  territoryTypes: Record<"HQ" | "EX" | "OS", FieldCoverageTerritory>;
};

// Phase 1 — Campaign Planning & Execution ("Call Manager" reference
// build). FieldCampaign mirrors the admin's campaignMaster generic-master
// row; FieldCampaignVisit mirrors a real CampaignVisitModel row (see the
// backend model for the schema rationale — a clean employeeCode/doctorId
// FK the later Deviation phase will build on).
export type FieldCampaign = {
  id: string;
  campaignName: string;
  brand?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  status?: string;
};

export type FieldCampaignVisit = {
  id: string;
  campaignId?: string | null;
  campaignName?: string;
  employeeCode: string;
  employeeName?: string;
  doctorId: string;
  doctorName?: string;
  visitDate: string;
  source: "planned" | "deviation";
  status: "Planned" | "Completed" | "Cancelled" | "Pending Approval" | "Rejected";
  deviationType?: string | null;
  rejectReason?: string | null;
  notes?: string;
  createdAt?: string;
};


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://zivira-backend-swagger-ui.onrender.com/api";
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

// Shared by downloadSlide/downloadManual below — same authed-blob pattern
// the Admin portal's apiClient.downloadMasterFile already uses, since these
// field-scoped download routes require the same Bearer token as every
// other /field/* call (a plain <a href> can't carry it).
async function downloadFile(path: string, fileName: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!response.ok) throw new Error("Download failed");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Inline viewing (e.g. a PDF slide opened in a new tab) instead of forcing
// a download — returns an object URL the caller is responsible for
// revoking once done with it.
async function fetchBlobUrl(path: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!response.ok) throw new Error("Could not load file");
  const blob = await response.blob();
  return URL.createObjectURL(blob);
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
  // Phase 2 — "day still open from before" check, called on app load.
  checkoutStatus() {
    return request<{
      blocked: boolean;
      openDate?: string;
      checkInAt?: string;
      outstandingCount?: number;
      outstandingVisits?: { id: string; doctorName?: string }[];
    }>("/field/checkout-status");
  },

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
  },

  // Round 18 — Field Rep Reports hub
  slides(filters?: { division?: string; subDivision?: string; brand?: string }) {
    const qs = filters ? Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join("&") : "";
    return request<FieldSlide[]>(`/field/slides${qs ? `?${qs}` : ""}`);
  },
  downloadSlide(id: string, fileName: string) { return downloadFile(`/field/slides/${id}/download`, fileName); },
  viewSlideBlobUrl(id: string) { return fetchBlobUrl(`/field/slides/${id}/download`); },

  manuals() { return request<FieldManual[]>("/field/manuals"); },
  downloadManual(id: string, fileName: string) { return downloadFile(`/field/manuals/${id}/download`, fileName); },

  leaveEntitlement() { return request<FieldLeaveEntitlement[]>("/field/leave-entitlement"); },

  activityStatus() { return request<FieldActivityStatus[]>("/field/activity-status"); },

  tasks() { return request<FieldTask[]>("/field/tasks"); },
  updateTaskStatus(id: string, status: "Pending" | "Completed") {
    return request<FieldTask>(`/field/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  // Round 19 item 3 — notification unread badge + mark-as-read
  noticesUnreadCount() { return request<{ count: number }>("/field/notices/unread-count"); },
  markNoticesRead() { return request<{ ok: boolean }>("/field/notices/mark-read", { method: "POST" }); },

  // Round 19 item 1 — My Quizzes
  quizzes() { return request<FieldQuizSummary[]>("/field/quizzes"); },
  quiz(id: string) { return request<FieldQuizDetail>(`/field/quizzes/${id}`); },
  submitQuizAttempt(id: string, answers: { questionIndex: number; selectedOptionIndex: number }[]) {
    return request<FieldQuizAttemptResult>(`/field/quizzes/${id}/attempts`, { method: "POST", body: JSON.stringify({ answers }) });
  },
  quizAttempts() { return request<FieldQuizAttemptHistory[]>("/field/quiz-attempts"); },

  // Round 19 item 2 — Camp entry + Market Survey entry
  camps() { return request<FieldCampEntry[]>("/field/camps"); },
  submitCamp(input: { campName: string; campDate: string; hospital?: string; doctor?: string; noOfPatients?: number; productsDisplayed?: string; remarks?: string }) {
    return request<FieldCampEntry>("/field/camps", { method: "POST", body: JSON.stringify(input) });
  },
  marketSurveys() { return request<FieldMarketSurveyEntry[]>("/field/market-surveys"); },
  submitMarketSurvey(input: {
    surveyDate: string; hq?: string; patch?: string; chemist?: string;
    competitorCompany?: string; competitorBrand: string; competitorProduct?: string;
    competitorMrp?: number; availability?: "Available" | "Out of Stock" | "Short Supply";
    feedback?: string; remarks?: string;
  }) {
    return request<FieldMarketSurveyEntry>("/field/market-surveys", { method: "POST", body: JSON.stringify(input) });
  },

  // Round 19 item 4 — My Coverage (field-scoped Coverage Analysis 2)
  coverage(month?: number, year?: number) {
    const qs = [month ? `month=${month}` : "", year ? `year=${year}` : ""].filter(Boolean).join("&");
    return request<FieldCoverageRow | null>(`/field/coverage${qs ? `?${qs}` : ""}`) as Promise<ApiEnvelope<FieldCoverageRow | null> & { month: number; year: number }>;
  },

  // Phase 1 — Campaign Planning & Execution
  campaigns() { return request<FieldCampaign[]>("/field/campaigns"); },
  campaignVisits(date?: string) {
    return request<FieldCampaignVisit[]>(`/field/campaign-visits${date ? `?date=${encodeURIComponent(date)}` : ""}`);
  },
  planCampaignVisit(input: { campaignId: string; doctorId: string; visitDate: string; notes?: string }) {
    return request<FieldCampaignVisit>("/field/campaign-visits", { method: "POST", body: JSON.stringify(input) });
  },
  // Phase 2 — resolve a stranded planned campaign visit (Completed/Cancelled)
  // directly from the Checkout Required screen, when a DCR can't be logged
  // for it any more (DCR always logs "today").
  resolveCampaignVisit(id: string, input: { status: "Completed" | "Cancelled"; notes?: string }) {
    return request<FieldCampaignVisit>(`/field/campaign-visits/${id}/resolve`, { method: "POST", body: JSON.stringify(input) });
  },
  // Phase 3 — deviation workflow (Plan toggle OFF)
  deviationTypes() { return request<string[]>("/field/deviation/types"); },
  deviationTerritories(q?: string) {
    return request<string[]>(`/field/deviation/territories${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  },
  deviationDoctors(territory: string) {
    return request<Doctor[]>(`/field/deviation/doctors?territory=${encodeURIComponent(territory)}`);
  },
  requestDeviationVisit(input: { doctorId: string; deviationType: string; remarks?: string }) {
    return request<FieldCampaignVisit>("/field/deviation-visits", { method: "POST", body: JSON.stringify(input) });
  }
};
