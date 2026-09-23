"use client";

// Item 1 — real notifications for the FieldRepo portal, replacing the old
// static placeholder copy ("Notification engine placeholder ready for
// WebSocket and push integration"). Polls GET /field/notices (chosen over
// WebSockets for this build — simple, reliable, no new backend infra) so
// this MR sees, in near-real-time, every tenant-wide broadcast plus every
// action their manager takes on their own DCRs / Tour Plans / Expense
// Claims / Payroll (approve, reject, void, reassign — see
// notifyFieldRepByCode() in the backend's manager.routes.ts).
import { AlertTriangle, Bell, BellRing } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, type FieldNotice } from "@/lib/api-client";
import { PageHeader } from "@/components/page-components";

const POLL_INTERVAL_MS = 20000;

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsPage() {
  const [notices, setNotices] = useState<FieldNotice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const latestSeenAt = useRef<string | null>(null);

  const load = useCallback(async (isPoll: boolean) => {
    try {
      const response = await apiClient.notices();
      setNotices(response.data);
      setError("");
      if (response.data.length > 0) latestSeenAt.current = response.data[0].createdAt;
    } catch (loadError) {
      // A background poll failing shouldn't blank out notices already on
      // screen — only surface the error on the very first load.
      if (!isPoll) setError(loadError instanceof Error ? loadError.message : "Unable to load notifications");
    } finally {
      if (!isPoll) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
    const interval = setInterval(() => load(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Alerts"
        description="Real-time updates whenever your manager approves, rejects, voids, or reassigns your DCRs, Tour Plans, expense claims, or payroll — plus broadcasts from HQ."
      />
      {error && (
        <p className="list-item" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--red)" }}>
          <AlertTriangle size={16} /> {error}
        </p>
      )}
      {loading ? (
        <p className="muted">Loading notifications…</p>
      ) : notices.length === 0 ? (
        <div className="list-item">
          <strong><Bell size={16} /> No notifications yet</strong>
          <p className="muted">You&apos;ll see manager approvals, rejections, and HQ broadcasts here as they happen.</p>
        </div>
      ) : (
        <ul className="list">
          {notices.map((notice) => (
            <li className="list-item" key={notice.id}>
              <strong style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <BellRing size={16} /> {notice.title}
                </span>
                {notice.priority === "URGENT" && <span className="badge badge-danger">Urgent</span>}
              </strong>
              <p className="muted">{notice.message}</p>
              <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>{timeAgo(notice.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
