"use client";

import { useCallback, useEffect, useState } from "react";

// Round 48 Part D -- "Talk to Us" for the field and manager portals: raise a ticket, read admin's replies, follow up.
export type TalkTicket = { id: string; subject: string; status: "OPEN" | "ANSWERED" | "CLOSED"; createdAt: string; updatedAt: string; replies: { by: "EMPLOYEE" | "ADMIN"; name: string; message: string; at: string }[] };
export type TalkApi = {
  list: () => Promise<TalkTicket[]>;
  create: (subject: string, message: string) => Promise<TalkTicket>;
  reply: (id: string, message: string) => Promise<TalkTicket>;
  info?: () => Promise<string>;
};
const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  OPEN: { bg: "#fef3c7", fg: "#92400e", label: "Waiting for reply" }, ANSWERED: { bg: "#dcfce7", fg: "#166534", label: "Answered" }, CLOSED: { bg: "#e5e7eb", fg: "#374151", label: "Closed" }
};
const box: React.CSSProperties = { border: "1px solid rgba(128,128,128,.35)", borderRadius: 12, padding: 14 };
const input: React.CSSProperties = { width: "100%", borderRadius: 8, border: "1px solid rgba(128,128,128,.5)", padding: "8px 10px", font: "inherit", background: "transparent", color: "inherit" };
const btn: React.CSSProperties = { borderRadius: 8, border: "none", padding: "8px 16px", background: "#2563eb", color: "#fff", font: "inherit", cursor: "pointer" };

export function TalkToUs({ api }: { api: TalkApi }) {
  const [tickets, setTickets] = useState<TalkTicket[]>([]);
  const [info, setInfo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setTickets(await api.list()); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Could not load your tickets"); } }, [api]);
  useEffect(() => { void load(); api.info?.().then(setInfo).catch(() => undefined); const id = window.setInterval(() => void load(), 60000); return () => window.clearInterval(id); }, [load, api]);

  async function submit() {
    setBusy(true); setError("");
    try { await api.create(subject, message); setSubject(""); setMessage(""); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not send"); } finally { setBusy(false); }
  }
  async function reply(id: string) {
    const m = replies[id]; if (!m?.trim()) return;
    setBusy(true); setError("");
    try { await api.reply(id, m); setReplies((r) => ({ ...r, [id]: "" })); await load(); } catch (e) { setError(e instanceof Error ? e.message : "Could not send"); } finally { setBusy(false); }
  }
  return (
    <div style={{ display: "grid", gap: 14, maxWidth: 720 }}>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Talk to Us</h2>
      {info && <p style={{ ...box, margin: 0, whiteSpace: "pre-wrap", fontSize: 14 }}>{info}</p>}
      <div style={{ ...box, display: "grid", gap: 8 }}>
        <input style={input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={150} />
        <textarea style={{ ...input, minHeight: 90 }} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} />
        <div><button type="button" style={{ ...btn, opacity: busy || !subject.trim() || !message.trim() ? 0.5 : 1 }} disabled={busy || !subject.trim() || !message.trim()} onClick={() => void submit()}>Send</button></div>
      </div>
      {error && <p style={{ color: "#b91c1c", margin: 0, fontSize: 13 }}>{error}</p>}
      {tickets.length === 0 && <p style={{ opacity: 0.7, fontSize: 14 }}>You have not raised any request yet.</p>}
      {tickets.map((t) => {
        const st = STATUS_STYLE[t.status];
        return (
          <div key={t.id} style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <b>{t.subject}</b><span style={{ background: st.bg, color: st.fg, borderRadius: 999, padding: "2px 10px", fontSize: 12 }}>{st.label}</span>
            </div>
            <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
              {t.replies.map((r, i) => (
                <div key={i} style={{ justifySelf: r.by === "ADMIN" ? "start" : "end", maxWidth: "85%", background: r.by === "ADMIN" ? "rgba(37,99,235,.14)" : "rgba(128,128,128,.18)", borderRadius: 12, padding: "6px 12px", fontSize: 14 }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>{r.by === "ADMIN" ? `${r.name || "Admin"} (Admin)` : "You"} - {new Date(r.at).toLocaleString()}</div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{r.message}</div>
                </div>
              ))}
            </div>
            {t.status !== "CLOSED" && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input style={input} placeholder="Reply..." value={replies[t.id] ?? ""} onChange={(e) => setReplies((r) => ({ ...r, [t.id]: e.target.value }))} onKeyDown={(e) => { if (e.key === "Enter") void reply(t.id); }} />
                <button type="button" style={btn} disabled={busy} onClick={() => void reply(t.id)}>Reply</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
