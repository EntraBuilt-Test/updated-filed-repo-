
"use client";

import type { Doctor } from "@zivira/types";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export function DoctorList() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  async function loadDoctors() {
    setError("");
    try {
      const response = await apiClient.doctors();
      setDoctors(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load doctors");
    }
  }

  useEffect(() => {
    void loadDoctors();
  }, []);

  return (
    <div className="space-y-4">
      {/* Search & Scan Bar */}
      <div className="relative flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input 
            type="search" 
            placeholder="Search doctor, hospital, specialty..." 
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-700 shadow-sm font-normal" 
          />
          <button aria-label="Voice Search" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </button>
        </div>
        {/* Filter Modal Trigger */}
        <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
          </svg>
        </button>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5 -mx-4 px-4">
        <button className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-700 text-white shadow-sm">
          All ({doctors.length})
        </button>
        <button className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100">
          ★ VIP KOL ({doctors.filter(d => d.category === 'A').length})
        </button>
        <button className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
          Class A ({doctors.filter(d => d.category === 'A').length})
        </button>
        <button className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-slate-700 border border-slate-200">
          Class B ({doctors.filter(d => d.category === 'B').length})
        </button>
      </div>

      {/* Monthly Target / Route Planning Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-900 to-brand-800 rounded-2xl text-white shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-xs tracking-tight text-white">{doctors.length} Visits Remaining</h3>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-semibold border border-amber-400/30">7 Days Left</span>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">Reach 100% Monthly Call Average compliance</p>
          </div>
        </div>
        <button className="shrink-0 text-xs font-bold bg-white text-brand-800 px-3 py-1.5 rounded-lg shadow-sm hover:bg-emerald-50 active:scale-95 transition-all">
          Auto Route
        </button>
      </div>

      {/* Territory Action Tools */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold text-slate-700">Showing {doctors.length} Assigned Doctors</span>
        <button className="text-xs font-semibold text-brand-700 flex items-center space-x-1 hover:underline">
          <span>+ Request New Doctor</span>
        </button>
      </div>

      {error && <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded">{error}</p>}

      {/* DOCTOR CARDS LIST */}
      <div className="space-y-3.5">
        {doctors.map((doctor, index) => {
          const initials = doctor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
          
          // Generate a deterministic accent color based on index
          const colors = [
            { bg: "bg-emerald-500", text: "text-emerald-800", grad: "from-emerald-100 to-teal-200", border: "border-emerald-300/60" },
            { bg: "bg-indigo-500", text: "text-indigo-900", grad: "from-indigo-100 to-sky-200", border: "border-indigo-200" },
            { bg: "bg-rose-500", text: "text-rose-800", grad: "from-rose-100 to-amber-100", border: "border-rose-200" },
            { bg: "bg-slate-300", text: "text-slate-800", grad: "from-slate-100 to-slate-200", border: "border-slate-200" }
          ];
          const color = colors[index % colors.length];
          const isVip = doctor.category === 'A';

          return (
            <article key={doctor.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card hover:border-brand-600/40 transition-all relative overflow-hidden group">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.bg}`}></div>
              
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color.grad} ${color.text} flex items-center justify-center font-extrabold text-sm border ${color.border} shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-base leading-tight">{doctor.name}</h4>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-brand-800 border border-emerald-300">Class {doctor.category}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{doctor.specialty}</p>
                  </div>
                </div>
                {isVip && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1 shrink-0">
                    <svg className="w-3 h-3 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    <span>VIP KOL</span>
                  </span>
                )}
              </div>
              
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                  <span className="font-medium text-slate-800">{doctor.territory}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                  <span>{doctor.city}, {doctor.state}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Focus:</span>
                  <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">Zivacard 10</span>
                </div>
                <div className="flex items-center space-x-1 shrink-0">
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Due Today
                  </span>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors" title="Call Doctor">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  </button>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors" title="Clinic Navigation">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                  </button>
                  <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors" title="WhatsApp Message">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"></path></svg>
                  </button>
                </div>
                <button 
                  onClick={() => router.push('/field/dcr')}
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                  <span>Start DCR</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
