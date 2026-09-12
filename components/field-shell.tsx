"use client";

import clsx from "clsx";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fieldNav } from "@/lib/nav";
import { clearToken } from "@/lib/api-client";
import { fetchCurrentLocation, readSavedLocation, type FieldLocation } from "@/lib/location";

export function FieldShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(true);
  const [location, setLocation] = useState<FieldLocation | null>(null);
  const [locating, setLocating] = useState(false);

  function signOut() {
    clearToken();
    router.push("/field/login");
  }

  async function refreshLocation() {
    setLocating(true);
    try {
      setLocation(await fetchCurrentLocation());
    } catch {
      setLocation(null);
    } finally {
      setLocating(false);
    }
  }

  useEffect(() => {
    setLocation(readSavedLocation());
    void refreshLocation();
  }, []);

  if (pathname === "/field/login") {
    return <>{children}</>;
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col shadow-2xl relative select-none tap-highlight-transparent pb-28">
      {/* Floating Toast Notification can go here or in TodayPanel */}
      
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <button
              aria-label="Menu"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 active:scale-90 transition-all duration-150 ease-out shadow-xs cursor-pointer"
              onClick={() => setNavOpen((o) => !o)}
            >
              {navOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <Link href="/field/today" className="flex items-center space-x-2 cursor-pointer select-none active:scale-95 transition-transform duration-150">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-bold text-base shadow-sm ring-1 ring-emerald-900/10 tracking-tight">
                Z
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-bold text-slate-900 leading-none tracking-tight">Zivira Field</h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 leading-none">
                    On Duty
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1 flex items-center gap-1">
                  <span>MR Workspace</span>
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-1.5">
            <button onClick={refreshLocation} className="flex items-center space-x-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-semibold text-emerald-800 transition-all duration-300 shadow-xs select-none cursor-pointer">
              <span className={`w-2 h-2 rounded-full ${locating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600 pulse-dot'}`}></span>
              <span>{locating ? "Locating..." : (location ? "GPS Active" : "Location req.")}</span>
            </button>
            <button
              onClick={signOut}
              className="inline-flex items-center px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg bg-white shadow-xs hover:bg-slate-50 active:scale-90 transition-all duration-150 ease-out cursor-pointer"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 pt-4 pb-6 space-y-4">{children}</main>
      
      {navOpen && (
        <nav className="fixed bottom-0 w-full max-w-md mx-auto grid grid-cols-7 border-t border-slate-200 bg-white/95 backdrop-blur-md z-40 pb-safe" aria-label="Field navigation">
          {fieldNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={clsx(
                  "flex flex-col items-center justify-center min-h-[62px] gap-1 text-[10px] font-extrabold transition-colors",
                  active ? "text-emerald-800 bg-emerald-50/50" : "text-slate-500 hover:text-emerald-700"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon size={19} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
