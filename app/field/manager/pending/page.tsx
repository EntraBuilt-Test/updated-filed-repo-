"use client";
import type { DcrExtended } from "@zivira/types";
import { Check, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function ManagerPendingPage() {
  const [dcrs, setDcrs] = useState<DcrExtended[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    apiClient.managerDcrs().then(r => setDcrs(r.data.filter(d => d.status === "SUBMITTED"))).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 className="section-title">Pending Approvals</h2>
        <button className="button button-secondary" onClick={load} type="button"><RefreshCw size={15} /> {loading ? "Loading" : "Refresh"}</button>
      </div>
      <ul className="list">
        {dcrs.map(dcr => (
          <li className="list-item" key={dcr.id}>
            <div style={{ flex:1 }}>
              <strong>{dcr.employeeName ?? dcr.employeeCode}</strong>
              <p className="muted">{dcr.productsDetailed?.join(", ")} · {dcr.callSession}</p>
            </div>
            <span style={{ display:"flex", gap:8 }}>
              <button onClick={() => apiClient.approveDcr(dcr.id).then(load)} type="button" className="button" style={{ padding:"5px 10px", fontSize:12 }}><Check size={13} /></button>
              <button onClick={() => apiClient.rejectDcr(dcr.id).then(load)} type="button" className="button button-secondary" style={{ padding:"5px 10px", fontSize:12 }}><X size={13} /></button>
            </span>
          </li>
        ))}
        {!loading && dcrs.length === 0 && <li className="list-item"><p className="muted">No pending DCRs</p></li>}
      </ul>
    </div>
  );
}
