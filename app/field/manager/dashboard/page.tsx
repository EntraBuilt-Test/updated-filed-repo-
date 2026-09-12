"use client";
import { ManagerDashboard } from "@zivira/types";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { MetricCard } from "@/components/page-components";

export default function ManagerDashboardPage() {
  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.managerDashboard().then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 className="section-title">Manager Dashboard</h2>
        <button className="button button-secondary" onClick={() => { setLoading(true); apiClient.managerDashboard().then(r => setData(r.data)).finally(() => setLoading(false)); }} type="button">
          <RefreshCw size={15} /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>
      <section className="grid grid-2">
        <MetricCard label="Team Size"        value={String(data?.stats.teamSize ?? 0)}        trend="Direct reports" />
        <MetricCard label="DCRs Today"       value={String(data?.stats.totalDcrs ?? 0)}        trend="Submitted today" />
        <MetricCard label="Pending Approval" value={String(data?.stats.pendingApproval ?? 0)}  trend="Awaiting review" />
        <MetricCard label="Approved Today"   value={String(data?.stats.approvedToday ?? 0)}    trend="Reviewed today" />
      </section>
      <section style={{ marginTop:16 }}>
        <h2 className="section-title">My Team</h2>
        <ul className="list">
          {(data?.team ?? []).map(emp => (
            <li className="list-item" key={emp.id}>
              <strong>{emp.name}</strong>
              <p className="muted">{emp.designation} · {emp.territory}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
