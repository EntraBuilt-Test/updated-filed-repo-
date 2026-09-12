
"use client";

import type { FieldDashboard } from "@zivira/types";
import { useEffect, useState } from "react";
import { PayrollStatusCard } from "@/components/payroll-status-card";
import { apiClient } from "@/lib/api-client";

export default function ProfilePage() {
  const [dashboard, setDashboard] = useState<FieldDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.dashboard();
      setDashboard(response.data);
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
    loadProfile();
  };

  const profile = dashboard?.profile;
  const initial = profile?.name ? profile.name.substring(0, 2).toUpperCase() : "MR";

  return (
    <div className="flex-1 px-4 pt-4 pb-28 space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{error}</div>}
      
      {/* Hero Profile Card */}
      <section className="bg-white rounded-2xl p-4 shadow-card border border-slate-200/80 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"></div>
        
        <div className="flex items-start gap-3.5 pt-1">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-800 via-emerald-800 to-teal-700 flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white ring-2 ring-emerald-100">
              {initial}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">{profile?.name || "Field Profile"}</h2>
              <span className="inline-flex items-center text-emerald-600" title="Verified Medical Representative">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path clipRule="evenodd" fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-0.5">Senior Medical Representative (KOL Specialist)</p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                MR • {profile?.role || "FIELD_FORCE"}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                HQ: {profile?.territory?.split(' ')[0] || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Employee Code</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">{profile?.employeeCode || "--"}</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Division</span>
            <span className="font-semibold text-slate-800">{profile?.division || "--"}</span>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Assigned Territory</span>
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              {profile?.territory || "--"}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium">Driving License</span>
            <span className="font-mono font-medium text-slate-700 flex items-center gap-1">
              {profile?.drivingLicense || "--"}
              <svg className="w-3.5 h-3.5 text-emerald-600 inline" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button onClick={handleRefresh} className={`flex-1 py-2.5 px-3 bg-white border ${isRefreshing ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300 text-slate-700'} hover:border-emerald-600 rounded-xl text-xs font-semibold hover:text-emerald-700 shadow-2xs flex items-center justify-center gap-2 active:scale-95 transition-all`}>
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <span>{isRefreshing ? 'Updating...' : loading ? 'Loading...' : 'Refresh profile'}</span>
          </button>
          <button className="flex-1 py-2.5 px-3 bg-forest-800 hover:bg-forest-900 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all ring-1 ring-emerald-500/20">
            <div className="relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
            </div>
            <span>Notifications (3)</span>
          </button>
        </div>
      </section>

      <PayrollStatusCard />

      <section className="bg-white rounded-2xl p-4 shadow-card border border-slate-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            September Field Metrics
          </h3>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Rank #2 in South
          </span>
        </div>
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Doctor Call Coverage</span>
            <span className="text-slate-900 font-mono">112 / 120 (93.3%)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full w-[93.3%]"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-medium block">Daily Allowance</span>
              <span className="font-bold text-emerald-700">Eligible (Full Day)</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-[10px] font-medium block">Geofence Compliance</span>
              <span className="font-bold text-slate-800">100% In-Bounds</span>
            </div>
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path clipRule="evenodd" fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            Device: Knox Secured (Enterprise)
          </span>
          <span className="font-mono">v2.4.1 (Build 491)</span>
        </div>
      </section>

      <section className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 shadow-card flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Need help with claims?</h4>
          <p className="text-xs text-slate-600 mt-0.5">Contact MR Support Desk or HR Area Manager</p>
        </div>
        <button className="px-3 py-1.5 bg-forest-800 hover:bg-forest-900 active:bg-forest-900 text-white font-semibold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5">
          <span>Support</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </button>
      </section>
    </div>
  );
}
