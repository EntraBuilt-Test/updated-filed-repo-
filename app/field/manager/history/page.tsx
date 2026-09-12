"use client";
import type { DcrExtended } from "@zivira/types";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { StatusBadge } from "@/components/page-components";

export default function ManagerHistoryPage() {
  const [dcrs, setDcrs] = useState<DcrExtended[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.managerDcrs().then(r => setDcrs(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 className="section-title">DCR History</h2>
        <button className="button button-secondary" onClick={() => { setLoading(true); apiClient.managerDcrs().then(r => setDcrs(r.data)).finally(() => setLoading(false)); }} type="button">
          <RefreshCw size={15} /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>
      <ul className="list">
        {dcrs.map(dcr => (
          <li className="list-item" key={dcr.id}>
            <div style={{ flex:1 }}>
              <strong>{dcr.employeeName ?? dcr.employeeCode}</strong>
              <p className="muted">{dcr.productsDetailed?.join(", ")} · {dcr.callSession ?? "—"}</p>
            </div>
            <StatusBadge status={dcr.status} />
          </li>
        ))}
        {!loading && dcrs.length === 0 && <li className="list-item"><p className="muted">No DCRs yet</p></li>}
      </ul>
    </div>
  );
}
