"use client";

import type { Attendance, Dcr, FieldDashboard } from "@zivira/types";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { fetchCurrentLocation, readSavedLocation, type FieldLocation } from "@/lib/location";

const CATEGORY_PRIORITY: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

function dcrDoctorId(dcr: Dcr): string | undefined {
  return typeof dcr.doctorId === "string" ? dcr.doctorId : dcr.doctorId?.id;
}

export function TodayPanel() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<FieldDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [highPriorityOnly, setHighPriorityOnly] = useState(false);
  const [visitTab, setVisitTab] = useState<"all" | "pending" | "completed">("all");
  const [routeOptimized, setRouteOptimized] = useState(false);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.dashboard();
      setDashboard(response.data);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : "Unable to load today's plan");
    } finally {
      setLoading(false);
    }
  }

  async function checkIn() {
    setError("");
    setLocating(true);
    try {
      const currentLocation = await fetchCurrentLocation();
      setLocation(currentLocation);
      const response = await apiClient.checkIn(currentLocation);
      setAttendance(response.data);
      setConfirmMessage("You have checked in successfully.");
      await loadDashboard();
    } catch (checkInError) {
      setError(checkInError instanceof Error ? checkInError.message : "Location permission is mandatory to check in");
    } finally {
      setLocating(false);
    }
  }

  async function checkOut() {
    setError("");
    setLocating(true);
    try {
      const response = await apiClient.checkOut();
      setAttendance(response.data);
      setConfirmMessage("You have checked out successfully.");
      await loadDashboard();
    } catch (checkOutError) {
      setError(checkOutError instanceof Error ? checkOutError.message : "Unable to check out");
    } finally {
      setLocating(false);
    }
  }

  async function enableGps() {
    setError("");
    setLocating(true);
    try {
      const currentLocation = await fetchCurrentLocation();
      setLocation(currentLocation);
    } catch (gpsError) {
      setError(gpsError instanceof Error ? gpsError.message : "Unable to fetch GPS location");
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    setLocation(readSavedLocation());
    void loadDashboard();
  }, []);

  const hasCheckedIn = Boolean(attendance?.checkInAt) || Boolean(dashboard?.today.attendanceMarked);
  const hasCheckedOut = Boolean(attendance?.checkOutAt);
  const showCheckOut = hasCheckedIn && !hasCheckedOut;

  const toggleCardExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const today = new Date().toDateString();
  const visitedTodayIds = new Set(
    (dashboard?.recentDcrs ?? [])
      .filter((dcr) => new Date(dcr.visitDate).toDateString() === today)
      .map((dcr) => dcrDoctorId(dcr))
      .filter((id): id is string => Boolean(id))
  );

  const searchFilteredDoctors = (dashboard?.doctors ?? []).filter((doctor) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty.toLowerCase().includes(query) ||
      doctor.city.toLowerCase().includes(query);
    const matchesPriority = !highPriorityOnly || doctor.category === "A" || doctor.category === "B";
    return matchesSearch && matchesPriority;
  });

  const allCount = searchFilteredDoctors.length;
  const pendingCount = searchFilteredDoctors.filter((doctor) => !visitedTodayIds.has(doctor.id)).length;
  const completedCount = searchFilteredDoctors.filter((doctor) => visitedTodayIds.has(doctor.id)).length;

  let visibleDoctors = searchFilteredDoctors.filter((doctor) => {
    if (visitTab === "pending") return !visitedTodayIds.has(doctor.id);
    if (visitTab === "completed") return visitedTodayIds.has(doctor.id);
    return true;
  });

  if (routeOptimized) {
    visibleDoctors = [...visibleDoctors].sort((a, b) => {
      const priorityDiff = (CATEGORY_PRIORITY[a.category] ?? 4) - (CATEGORY_PRIORITY[b.category] ?? 4);
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  }

  return (
    <>
      {/* Floating Toast Notification */}
      {(confirmMessage || error) && (
        <div className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-900/95 text-white text-xs font-medium shadow-xl backdrop-blur-md border border-slate-800 animate-toast">
          <span className={error ? "text-rose-400" : "text-emerald-400"}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
          </span>
          <span>{confirmMessage || error}</span>
          <button onClick={() => { setConfirmMessage(null); setError(""); }} className="ml-auto text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Hero Plan Header */}
      <section className="space-y-2.5">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold tracking-wider uppercase text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Shift #{dashboard?.profile.employeeCode ?? "042"} • Live Briefing</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-medium text-[10px]">
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-semibold">{dashboard?.profile.division ?? "Division"}</span>
            </div>
          </div>
          <div className="pt-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">Good morning, {dashboard?.profile.name?.split(' ')[0] ?? "Rahul"}</h2>
              <p className="text-xs text-slate-500 font-normal leading-relaxed mt-0.5">
                {dashboard?.today.plannedVisits ?? 0} doctors queued today • Est. 14.2 km route coverage
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Efficiency</span>
              <span className="text-base font-black text-emerald-800 leading-none">94%</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-3.5">
            {showCheckOut ? (
              <button
                className="flex-[2] inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-70"
                onClick={checkOut}
                disabled={locating}
              >
                {locating ? "Processing..." : "Check out"}
              </button>
            ) : (
              <button
                className="flex-[2] inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg active:scale-95 active:ring-2 active:ring-emerald-600 transition-all duration-150 ease-out cursor-pointer disabled:opacity-70"
                onClick={checkIn}
                disabled={locating || hasCheckedIn}
              >
                <svg className="w-4 h-4 text-emerald-200 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
                </svg>
                <span>{locating ? "Processing..." : (hasCheckedIn ? "Checked in" : "Check in")}</span>
              </button>
            )}
            <button
              className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer disabled:opacity-70"
              onClick={loadDashboard}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Sync</span>
            </button>
            <button className="p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-slate-600 rounded-xl shadow-xs active:scale-90 transition-all cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* GPS Location Requirement Card */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0 shadow-xs">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500">Field Geolocation</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">Next: 1.8 km</span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug truncate">
                {location?.label ?? "Required before check-in"}
              </p>
              <p className="text-[11px] text-slate-500 leading-normal line-clamp-1">
                {location ? `Accuracy ${Math.round(location.accuracy)}m · ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Allow satellite GPS to log territory presence."}
              </p>
            </div>
          </div>
          <button
            className="shrink-0 px-3 py-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl active:scale-95 transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
            onClick={enableGps}
            disabled={locating}
          >
            <span>{locating ? "Locating…" : "Enable GPS"}</span>
          </button>
        </div>
      </section>

      {/* 2x2 Daily Metric Summary Grid */}
      <section className="grid grid-cols-2 gap-3">
        <article className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Planned</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{dashboard?.today.plannedVisits ?? 0}</span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">Target</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">Assigned doctors</span>
            <span className="text-[10px] font-semibold text-slate-400">100% load</span>
          </div>
        </article>

        <article className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>In Queue</span>
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight transition-all">{dashboard?.today.completedDcrs ?? 0}</span>
            <span className="text-xs font-semibold text-slate-400">/ {dashboard?.today.plannedVisits ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium">{(dashboard?.today.plannedVisits ? Math.round(((dashboard?.today.completedDcrs ?? 0) / dashboard.today.plannedVisits) * 100) : 0)}% coverage</span>
            <span className="text-[10px] font-semibold text-amber-700">Pending</span>
          </div>
        </article>

        <article className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attendance</span>
            <button className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors shadow-xs" onClick={checkIn}>Punch Now</button>
          </div>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight transition-colors duration-200">{hasCheckedIn ? "Yes" : "No"}</span>
            {!hasCheckedIn && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="transition-colors duration-200 truncate">{hasCheckedIn ? "Checked In" : "Shift punch pending"}</span>
            <span className="text-[10px] font-semibold text-slate-400">09:00 AM</span>
          </div>
        </article>

        <article className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.98] group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Territory</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">Zone 3</span>
          </div>
          <div className="my-2">
            <span className="text-lg font-black text-slate-900 leading-snug tracking-tight block truncate">{dashboard?.profile.territory ?? "Chennai HQ"}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="truncate">{dashboard?.profile.division ?? "Zivira East"}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 px-1.5 py-0.5 rounded">14.2 km</span>
          </div>
        </article>
      </section>

      {/* Interactive Day Progress Section */}
      <section className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
            </div>
            <span className="text-xs font-bold text-slate-900 tracking-tight">Route Waypoints</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
              {dashboard?.today.completedDcrs ?? 0} of {dashboard?.today.plannedVisits ?? 0} Visits ({(dashboard?.today.plannedVisits ? Math.round(((dashboard?.today.completedDcrs ?? 0) / dashboard.today.plannedVisits) * 100) : 0)}%)
            </span>
          </div>
        </div>
        <div className="pt-2 pb-1">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0"></div>
            <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 bg-emerald-600 rounded-full transition-all duration-500 ease-out z-0" style={{width: `${dashboard?.today.plannedVisits ? ((dashboard?.today.completedDcrs ?? 0) / dashboard.today.plannedVisits) * 100 : 0}%`}}></div>
            {Array.from({ length: Math.min(visibleDoctors.length, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`relative z-10 w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-xs hover:scale-110 transition cursor-pointer ${n === 1 ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-300"}`}
                onClick={() => document.getElementById(`doctor-card-${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-0.5 pt-1.5">
            <span>Start: Lilavati</span>
            <span className="text-center text-slate-500 font-semibold">{dashboard?.today.plannedVisits ?? 0} visits remaining</span>
            <span>End: Kolkata Care</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="1.8"></circle>
              <path d="M12 7v5l3 3" strokeWidth="1.8"></path>
            </svg>
            <span>Est. Route Time: <strong className="text-slate-800 font-semibold">4h 30m</strong></span>
          </div>
          <div className="flex items-center gap-1 text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
            <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth="1.8"></circle>
              <polygon points="12 7 15 15 12 13 9 15 12 7" fill="currentColor"></polygon>
            </svg>
            <span>Live Radar</span>
          </div>
        </div>
      </section>

      {/* Search & Route Quick Controls */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <input
            className="w-full text-xs pl-8 pr-9 py-2 bg-white border border-slate-200/90 rounded-xl shadow-xs placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
            placeholder="Search doctor, clinic, or specialty..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2"></circle>
            <line strokeWidth="2" x1="21" x2="16.65" y1="21" y2="16.65"></line>
          </svg>
          <button
            className={`absolute right-2 p-1 rounded-md transition cursor-pointer ${highPriorityOnly ? "text-emerald-700 bg-emerald-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
            title="Filter list"
            onClick={() => setHighPriorityOnly((v) => !v)}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" strokeWidth="1.8" strokeLinejoin="round"></polygon>
            </svg>
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] px-0.5">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
            Tap card for visual aid &amp; samples
          </span>
          <button
            className={`font-bold hover:underline inline-flex items-center gap-1 active:scale-95 transition px-2 py-0.5 rounded-md border shadow-xs ${routeOptimized ? "text-white bg-emerald-700 border-emerald-700" : "text-emerald-800 bg-emerald-50/80 border-emerald-200/60"}`}
            onClick={() => setRouteOptimized((v) => !v)}
          >
            <svg className={`w-3.5 h-3.5 ${routeOptimized ? "text-white" : "text-emerald-700"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
            <span>Optimize Route</span>
          </button>
        </div>
      </div>

      {/* Scheduled Doctor Visits Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900">Scheduled Visits</h3>
            <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded-full transition-transform">
              {visibleDoctors.length}
            </span>
          </div>
          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
            <button
              className={`px-2.5 py-1 rounded-md transition-all duration-150 active:scale-95 ${visitTab === "all" ? "font-semibold text-emerald-800 bg-white shadow-xs" : "font-medium text-slate-600 hover:text-slate-900"}`}
              onClick={() => setVisitTab("all")}
            >
              All ({allCount})
            </button>
            <button
              className={`px-2.5 py-1 rounded-md transition-all duration-150 active:scale-95 ${visitTab === "pending" ? "font-semibold text-emerald-800 bg-white shadow-xs" : "font-medium text-slate-600 hover:text-slate-900"}`}
              onClick={() => setVisitTab("pending")}
            >
              Pending ({pendingCount})
            </button>
            <button
              className={`px-2.5 py-1 rounded-md transition-all duration-150 active:scale-95 ${visitTab === "completed" ? "font-semibold text-emerald-800 bg-white shadow-xs" : "font-medium text-slate-600 hover:text-slate-900"}`}
              onClick={() => setVisitTab("completed")}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>
        <div className="space-y-2.5">
          {visibleDoctors.map((doctor, index) => {
            const isExpanded = !!expandedCards[doctor.id];
            return (
              <div id={`doctor-card-${index + 1}`} key={doctor.id} className="visit-card bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-emerald-300 transition-all duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 cursor-pointer select-none" onClick={() => toggleCardExpand(doctor.id)}>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 hover:text-emerald-800 transition tracking-tight">{doctor.name}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0 leading-none">High Priority</span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">{doctor.specialty} · {doctor.city}</p>
                    <div className="mt-2 flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center border border-emerald-300">
                        A
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">Slot: 10:30 AM</span>
                      <button
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 active:scale-90 transition cursor-pointer"
                        title="Tap to advance status"
                        onClick={() => router.push(`/field/dcr?doctorId=${doctor.id}`)}
                      >
                        <span>Pending</span>
                        <span className="ml-1 text-[9px] opacity-75">↻</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0 pt-0.5">
                    <button
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 active:scale-90 transition shadow-xs cursor-pointer"
                      title="Call Doctor / Assistant"
                      onClick={() => setError("No phone number on file for this doctor")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                      </svg>
                    </button>
                    <button
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 active:scale-90 transition shadow-xs cursor-pointer"
                      title="Get GPS Directions"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctor.name + " " + doctor.city)}`, "_blank", "noopener,noreferrer")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
                      </svg>
                    </button>
                    <button className="expand-btn p-2 rounded-lg text-slate-400 hover:text-slate-700 active:scale-90 transition cursor-pointer" onClick={() => toggleCardExpand(doctor.id)}>
                      <svg className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Expandable Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-medium block">Address / Room</span>
                        <span className="text-slate-800 font-semibold">{doctor.city} Clinic</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 font-medium block">Last Visit</span>
                        <span className="text-slate-800 font-semibold">14 Days ago</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1">Target Sampling &amp; Visual Aid</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-white text-emerald-800 text-[10px] font-medium border border-emerald-200">Zivira Focus Rx</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">Rx Focus: Insulin Sensitizer trial data</span>
                      <button
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-300 active:scale-95 transition"
                        onClick={() => router.push(`/field/dcr?doctorId=${doctor.id}`)}
                      >
                        Mark as Visited
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
