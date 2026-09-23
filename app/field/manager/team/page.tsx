"use client";
import type { Employee } from "@zivira/types";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function ManagerTeamPage() {
  const [team, setTeam] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.managerTeam().then(r => setTeam(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="toolbar">
        <h2 className="section-title">My Team ({team.length})</h2>
        <button className="button button-secondary" onClick={() => { setLoading(true); apiClient.managerTeam().then(r => setTeam(r.data)).finally(() => setLoading(false)); }} type="button">
          <RefreshCw size={15} /> {loading ? "Loading" : "Refresh"}
        </button>
      </div>
      <ul className="list">
        {team.map(emp => (
          <li className="list-item" key={emp.id}>
            <div>
              <strong>{emp.name}</strong>
              <p className="muted">{emp.designation} · {emp.territory} · {emp.employeeCode}</p>
            </div>
          </li>
        ))}
        {!loading && team.length === 0 && <li className="list-item"><p className="muted">No team members found</p></li>}
      </ul>
    </div>
  );
}
