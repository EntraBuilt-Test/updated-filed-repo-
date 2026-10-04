import type { ApiEnvelope, Attendance, DcrExtended, Doctor, FieldDashboard, ManagerDashboard, Employee, Product, VisitSummaryRow, CompanyBranch, TourPlan, TourPlanLocation, ExpenseClaim, ExpenseClaimCategory, GpsLocation, PayrollStatusRecord, DoctorExceptionReason, DoctorVisitException, LeaveApplication, LeaveReason } from "@zivira/types";

// Item 1 — real notification system. Not (yet) part of the shared
// @zivira/types package, so declared locally here — mirrors the shape
// returned by serializeDocument() over the backend's Notice model
// (src/models/notice.model.ts) via GET /field/notices.
// Round 36 Item A — the real (not fabricated) client/device signal this
// app can actually observe at submission time: this is a single
// browser-based field-rep web app (no separate native iOS/Android build,
// no distinct "Apps"/"E-detailing" submission surface anywhere in this
// codebase), so the only honest real distinction available is the
// device's own viewport/user-agent at the moment of submission.
// "Apps"/"E-detailing" are therefore structurally unreachable from here
// until such separate flows exist -- not fabricated to look populated.
function detectSubmissionChannel(): "Desktop" | "Mobile" | "Others" {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "Others";
  const ua = navigator.userAgent || "";
  const isMobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const isNarrowViewport = window.innerWidth > 0 && window.innerWidth < 820;
  return (isMobileUa || isNarrowViewport) ? "Mobile" : "Desktop";
}

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
  pages?: number | null;
  status?: string;
};

// Phase 4 — the rep's own download-state for a slide (My Activity ->
// E-Detailing Practice reads this, not the raw slide list).
export type FieldSlideDownload = {
  id: string;
  slideId: string;
  fileName?: string | null;
  division?: string | null;
  subDivision?: string | null;
  brand?: string | null;
  mimeType?: string | null;
  pages?: number | null;
  downloadedAt?: string | null;
};

// Item 2 of a post-launch fix round — field-rep Inventory (receiving
// Sample/Input dispatches). Real data source: the admin's Sample/Input
// Despatch Upload screens now actually populate DispatchModel (they used
// to be log-only), so this is real dispatch data, not a mock.
export type FieldDispatch = {
  id: string;
  type: "INPUT" | "SAMPLE";
  dispatchDate: string;
  month: string;
  year: string;
  itemCount: number;
  receivedDate?: string | null;
  status: "Pending" | "Received";
};

export type FieldDispatchItem = {
  code: string;
  name: string;
  dispatchQty: number;
  receivedQty: number | null;
  remarks: string | null;
  availableInventory: number;
};

export type FieldDispatchDetail = {
  id: string;
  type: "INPUT" | "SAMPLE";
  dispatchDate: string;
  receivedDate?: string | null;
  status: "Pending" | "Received";
  items: FieldDispatchItem[];
};

export type FieldManual = {
  id: string;
  subject?: string | null;
  fileName?: string | null;
  uploadedOn?: string | null;
  mimeType?: string | null;
  status?: string;
};

