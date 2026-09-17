"use client";

import type { Doctor, DoctorExceptionReason, Product, VisitSummaryRow } from "@zivira/types";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient, type FieldManager } from "@/lib/api-client";

type Sample = { productName: string; productCode: string; qty: number; batchNumber: string; priority: "" | "HIGH" | "MEDIUM" | "LOW" };
type Input  = { inputName: string; itemType: string; qty: number; valueRs: string };

const SESSION_OPTIONS = ["MORNING", "AFTERNOON", "EVENING"] as const;
const JOINT_WORK_TYPES = ["FIELD_WORK", "ON_JOB_TRAINING", "PERFORMANCE_REVIEW"] as const;
// Request D, item 3 — the doctor-facing scale is now Interested / Mid
// interested / Not interested only (no "Not assessed" blank, no separate
// "None"). Kept on the existing HIGH/MEDIUM/LOW backend enum values
// (unchanged — analytics in product-analytics.ts/kpi-engine.ts key off
// these) with only the on-screen label remapped.
const PRESCRIPTION_INTEREST_OPTIONS = [
  { value: "HIGH", label: "Interested" },
  { value: "MEDIUM", label: "Mid interested" },
  { value: "LOW", label: "Not interested" }
] as const;
const PROMO_MATERIAL_OPTIONS = ["Visual Aid", "Brochure", "Product Sample Card", "Clinical Study", "Leave-behind Literature"];

// The backend's POST /field/dcrs endpoint always creates the record as
// SUBMITTED — there is no draft status it supports (see submitDcr in
// lib/api-client.ts). "Save as Draft" is therefore a real, local-only save
// of the in-progress form to this device, restored next time the form opens.
const DRAFT_KEY = "zivira.field.dcrDraft";

// function badgeClass(badge: "GREEN" | "YELLOW" | "RED" | undefined) {
//   if (badge === "RED") return "badge badge-danger";
//   if (badge === "YELLOW") return "badge badge-warning";
//   if (badge === "GREEN") return "badge badge-success";
//   return "badge";
// }

