"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ListTodo, RefreshCw } from "lucide-react";
import { apiClient, type FieldTask } from "@/lib/api-client";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function badgeClass(status: FieldTask["status"]) {
  if (status === "Completed" || status === "Closed") return "bg-emerald-50 text-emerald-800 border-emerald-300";
  if (status === "Hold" || status === "Cancel") return "bg-slate-100 text-slate-700 border-slate-300";
  return "bg-amber-50 text-amber-800 border-amber-300";
}

// Round 18 item 4 — "My Tasks". Reads real TaskModel assignments (GET
// /field/tasks, filtered by assignedToEmployeeCode server-side — a clean
// foreign key, unlike the two name-matched masters above). A field rep can
// acknowledge a New task (-> Pending) or mark it Completed; every other
// TaskModel status (Closed/ReOpen/Hold/Cancel) stays a manager/admin
// decision, per the coordinator's "don't over-build" guidance.
export function FieldTasks() {
  const [tasks, setTasks] = useState<FieldTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError("");
    apiClient.tasks().then((r) => setTasks(r.data)).catch((e) => setError(e instanceof Error ? e.message : "Unable to load tasks")).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: "Pending" | "Completed") {
    setBusyId(id);
    setError("");
    try {
      await apiClient.updateTaskStatus(id, status);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update task");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">{tasks.length} task(s) assigned to you</p>
        <button type="button" onClick={load} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
      {!loading && tasks.length === 0 && !error && (
        <p className="text-sm text-slate-500 italic px-1">No tasks assigned to you right now.</p>
      )}

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const deadline = formatDate(task.deadlineTo);
          return (
            <div key={task.id} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-card space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700 shrink-0">
                    <ListTodo size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">{task.modeOfTask}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {task.priority} priority{task.assignedByName ? ` · from ${task.assignedByName}` : ""}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${badgeClass(task.status)}`}>
                  {task.status}
                </span>
              </div>
              {task.description && <p className="text-[11px] text-slate-600">{task.description}</p>}
              {deadline && (
                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={11} /> Due {deadline}</p>
              )}
              {(task.status === "New" || task.status === "Pending") && (
                <div className="flex gap-2 pt-1">
                  {task.status === "New" && (
                    <button type="button" disabled={busyId === task.id} onClick={() => updateStatus(task.id, "Pending")} className="flex-1 py-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200">
                      Acknowledge
                    </button>
                  )}
                  <button type="button" disabled={busyId === task.id} onClick={() => updateStatus(task.id, "Completed")} className="flex-1 py-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Mark Completed
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