// Item 4 (post-launch robustness round) -- File Upload (Designation-wise)
// circulars targeted at this rep's designation, same shape as FieldManual.
export type FieldCircular = {
  id: string;
  subject?: string | null;
  fileName?: string | null;
  uploadedOn?: string | null;
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

// Round 36 Item 2 -- My Surveys. Mirrors GET /field/surveys (active,
// in-date-range surveys with real questions resolved + this employee's
// own already-answered flags) and POST /field/surveys/:id/answers.
export type FieldSurveyQuestion = {
  questionId: string;
  questionText: string;
  controlType: "Enterable - Text" | "Enterable - Numeric" | "Selectable - Single" | "Selectable- Multiple";
  maxLength: number | null;
  options: string[] | null;
  answered: boolean;
};
export type FieldSurveySummary = {
  id: string;
  title: string;
  processFromDate: string;
  processToDate: string;
  questionCount: number;
  answeredCount: number;
  questions: FieldSurveyQuestion[];
};

// Round 36 Item C -- My Visit Log (Stockist / Unlisted Doctor / CIP). No
// capture mechanism existed anywhere in the app for these three before
// this round.
export type FieldVisitLog = {
  id: string;
  visitType: "Stockist" | "UnlistedDoctor" | "CIP" | "Hospital";
  entityName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  visitDateOnly: string;
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
  // Phase 5 — chemist campaign visits reuse this exact type; visitType
  // picks which of doctorId/doctorName vs chemistId/chemistName applies.
  visitType?: "doctor" | "chemist";
  doctorId?: string | null;
  doctorName?: string;
  chemistId?: string | null;
  chemistName?: string;
  visitDate: string;
  source: "planned" | "deviation";
  status: "Planned" | "Completed" | "Cancelled" | "Pending Approval" | "Rejected";
  deviationType?: string | null;
  rejectReason?: string | null;
  notes?: string;
  createdAt?: string;
};

// Phase 5 — the real Chemist Master (backend's DealerModel), same shape
// precedent as Doctor above.
export type FieldChemist = {
  id: string;
  dealerName: string;
  city?: string | null;
  patchName?: string | null;
  contactPersonName?: string | null;
  dealerPhone?: string | null;
  status?: string;
};

// Phase 5 — RCPA's Brand column (real ProductBrandModel rows).
export type FieldRcpaBrand = {
  id: string;
  brandName: string;
};

// Phase 5 — POB's product/pack picker (real ProductModel rows, SKU-level).
export type FieldPobProduct = {
  id: string;
  productName?: string | null;
  brandName?: string | null;
  pack?: string | null;
  name?: string | null;
};

// Phase 5 — Short Expiry, seeded from the admin's real rateMaster.
export type FieldShortExpiryProduct = {
  id: string;
  medicineName: string;
  expiryDate?: string | null;
  batchNo?: string | null;
};

// Phase 5 — JCC colleague picker (real Employee collection).
export type FieldJccColleague = {
  employeeCode: string;
  name: string;
  designation?: string;
};

export type ChemistCallRcpaRow = { brandId?: string | null; brandName: string; myQty: number; compBrandName?: string | null; compQty?: number | null };
export type ChemistCallPobRow = { productId: string; productName: string; qty: number; valueRs?: number | null };
export type ChemistCallShortExpiryRow = { medicineName: string; expiryDate?: string | null; qty: number };
export type ChemistCallJccRow = { employeeCode?: string | null; name: string; designation?: string };

export type FieldChemistCall = {
  id: string;
  chemistId: string;
  chemistName?: string;
  visitDate: string;
  visitDateOnly?: string;
  checkInTime?: string | null; // Round 36 Item C
  checkOutTime?: string | null;
  rcpa: ChemistCallRcpaRow[];
  pob: ChemistCallPobRow[];
  pobAmountRs?: number | null;
  shortExpiry: ChemistCallShortExpiryRow[];
  jcc: ChemistCallJccRow[];
  status?: string;
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

// Round 39 item 1 -- every API call now has a hard timeout and a readable
// error, so a cold/unreachable backend can never leave a button spinning
// forever (previously: no timeout at all, and a non-JSON 502 from the
// host's proxy threw a cryptic "Unexpected token <").
const REQUEST_TIMEOUT_MS = 30000;
async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: init.signal ?? controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The server is taking too long to respond (it may be waking up). Please try again in a moment.");
    }
    throw new Error("Cannot reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}
async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    throw new Error(`The server returned an unexpected response (${response.status}). It may be restarting -- please retry.`);
  }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const token = getToken();
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
  });
  const payload = await readJson(response);
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

export type RcpaEntry = { id?: string; _id?: string; doctorId: string; doctorName?: string; chemistName?: string; date: string; ourProduct: string; ourQty: number; competitorProduct?: string; competitorQty?: number };
export type CrmEntry = { id?: string; _id?: string; doctorId: string; doctorName?: string; date: string; type: string; amountRs: number; status: string; notes?: string };