export function DcrForm() {
  const searchParams = useSearchParams();
  const [doctors, setDoctors]               = useState<Doctor[]>([]);
  const [visitSummary, setVisitSummary]     = useState<VisitSummaryRow[]>([]);
  const [unvisited, setUnvisited]           = useState<Doctor[]>([]);
  const [products, setProducts]             = useState<Product[]>([]);
  const [giftItemTypes, setGiftItemTypes]   = useState<string[]>([]);
  const [doctorId, setDoctorId]             = useState("");
  const [productsDetailed, setProductsDetailed] = useState("Zivacard 10");
  const [notes, setNotes]                   = useState("");
  const [callSession, setCallSession]       = useState<"MORNING"|"AFTERNOON"|"EVENING">("MORNING");
  const [callTime, setCallTime]             = useState("");
  const [samplesGiven, setSamplesGiven]     = useState<Sample[]>([{ productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]);
  const [inputsGiven, setInputsGiven]       = useState<Input[]>([{ inputName: "", itemType: "", qty: 1, valueRs: "" }]);
  const [hasJointWork, setHasJointWork]     = useState(false);
  const [jointManager, setJointManager]     = useState("");
  const [jointType, setJointType]           = useState<typeof JOINT_WORK_TYPES[number]>("FIELD_WORK");
  const [jointObs, setJointObs]             = useState("");
  // Request D, item 4 — managers who currently (or previously) had this
  // MR's Tour Plans assigned to them, for the Accompanying Manager dropdown.
  const [managers, setManagers]             = useState<FieldManager[]>([]);

  // ── Zivira_Project_Basic.docx Topic 1 — Visit Information ──────────────
  const [checkInTime, setCheckInTime]       = useState("");
  const [checkOutTime, setCheckOutTime]     = useState("");
  const [hospitalClinic, setHospitalClinic] = useState("");
  const [gpsLabel, setGpsLabel]             = useState("");
  const [gpsCoords, setGpsCoords]           = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus]           = useState("");
  // Product Promotion
  const [promoMaterials, setPromoMaterials] = useState<string[]>([]);
  const [visualAidUsed, setVisualAidUsed]   = useState(false);
  // Doctor Feedback
  const [prescriptionInterest, setPrescriptionInterest] = useState<typeof PRESCRIPTION_INTEREST_OPTIONS[number]["value"]>("HIGH");
  const [productFeedback, setProductFeedback] = useState("");
  const [competitorMentioned, setCompetitorMentioned] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate]     = useState("");

  const [message, setMessage]               = useState("");
  const [error, setError]                   = useState("");
  const [submitting, setSubmitting]         = useState(false);
  const [showOverVisitModal, setShowOverVisitModal] = useState(false);
  const [showUnvisitedList, setShowUnvisitedList]   = useState(false);

  // Zivira_Project_Basic.docx Topic 8 — Doctor Exception Management
  const [exceptionReasons, setExceptionReasons] = useState<DoctorExceptionReason[]>([]);
  const [exceptionFormDoctorId, setExceptionFormDoctorId] = useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = useState<DoctorExceptionReason | "">("");
  const [exceptionNotes, setExceptionNotes] = useState("");
  const [loggingException, setLoggingException] = useState(false);

  useEffect(() => {
    apiClient.doctors().then(r => { setDoctors(r.data); setDoctorId(r.data[0]?.id ?? ""); }).catch(() => {});
    apiClient.visitSummary().then(r => setVisitSummary(r.data)).catch(() => {});
    apiClient.unvisitedDoctors().then(r => setUnvisited(r.data)).catch(() => {});
    apiClient.products().then(r => setProducts(r.data)).catch(() => {});
    apiClient.giftItems().then(r => setGiftItemTypes(r.data)).catch(() => {});
    apiClient.exceptionReasons().then(r => setExceptionReasons(r.data)).catch(() => {});
    apiClient.managers().then(r => setManagers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const preselect = searchParams.get("doctorId");
    if (preselect && doctors.some(d => d.id === preselect)) {
      setDoctorId(preselect);
    }
  }, [doctors, searchParams]);

  // Restore a locally-saved draft (see DRAFT_KEY above) once doctors have
  // loaded, so we can validate the saved doctorId is still real. Runs after
  // — and yields to — the URL `?doctorId=` preselect above: a link that
  // explicitly asks for a doctor wins over a stale draft.
  useEffect(() => {
    if (doctors.length === 0) return;
    if (searchParams.get("doctorId")) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Record<string, unknown>;
      let restoredAnything = false;

      if (typeof draft.doctorId === "string" && draft.doctorId && doctors.some(d => d.id === draft.doctorId)) {
        setDoctorId(draft.doctorId);
        restoredAnything = true;
      }
      if (typeof draft.productsDetailed === "string") { setProductsDetailed(draft.productsDetailed); restoredAnything = true; }
      if (typeof draft.notes === "string") { setNotes(draft.notes); restoredAnything = true; }
      if (draft.callSession === "MORNING" || draft.callSession === "AFTERNOON" || draft.callSession === "EVENING") {
        setCallSession(draft.callSession); restoredAnything = true;
      }
      if (typeof draft.callTime === "string") { setCallTime(draft.callTime); restoredAnything = true; }
      if (Array.isArray(draft.samplesGiven)) { setSamplesGiven(draft.samplesGiven as Sample[]); restoredAnything = true; }
      if (Array.isArray(draft.inputsGiven)) { setInputsGiven(draft.inputsGiven as Input[]); restoredAnything = true; }
      if (typeof draft.hospitalClinic === "string") { setHospitalClinic(draft.hospitalClinic); restoredAnything = true; }
      if (typeof draft.checkInTime === "string") { setCheckInTime(draft.checkInTime); restoredAnything = true; }
      if (typeof draft.checkOutTime === "string") { setCheckOutTime(draft.checkOutTime); restoredAnything = true; }
      if (typeof draft.productFeedback === "string") { setProductFeedback(draft.productFeedback); restoredAnything = true; }
      if (typeof draft.competitorMentioned === "string") { setCompetitorMentioned(draft.competitorMentioned); restoredAnything = true; }

      if (restoredAnything) setMessage("Restored your saved draft.");
    } catch {
      // Corrupted or inaccessible localStorage — safe to ignore, form just starts blank.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctors, searchParams]);

  function saveDraft() {
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({
        doctorId,
        productsDetailed,
        notes,
        callSession,
        callTime,
        samplesGiven,
        inputsGiven,
        hospitalClinic,
        checkInTime,
        checkOutTime,
        productFeedback,
        competitorMentioned
      }));
      setMessage("Draft saved on this device.");
    } catch {
      setError("Unable to save draft on this device.");
    }
  }

  // Zivira_Project_Basic.docx Topic 8 — Doctor Exception Management
  async function submitException(doctorId: string) {
    if (!exceptionReason) return;
    setLoggingException(true);
    try {
      await apiClient.logDoctorException({ doctorId, reason: exceptionReason, notes: exceptionNotes || undefined });
      setUnvisited(list => list.map(d => d.id === doctorId ? { ...d, exceptionReason, exceptionNotes: exceptionNotes || null } : d));
      setExceptionFormDoctorId(null); setExceptionReason(""); setExceptionNotes("");
    } catch {
      // Non-critical UI affordance — the doctor stays in the unvisited list, MR can retry.
    } finally {
      setLoggingException(false);
    }
  }

  const badgeByDoctorId = useMemo(() => {
    const map = new Map<string, VisitSummaryRow>();
    for (const row of visitSummary) map.set(row.doctorId, row);
    return map;
  }, [visitSummary]);

  const selectedDoctorBadge = doctorId ? badgeByDoctorId.get(doctorId) : undefined;

  // Sample helpers — product picker only, no free-text entry (PRD 12.3A)
  function addSample()  { setSamplesGiven(s => [...s, { productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]); }
  function removeSample(i: number) { setSamplesGiven(s => s.filter((_, idx) => idx !== i)); }
  function updateSampleProduct(i: number, productCode: string) {
    const product = products.find(p => p.code === productCode);
    setSamplesGiven(s => s.map((item, idx) => idx === i ? { ...item, productCode, productName: product?.name ?? "" } : item));
  }
  function updateSampleField(i: number, field: "qty" | "batchNumber" | "priority", val: string | number) {
    setSamplesGiven(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  // Zivira_Project_Basic.docx Topic 1 — "GPS Location" capture via browser
  // geolocation. Request D, item 2 — the captured coordinates must appear
  // INSIDE the "Location label (optional)" box itself, not as separate text
  // below it, so this writes straight into gpsLabel (still editable by the
  // MR afterwards — it's a plain controlled input).
  function useCurrentLocation() {
    if (!navigator.geolocation) { setGpsStatus("Geolocation not available on this device."); return; }
    setGpsStatus("Fetching location…");
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ latitude, longitude });
        setGpsLabel(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setGpsStatus("Location captured.");
      },
      () => setGpsStatus("Unable to fetch location — enter manually or skip."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function toggleMaterial(name: string) {
    setPromoMaterials(m => m.includes(name) ? m.filter(x => x !== name) : [...m, name]);
  }

  const visitDurationMinutes = useMemo(() => {
    if (!checkInTime || !checkOutTime) return undefined;
    const [inH, inM] = checkInTime.split(":").map(Number);
    const [outH, outM] = checkOutTime.split(":").map(Number);
    if ([inH, inM, outH, outM].some(n => Number.isNaN(n))) return undefined;
    const minutes = (outH * 60 + outM) - (inH * 60 + inM);
    return minutes >= 0 ? minutes : undefined;
  }, [checkInTime, checkOutTime]);

  // Gift/input helpers — itemType picker (PRD 12.3B)
  function addInput()  { setInputsGiven(s => [...s, { inputName: "", itemType: "", qty: 1, valueRs: "" }]); }
  function removeInput(i: number) { setInputsGiven(s => s.filter((_, idx) => idx !== i)); }
  function updateInputType(i: number, itemType: string) {
    setInputsGiven(s => s.map((item, idx) => idx === i ? { ...item, itemType, inputName: itemType } : item));
  }
  function updateInputField(i: number, field: "qty" | "valueRs", val: string | number) {
    setInputsGiven(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  }

  const totalSampleUnits = samplesGiven.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
  const totalGiftUnits = inputsGiven.reduce((sum, s) => sum + (Number(s.qty) || 0), 0);
// const distinctProducts = new Set(samplesGiven.filter(s => s.productCode).map(s => s.productCode)).size;

  function onDoctorChange(id: string) {
    setDoctorId(id);
    const badge = badgeByDoctorId.get(id);
    if (badge?.badge === "RED") {
      setShowOverVisitModal(true);
    }
  }

  async function doSubmit(overrideOverVisitWarning: boolean) {
    setSubmitting(true); setError(""); setMessage("");
    try {
      const result = await apiClient.submitDcr({
        doctorId: doctorId || undefined,
        productsDetailed: productsDetailed.split(",").map(s => s.trim()).filter(Boolean),
        notes,
        callSession,
        callTime: callTime || undefined,
        samplesGiven: samplesGiven.filter(s => s.productCode).map(s => ({
          productName: s.productName, productCode: s.productCode, qty: Number(s.qty) || 0, batchNumber: s.batchNumber || undefined,
          priority: s.priority || undefined
        })),
        inputsGiven: inputsGiven.filter(s => s.itemType).map(s => ({
          inputName: s.inputName, itemType: s.itemType, qty: Number(s.qty) || 0, valueRs: s.valueRs ? Number(s.valueRs) : undefined
        })),
        jointWork: hasJointWork ? { accompanyingManager: jointManager, jointWorkType: jointType, managerObservations: jointObs } : undefined,
        overrideOverVisitWarning,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        gpsLocation: (gpsCoords || gpsLabel) ? { ...(gpsCoords ?? {}), label: gpsLabel || undefined } : undefined,
        hospitalClinic: hospitalClinic || undefined,
        visitDurationMinutes,
        promotionalMaterialsShared: promoMaterials.length ? promoMaterials : undefined,
        visualAidUsed,
        prescriptionInterest: prescriptionInterest || undefined,
        productFeedback: productFeedback || undefined,
        competitorMentioned: competitorMentioned || undefined,
        followUpRequired,
        followUpDate: followUpRequired && followUpDate ? followUpDate : undefined
      });
      setMessage(result.overVisitFlag ? "DCR submitted — override logged for your manager to review." : "DCR submitted successfully.");
      setNotes("");
      setSamplesGiven([{ productName: "", productCode: "", qty: 1, batchNumber: "", priority: "" }]);
      setInputsGiven([{ inputName: "", itemType: "", qty: 1, valueRs: "" }]);
      setHasJointWork(false); setJointManager(""); setJointObs("");
      setCheckInTime(""); setCheckOutTime(""); setHospitalClinic("");
      setGpsLabel(""); setGpsCoords(null); setGpsStatus("");
      setPromoMaterials([]); setVisualAidUsed(false);
      setPrescriptionInterest("HIGH"); setProductFeedback(""); setCompetitorMentioned("");
      setFollowUpRequired(false); setFollowUpDate("");
      apiClient.visitSummary().then(r => setVisitSummary(r.data)).catch(() => {});
      apiClient.unvisitedDoctors().then(r => setUnvisited(r.data)).catch(() => {});
      try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* non-critical */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit DCR");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitDcr(event: React.FormEvent) {
    event.preventDefault();
    if (selectedDoctorBadge?.badge === "RED") {
      setShowOverVisitModal(true);
      return;
    }
    await doSubmit(false);
  }

  return (

    <>
      {unvisited.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3 shadow-xs mb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" fillRule="evenodd"></path></svg>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">{unvisited.length} Doctor{unvisited.length > 1 ? "s" : ""} Unvisited This Month</p>
                <p className="text-[11px] text-amber-800">Priority gap in your territory</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setShowUnvisitedList(v => !v)}
              className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 font-bold text-[11px] rounded-lg border border-amber-300 shadow-xs flex-shrink-0 transition active:scale-95"
            >
              {showUnvisitedList ? "Hide" : "View"}
            </button>
          </div>
          
          {showUnvisitedList && (
            <ul className="mt-3 space-y-2">
              {unvisited.map(d => (
                <li key={d.id} className="bg-white/60 p-2 rounded-lg border border-amber-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-slate-800">{d.name}</strong>
                      <span className="text-[11px] text-slate-500 ml-1">· {d.specialty}</span>
                    </div>
                  </div>
                  {d.exceptionReason ? (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      Reason logged: <strong className="font-bold">{d.exceptionReason}</strong>{d.exceptionNotes ? ` — ${d.exceptionNotes}` : ""}
                    </p>
                  ) : exceptionFormDoctorId === d.id ? (
                    <div className="mt-2 space-y-2 bg-white p-2 rounded-lg border border-amber-200">
                      <select 
                        value={exceptionReason} 
                        onChange={e => setExceptionReason(e.target.value as DoctorExceptionReason)}
                        className="w-full text-xs rounded-xl border-slate-200 py-2 focus:ring-brand-600 focus:border-brand-600 bg-slate-50/50"
                      >
                        <option value="">Select reason…</option>
                        {exceptionReasons.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <input 
                        placeholder="Notes (optional)" 
                        value={exceptionNotes} 
                        onChange={e => setExceptionNotes(e.target.value)} 
                        className="w-full text-xs rounded-xl border-slate-200 py-2 focus:ring-brand-600 focus:border-brand-600 bg-slate-50/50"
                      />
                      <div className="flex gap-2">
                        <button type="button" disabled={!exceptionReason || loggingException} onClick={() => submitException(d.id)} className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-lg shadow-sm">
                          {loggingException ? "Saving…" : "Save reason"}
                        </button>
                        <button type="button" onClick={() => { setExceptionFormDoctorId(null); setExceptionReason(""); setExceptionNotes(""); }} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setExceptionFormDoctorId(d.id)} className="mt-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-1 rounded transition">
                      Log reason for not visiting
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="space-y-3.5" onSubmit={submitDcr}>
        
        {/* CARD 1: Doctor & Timing */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">1</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Doctor & Timing</h3>
            </div>
            {selectedDoctorBadge && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                selectedDoctorBadge.badge === 'RED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                selectedDoctorBadge.badge === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Target: {selectedDoctorBadge.visitCount} visits
              </span>
            )}
          </div>

          {/* Doctor Selected Card */}
          <div className="relative bg-slate-50/80 rounded-xl p-3 border border-slate-200/90 hover:border-brand-300 transition">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                  👨‍⚕️
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {doctors.find(d => d.id === doctorId)?.name || "Select Doctor"}
                    </h4>
                    {selectedDoctorBadge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        selectedDoctorBadge.badge === 'RED' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                        selectedDoctorBadge.badge === 'YELLOW' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {selectedDoctorBadge.visitCount} visits
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                    {doctors.find(d => d.id === doctorId)?.specialty || "Tap to select"}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-brand-700 hover:text-brand-800 underline underline-offset-2 ml-1 cursor-pointer">
                Change
              </span>
            </div>
            
            <select 
              value={doctorId} 
              onChange={e => onDoctorChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">Select Doctor...</option>
              {doctors.map(d => {
                const badge = badgeByDoctorId.get(d.id);
                return (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.specialty} {badge ? `(${badge.visitCount} visits)` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Side-by-side Time Pickers */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 hover:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600 transition">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-in</label>
                <div className="flex items-center justify-between mt-1 relative">
                  <input 
                    type="time" 
                    value={checkInTime} 
                    onChange={e => setCheckInTime(e.target.value)}
                    className="font-bold text-slate-900 text-sm border-none p-0 focus:ring-0 w-full bg-transparent z-10" 
                  />
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 absolute right-0 pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 hover:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-600 transition">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Check-out</label>
                <div className="flex items-center justify-between mt-1 relative">
                  <input 
                    type="time" 
                    value={checkOutTime} 
                    onChange={e => setCheckOutTime(e.target.value)}
                    className="font-bold text-slate-900 text-sm border-none p-0 focus:ring-0 w-full bg-transparent z-10" 
                  />
                  <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 absolute right-0 pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Pill */}
            {visitDurationMinutes !== undefined && (
              <div className="flex items-center justify-center space-x-1.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50/70 rounded-lg border border-brand-100">
                <span>⏱️ Call Duration:</span>
                <span className="font-bold text-brand-900">{visitDurationMinutes} Minutes Recorded</span>
              </div>
            )}
          </div>
        </section>

        {/* CARD 2: Location & Session Verification */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">2</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Location & Verification</h3>
            </div>
            {gpsCoords && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 animate-ping"></span>
                Verified
              </span>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hospital / Clinic Center</label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400">
                <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" fillRule="evenodd"></path></svg>
              </span>
              <input 
                type="text"
                placeholder="Hospital or clinic name"
                value={hospitalClinic} 
                onChange={e => setHospitalClinic(e.target.value)}
                className="w-full text-xs font-semibold text-slate-900 rounded-xl border-slate-200 pl-9 pr-3 py-2.5 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 bg-slate-50/50" 
              />
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-7 h-7 rounded-lg ${gpsCoords ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Location label (optional)"
                  value={gpsLabel} 
                  onChange={e => setGpsLabel(e.target.value)}
                  className="w-full text-[11px] font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0" 
                />
                <p className={`text-[10px] ${gpsCoords ? 'text-emerald-700' : 'text-slate-500'} font-semibold mt-0.5`}>
                  {gpsStatus || (gpsCoords ? '● GPS Match (Within GeoFence)' : 'Tap Refresh to capture GPS')}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={useCurrentLocation}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded bg-white border border-slate-200 shadow-xs active:bg-slate-50"
            >
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Call Session</label>
              <select 
                value={callSession} 
                onChange={e => setCallSession(e.target.value as typeof callSession)}
                className="w-full text-xs font-bold text-slate-800 rounded-xl border-slate-200 py-2 pl-3 pr-7 focus:ring-brand-600 focus:border-brand-600 bg-slate-50/50"
              >
                {SESSION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Call Time</label>
              <div className="relative flex items-center">
                <input 
                  type="time" 
                  value={callTime} 
                  onChange={e => setCallTime(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 rounded-xl border-slate-200 py-2 pl-3 pr-8 focus:ring-brand-600 focus:border-brand-600 bg-slate-50/50"
                />
                <svg className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
            </div>
          </div>
        </section>

        {/* CARD 3: Product Detailing & Visual Aids */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">3</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product Detailing</h3>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-brand-50 via-brand-50/40 to-slate-50 border border-brand-200/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect height="14" rx="2" width="18" x="3" y="3"></rect><path d="M7 21h10m-5-3v3"></path></svg>
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 leading-tight">Visual Aid Presentation</p>
                <p className="text-[11px] text-slate-500 font-medium">Digital e-detailing deck shown</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={visualAidUsed} onChange={e => setVisualAidUsed(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Products Presented</label>
            <input 
              type="text" 
              value={productsDetailed} 
              onChange={e => setProductsDetailed(e.target.value)} 
              placeholder="Comma separated product names" 
              className="w-full text-xs rounded-xl border-slate-200 p-2.5 focus:ring-1 focus:ring-brand-600 focus:border-brand-600 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-700">Promotional Materials Handed Over</label>
            <div className="flex flex-wrap gap-2">
              {PROMO_MATERIAL_OPTIONS.map(m => {
                const isActive = promoMaterials.includes(m);
                return (
                  <label key={m} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer select-none transition ${isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 font-medium'}`}>
                    {isActive ? (
                      <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-400 flex-shrink-0"></span>
                    )}
                    <span>{m}</span>
                    <input type="checkbox" className="hidden" checked={isActive} onChange={() => toggleMaterial(m)} />
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* CARD 4: Samples & Inputs Distributed */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">4</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Samples & Gifts</h3>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prescription Samples</span>
              <button onClick={addSample} type="button" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center">
                <span className="mr-0.5 text-sm leading-none">+</span> Add Row
              </button>
            </div>
            
            <div className="space-y-2">
              {samplesGiven.map((s, i) => (
                <div key={i} className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center space-x-2.5 w-full">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                        💊
                      </div>
                      <select 
                        value={s.productCode} 
                        onChange={e => updateSampleProduct(i, e.target.value)} 
                        className="w-full text-xs font-extrabold text-slate-900 rounded-lg border-slate-200 py-1.5 focus:ring-brand-600 focus:border-brand-600"
                      >
                        <option value="">Select product…</option>
                        {products.map(p => <option key={p.id} value={p.code}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <input type="number" min={0} placeholder="Qty" value={s.qty} onChange={e => updateSampleField(i, "qty", Number(e.target.value))} className="w-20 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-xs text-center" />
                      <input placeholder="Batch no." value={s.batchNumber} onChange={e => updateSampleField(i, "batchNumber", e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-xs" />
                    </div>
                    <button type="button" aria-label="Delete sample item" onClick={() => removeSample(i)} className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inputs / Gifts Distributed</span>
              <button onClick={addInput} type="button" className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center">
                <span className="mr-0.5 text-sm leading-none">+</span> Add Row
              </button>
            </div>
            
            <div className="space-y-2">
              {inputsGiven.map((inp, i) => (
                <div key={i} className="bg-slate-50/90 rounded-xl p-2.5 border border-slate-200 flex flex-col gap-2 relative">
                  <div className="flex items-center justify-between min-w-0">
                    <div className="flex items-center space-x-2.5 w-full">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black flex-shrink-0">
                        🎁
                      </div>
                      <select 
                        value={inp.itemType} 
                        onChange={e => updateInputType(i, e.target.value)} 
                        className="w-full text-xs font-extrabold text-slate-900 rounded-lg border-slate-200 py-1.5 focus:ring-brand-600 focus:border-brand-600"
                      >
                        <option value="">Select gift item…</option>
                        {giftItemTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <input type="number" min={0} placeholder="Qty" value={inp.qty} onChange={e => updateInputField(i, "qty", Number(e.target.value))} className="w-20 px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-xs text-center" />
                      <input type="number" min={0} placeholder="Value ₹" value={inp.valueRs} onChange={e => updateInputField(i, "valueRs", e.target.value)} className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-xs" />
                    </div>
                    <button type="button" aria-label="Delete gift item" onClick={() => removeInput(i)} className="text-slate-400 hover:text-rose-600 p-1 flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900 font-medium flex items-center justify-between mt-2">
            <span className="flex items-center space-x-1.5">
              <svg className="w-4 h-4 text-emerald-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
              <span>Summary: <strong>{totalSampleUnits} pack{totalSampleUnits !== 1 && 's'}</strong> & <strong>{totalGiftUnits} promo gift{totalGiftUnits !== 1 && 's'}</strong></span>
            </span>
            <span className="font-bold text-emerald-800 text-[10px] bg-emerald-100 px-2 py-0.5 rounded">Compliance OK</span>
          </div>
        </section>

        {/* CARD 5: Doctor Sentiment & Field Intelligence */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">5</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Sentiment & Intelligence</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Doctor Feedback</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Prescription Likelihood</label>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              {PRESCRIPTION_INTEREST_OPTIONS.map(o => (
                <label key={o.value} className="cursor-pointer">
                  <input type="radio" name="interest" className="sr-only peer" checked={prescriptionInterest === o.value} onChange={() => setPrescriptionInterest(o.value)} />
                  <div className={`py-2 px-1 rounded-xl transition ${prescriptionInterest === o.value ? 'border border-brand-500 bg-brand-600 text-white font-bold text-[11px] shadow-xs' : 'border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-[11px] hover:bg-slate-100'}`}>
                    {o.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Visit Notes</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Visit outcome, next follow-up, objections" 
              rows={2}
              className="w-full text-xs rounded-xl border-slate-200 p-2.5 focus:ring-1 focus:ring-brand-600 focus:border-brand-600 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Doctor&apos;s Clinical Feedback</label>
            <textarea 
              value={productFeedback} 
              onChange={e => setProductFeedback(e.target.value)} 
              placeholder="Specific remarks regarding tolerability or dosing" 
              rows={2}
              className="w-full text-xs rounded-xl border-slate-200 p-2.5 focus:ring-1 focus:ring-brand-600 focus:border-brand-600 font-medium text-slate-800 bg-slate-50/50"
            />
          </div>

          <div className="bg-amber-50/60 border border-amber-200/90 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center">
                <svg className="w-3.5 h-3.5 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                Competitor Mentioned
              </span>
              {competitorMentioned && <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">Active Threat</span>}
            </div>
            <input 
              type="text"
              value={competitorMentioned} 
              onChange={e => setCompetitorMentioned(e.target.value)} 
              placeholder="E.g. CardioMax 20 (Sun Pharma)"
              className="w-full text-xs font-bold text-slate-900 bg-white rounded-lg border-amber-200 py-1.5 px-2.5 focus:ring-amber-500 focus:border-amber-500" 
            />
          </div>
        </section>

        {/* CARD 6: Compliance & Follow-up */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">6</span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Compliance & Actions</h3>
            </div>
            <span className="text-[11px] font-semibold text-brand-700">Sync Status: Ready</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-bold text-slate-900">Follow-up Required</p>
              {followUpRequired && (
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-[11px] font-semibold text-emerald-700">Target Date:</span>
                  <input 
                    type="date" 
                    value={followUpDate} 
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="text-[11px] font-bold text-emerald-800 border-none p-0 focus:ring-0 bg-transparent"
                  />
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={followUpRequired} onChange={e => setFollowUpRequired(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <div className="border-t border-slate-100 pt-2 py-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">Joint Work with Area Manager</p>
                <p className="text-[11px] text-slate-500 font-medium">Tag manager to review call</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasJointWork} onChange={e => setHasJointWork(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
            
            {hasJointWork && (
              <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Accompanying Manager</label>
                  {managers.length > 0 ? (
                    <select value={jointManager} onChange={e => setJointManager(e.target.value)} className="w-full text-xs font-medium bg-white rounded-lg border-slate-200 py-1.5 focus:border-brand-600 focus:ring-1">
                      <option value="">Select manager…</option>
                      {managers.map(m => (
                        <option key={m.employeeCode} value={m.employeeCode}>
                          {m.name} ({m.employeeCode}){m.designation ? ` — ${m.designation}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={jointManager} onChange={e => setJointManager(e.target.value)} placeholder="Manager name or code" className="w-full text-xs font-medium bg-white rounded-lg border-slate-200 py-1.5 focus:border-brand-600 focus:ring-1" />
                  )}
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Joint Work Type</label>
                  <select value={jointType} onChange={e => setJointType(e.target.value as typeof jointType)} className="w-full text-xs font-medium bg-white rounded-lg border-slate-200 py-1.5 focus:border-brand-600 focus:ring-1">
                    {JOINT_WORK_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Observations</label>
                  <textarea value={jointObs} onChange={e => setJointObs(e.target.value)} placeholder="Manager's field observations" rows={2} className="w-full text-xs font-medium bg-white rounded-lg border-slate-200 py-1.5 focus:border-brand-600 focus:ring-1" />
                </div>
              </div>
            )}
          </div>
        </section>

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-medium">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {/* PRIMARY ACTION BUTTONS */}
        <div className="pt-2 space-y-2.5 pb-8">
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-gradient-to-r from-brand-600 via-brand-700 to-emerald-800 hover:from-brand-700 hover:to-brand-900 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-btn-emerald flex items-center justify-center space-x-2.5 transition active:scale-[0.98] disabled:opacity-70"
          >
            <span className="text-sm tracking-wide">{submitting ? "Submitting…" : "Submit Daily Call Report"}</span>
            {!submitting && (
              <svg className="w-4 h-4 transform -rotate-45 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            )}
          </button>
          
          <button
            type="button"
            onClick={saveDraft}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center space-x-1.5 transition text-xs active:bg-slate-100"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <span>Save as Draft</span>
          </button>
        </div>
      </form>

      {showOverVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl max-w-sm w-full space-y-4">
            <div className="flex items-start space-x-3 text-rose-700">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <div>
                <h4 className="text-sm font-bold">Frequent Visitor Warning</h4>
                <p className="text-xs text-rose-600 mt-1 font-medium leading-relaxed">
                  This doctor has already been visited {selectedDoctorBadge?.visitCount ?? 3} times this month.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              You can still log this visit — it will be flagged for your manager. Or switch to an unvisited doctor first.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition"
                onClick={async () => { setShowOverVisitModal(false); await doSubmit(true); }}
              >
                Log Anyway
              </button>
              <button
                type="button"
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition"
                onClick={() => { setShowOverVisitModal(false); setShowUnvisitedList(true); window.scrollTo(0,0); }}
              >
                View Unvisited
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
