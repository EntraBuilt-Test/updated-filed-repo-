export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
    </div>
  );
}

export function MetricCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  return (
    <article className="card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="muted">{trend}</p>
    </article>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={status === "A" || status === "SUBMITTED" || status === "PRESENT" ? "badge" : "badge badge-warning"}>{status}</span>;
}