export const apiClient = {
  // Round 39 item 1 -- fired when a login page opens so a sleeping backend
  // starts waking while the user types credentials.
  warmUp() { return fetch(`${API_BASE_URL}/health`, { cache: "no-store" }).catch(() => undefined); },
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
  // ── Round 41 -- DCR locks, RCPA, CRM, supportive chemists ──────────────
  dcrLocks() { return request<{ date: string; locked: boolean; reason: string; releasedAt: string | null; releaseRequestedAt: string | null }[]>("/field/dcr-locks"); },
  requestDcrRelease(date: string, note?: string) { return request<{ requested: boolean; date: string }>("/field/dcr-locks/request-release", { method: "POST", body: JSON.stringify({ date, note }) }); },
  rcpaEntries(month?: string) { return request<RcpaEntry[]>(`/field/rcpa${month ? `?month=${month}` : ""}`); },
  addRcpa(input: { doctorId: string; chemistId?: string; date?: string; ourProduct: string; ourQty: number; competitorProduct?: string; competitorQty?: number }) {
    return request<RcpaEntry>("/field/rcpa", { method: "POST", body: JSON.stringify(input) });
  },
  deleteRcpa(id: string) { return request<{ deleted: boolean }>(`/field/rcpa/${id}`, { method: "DELETE" }); },
  crmEntries(month?: string) { return request<CrmEntry[]>(`/field/crm${month ? `?month=${month}` : ""}`); },
  addCrm(input: { doctorId: string; date?: string; type: string; amountRs: number; notes?: string }) {
    return request<CrmEntry>("/field/crm", { method: "POST", body: JSON.stringify(input) });
  },
  deleteCrm(id: string) { return request<{ deleted: boolean }>(`/field/crm/${id}`, { method: "DELETE" }); },
  setSupportiveChemists(doctorId: string, dealerIds: string[]) {
    return request<{ id: string }>(`/field/doctors/${doctorId}/supportive-chemists`, { method: "PUT", body: JSON.stringify({ dealerIds }) });
  },
  deleteDcr(id: string) { return request<{ deleted: boolean; id: string }>(`/field/dcrs/${id}`, { method: "DELETE" }); },
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
    // Round 41 -- real POB / Rx capture and back-dated DCR date
    pob?: { productCode?: string; productName: string; qty: number; valueRs?: number }[];
    pobAmountRs?: number;
    rxItems?: { productCode?: string; productName: string; qty: number }[];
    visitDate?: string;
    // Round 36 Item A — real client-detected submission channel; callers
    // don't need to pass this, detectSubmissionChannel() below fills it in.
    submissionChannel?: "Desktop" | "Mobile" | "Apps" | "E-detailing" | "Others";
  }) {
    const body = { submissionChannel: detectSubmissionChannel(), ...input };
    return request<DcrExtended>("/field/dcrs", { method: "POST", body: JSON.stringify(body) }) as Promise<ApiEnvelope<DcrExtended> & { overVisitFlag?: boolean; overVisitCount?: number | null }>;
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
  deleteTourPlan(tpId: string) {
    return request<{ deleted: boolean; tpId: string }>(`/field/tour-plans/${tpId}`, { method: "DELETE" });
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
  deleteLeaveApplication(id: string) { return request<{ deleted: boolean; id: string }>(`/field/leave-applications/${id}`, { method: "DELETE" }); },

  // PRD 12.5 follow-up — Expense Claims linked to a Tour Plan's GST branch
  expenseClaims() { return request<ExpenseClaim[]>("/field/expense-claims"); },
  submitExpenseClaim(input: { tpId: string; category: ExpenseClaimCategory; expenseDate: string; amountRs: number; territoryType?: "HQ" | "EX" | "OS"; description?: string }) {
    return request<ExpenseClaim>("/field/expense-claims", { method: "POST", body: JSON.stringify(input) });
  },
  deleteExpenseClaim(claimId: string) { return request<{ deleted: boolean; claimId: string }>(`/field/expense-claims/${claimId}`, { method: "DELETE" }); },

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
  // Phase 4 — records the slide as downloaded for this rep (My Activity ->
  // E-Detailing Practice); does not itself fetch the file bytes twice.
  markSlideDownloaded(id: string) {
    return request<FieldSlideDownload>(`/field/slides/${id}/mark-downloaded`, { method: "POST" });
  },
  slideDownloads() { return request<FieldSlideDownload[]>("/field/slide-downloads"); },

  // Item 2 — field-rep Inventory (receiving Sample/Input dispatches).
  dispatches(type?: "INPUT" | "SAMPLE") {
    return request<FieldDispatch[]>(`/field/dispatches${type ? `?type=${type}` : ""}`);
  },
  dispatch(id: string) { return request<FieldDispatchDetail>(`/field/dispatches/${id}`); },
  setDispatchReceivedDate(id: string, receivedDate: string) {
    return request<{ id: string; receivedDate: string }>(`/field/dispatches/${id}/received-date`, {
      method: "POST", body: JSON.stringify({ receivedDate })
    });
  },
  receiveDispatch(id: string, items: { code: string; receivedQty: number; remarks?: string | null }[]) {
    return request<FieldDispatchDetail>(`/field/dispatches/${id}/receive`, {
      method: "POST", body: JSON.stringify({ items })
    });
  },

  manuals() { return request<FieldManual[]>("/field/manuals"); },
  downloadManual(id: string, fileName: string) { return downloadFile(`/field/manuals/${id}/download`, fileName); },

  // Item 4 (post-launch robustness round)
  circulars() { return request<FieldCircular[]>("/field/circulars"); },
  downloadCircular(id: string, fileName: string) { return downloadFile(`/field/circulars/${id}/download`, fileName); },

  leaveEntitlement() { return request<FieldLeaveEntitlement[]>("/field/leave-entitlement"); },

  activityStatus() { return request<FieldActivityStatus[]>("/field/activity-status"); },

  tasks() { return request<FieldTask[]>("/field/tasks"); },
  updateTaskStatus(id: string, status: "Pending" | "Completed") {
    return request<FieldTask>(`/field/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  },

  // Item 12 (post-launch robustness round) -- real Flash News/Notice
  // Board/Quote of the Week/Talk to Us content admin actually saved.
  announcements() { return request<{ flashNews: { content: string } | null; noticeBoard: { content1: string; content2: string; content3: string } | null; quoteOfTheWeek: { quote: string } | null; talkToUs: { content: string } | null }>("/field/announcements"); },

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

  // Round 36 Item 2 -- My Surveys
  surveys() { return request<FieldSurveySummary[]>("/field/surveys"); },
  submitSurveyAnswers(surveyId: string, answers: { questionId: string; answerText?: string; answerNumeric?: number; selectedOptions?: string[] }[]) {
    return request<{ savedCount: number }>(`/field/surveys/${surveyId}/answers`, { method: "POST", body: JSON.stringify({ answers }) });
  },

  // Round 36 Item C -- My Visit Log (Stockist / Unlisted Doctor / CIP)
  visitLogs(date?: string) {
    const q = date ? `?date=${encodeURIComponent(date)}` : "";
    return request<FieldVisitLog[]>(`/field/visit-logs${q}`);
  },
  submitVisitLog(input: { visitType: "Stockist" | "UnlistedDoctor" | "CIP" | "Hospital"; entityName: string; checkInTime?: string; checkOutTime?: string; notes?: string }) {
    return request<FieldVisitLog>("/field/visit-logs", { method: "POST", body: JSON.stringify(input) });
  },

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
  // Phase 5 — visitType parameterizes the exact same route for a chemist
  // instead of a parallel one; doctorId/chemistId are mutually exclusive.
  planCampaignVisit(input: { campaignId: string; visitType?: "doctor" | "chemist"; doctorId?: string; chemistId?: string; visitDate: string; notes?: string }) {
    return request<FieldCampaignVisit>("/field/campaign-visits", { method: "POST", body: JSON.stringify(input) });
  },
  // Phase 2 — resolve a stranded planned campaign visit (Completed/Cancelled)
  // directly from the Checkout Required screen, when a DCR can't be logged
  // for it any more (DCR always logs "today").
  resolveCampaignVisit(id: string, input: { status: "Completed" | "Cancelled"; notes?: string }) {
    return request<FieldCampaignVisit>(`/field/campaign-visits/${id}/resolve`, { method: "POST", body: JSON.stringify(input) });
  },
  // Phase 3 — deviation workflow (Plan toggle OFF). Phase 5 — `type` picks
  // doctor vs chemist through the same routes.
  deviationTypes() { return request<string[]>("/field/deviation/types"); },
  deviationTerritories(q?: string, type: "doctor" | "chemist" = "doctor") {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type === "chemist") params.set("type", "chemist");
    const qs = params.toString();
    return request<string[]>(`/field/deviation/territories${qs ? `?${qs}` : ""}`);
  },
  deviationDoctors(territory: string, type: "doctor" | "chemist" = "doctor") {
    const params = new URLSearchParams({ territory });
    if (type === "chemist") params.set("type", "chemist");
    return request<(Doctor | FieldChemist & { specialty?: string })[]>(`/field/deviation/doctors?${params.toString()}`);
  },
  requestDeviationVisit(input: { visitType?: "doctor" | "chemist"; doctorId?: string; chemistId?: string; deviationType: string; remarks?: string }) {
    return request<FieldCampaignVisit>("/field/deviation-visits", { method: "POST", body: JSON.stringify(input) });
  },

  // Phase 5 — Chemist Call execution
  chemists() { return request<FieldChemist[]>("/field/chemists"); },
  rcpaBrands() { return request<FieldRcpaBrand[]>("/field/rcpa-brands"); },
  pobProducts() { return request<FieldPobProduct[]>("/field/products"); },
  shortExpiryProducts() { return request<FieldShortExpiryProduct[]>("/field/short-expiry-products"); },
  jccColleagues() { return request<FieldJccColleague[]>("/field/jcc-colleagues"); },
  chemistCall(chemistId: string, date?: string) {
    const params = new URLSearchParams({ chemistId });
    if (date) params.set("date", date);
    return request<FieldChemistCall | null>(`/field/chemist-calls?${params.toString()}`);
  },
  saveChemistCall(input: {
    chemistId: string; visitDate?: string; checkInTime?: string; checkOutTime?: string;
    rcpa: ChemistCallRcpaRow[]; pob: ChemistCallPobRow[]; pobAmountRs?: number; shortExpiry: ChemistCallShortExpiryRow[]; jcc: ChemistCallJccRow[];
  }) {
    return request<FieldChemistCall>("/field/chemist-calls", { method: "POST", body: JSON.stringify(input) });
  }
};
