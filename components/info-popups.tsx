"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// Round 48 Part D -- animated Information Upload popups, shared by the admin (preview), field and manager
// portals: Flash News ticker, Notice Board (pinned card flip), Quote of the Week (animated gradient card).
// Every animation is switched off under prefers-reduced-motion. "Don't show again" is remembered per item
// AND per version (editing an item in admin bumps its version, so the edited item shows again).

export type InfoItem = {
  id: string; kind: "FLASH" | "NOTICE" | "QUOTE"; title: string; body: string; author: string; priority: "NORMAL" | "HIGH" | "URGENT"; pinned: boolean;
  startDate: string | null; endDate: string | null; attachmentUrl: string; attachmentName: string; version: number;
};
export type InfoFeed = { flash: InfoItem[]; notices: InfoItem[]; quote: InfoItem | null; talkInfo: string };

const CSS = `
.zvi-ticker{display:flex;align-items:center;gap:12px;overflow:hidden;background:linear-gradient(90deg,#7c2d12,#c2410c);color:#fff;border-radius:10px;padding:6px 12px;font-size:13px}
.zvi-ticker-tag{flex:none;font-weight:700;letter-spacing:.06em;font-size:11px;background:rgba(255,255,255,.2);border-radius:6px;padding:2px 8px}
.zvi-ticker-viewport{overflow:hidden;flex:1;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}
.zvi-ticker-track{display:inline-flex;gap:56px;padding-left:100%;animation:zvi-scroll var(--zvi-dur,30s) linear infinite}
.zvi-ticker:hover .zvi-ticker-track{animation-play-state:paused}
.zvi-ticker-item b{margin-right:6px}
@keyframes zvi-scroll{to{transform:translateX(-100%)}}
.zvi-overlay{position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.55);animation:zvi-fade .25s ease-out both}
.zvi-modal{width:min(560px,100%);max-height:88vh;overflow:auto;animation:zvi-pop .35s cubic-bezier(.2,.9,.3,1.2) both}
.zvi-stagger>*{opacity:0;transform:translateY(8px);animation:zvi-rise .4s ease-out forwards}
.zvi-stagger>*:nth-child(1){animation-delay:.12s}.zvi-stagger>*:nth-child(2){animation-delay:.2s}.zvi-stagger>*:nth-child(3){animation-delay:.28s}.zvi-stagger>*:nth-child(4){animation-delay:.36s}.zvi-stagger>*:nth-child(5){animation-delay:.44s}
.zvi-notice{perspective:900px}
.zvi-notice-card{background:#fffbea;color:#3f2d00;border:1px solid #f1d98a;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:22px;position:relative;transform-origin:left center;animation:zvi-flip .7s cubic-bezier(.2,.8,.2,1) both}
.zvi-pin{position:absolute;top:-10px;right:22px;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fca5a5,#b91c1c);box-shadow:0 3px 6px rgba(0,0,0,.4)}
.zvi-quote-card{color:#fff;border-radius:22px;padding:34px 28px;background:linear-gradient(120deg,#4338ca,#7e22ce,#be185d,#4338ca);background-size:300% 300%;animation:zvi-grad 9s ease infinite;box-shadow:0 22px 60px rgba(0,0,0,.4);text-align:center}
.zvi-quote-card q{display:block;font-size:24px;line-height:1.35;font-weight:600;quotes:"\\201C" "\\201D"}
.zvi-btn{border:1px solid rgba(0,0,0,.18);background:#fff;color:#111;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer}
.zvi-btn:hover{background:#f1f5f9}
.zvi-urgent{background:#b91c1c;color:#fff;border-radius:6px;padding:1px 8px;font-size:11px;font-weight:700;margin-left:8px}
@keyframes zvi-fade{from{opacity:0}}
@keyframes zvi-pop{from{opacity:0;transform:scale(.88) translateY(10px)}}
@keyframes zvi-rise{to{opacity:1;transform:none}}
@keyframes zvi-flip{from{opacity:0;transform:rotateY(-80deg) scale(.95)}}
@keyframes zvi-grad{50%{background-position:100% 50%}}
@media (prefers-reduced-motion:reduce){
 .zvi-overlay,.zvi-modal,.zvi-notice-card,.zvi-quote-card{animation:none!important}
 .zvi-stagger>*{opacity:1!important;transform:none!important;animation:none!important}
 .zvi-ticker-viewport{white-space:normal;mask-image:none}.zvi-ticker-track{animation:none!important;padding-left:0;flex-wrap:wrap;gap:6px 24px}
}`;
const Styles = () => <style>{CSS}</style>;

export function InfoModal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="zvi-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zvi-modal" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} ref={ref} style={{ outline: "none" }}>{children}</div>
    </div>
  );
}

export function FlashTicker({ items }: { items: InfoItem[] }) {
  if (!items.length) return null;
  const dur = Math.max(18, items.reduce((n, i) => n + i.body.length, 0) * 0.28);
  return (
    <div className="zvi-ticker" role="marquee" aria-label="Flash news">
      <Styles />
      <span className="zvi-ticker-tag">FLASH</span>
      <div className="zvi-ticker-viewport">
        <div className="zvi-ticker-track" style={{ ["--zvi-dur" as string]: `${dur}s` }}>
          {items.map((i) => <span key={i.id} className="zvi-ticker-item">{i.priority === "URGENT" && <b>URGENT:</b>}{i.title ? <b>{i.title}:</b> : null}{i.body}</span>)}
        </div>
      </div>
    </div>
  );
}

export function NoticePopup({ item, onClose, onNever }: { item: InfoItem; onClose: () => void; onNever?: () => void }) {
  return (
    <InfoModal onClose={onClose} label="Notice board">
      <Styles />
      <div className="zvi-notice">
        <div className="zvi-notice-card">
          <span className="zvi-pin" aria-hidden="true" />
          <div className="zvi-stagger">
            <div style={{ fontSize: 11, letterSpacing: ".08em", fontWeight: 700, opacity: 0.7 }}>NOTICE BOARD{item.priority === "URGENT" && <span className="zvi-urgent">URGENT</span>}</div>
            {item.title && <h3 style={{ margin: "6px 0 0", fontSize: 22, fontWeight: 700 }}>{item.title}</h3>}
            <p style={{ margin: "10px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 15 }}>{item.body}</p>
            {(item.startDate || item.endDate) && <p style={{ margin: "10px 0 0", fontSize: 12, opacity: 0.7 }}>{item.startDate ? `From ${item.startDate}` : ""}{item.startDate && item.endDate ? " " : ""}{item.endDate ? `until ${item.endDate}` : ""}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {item.attachmentUrl && <a className="zvi-btn" href={item.attachmentUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>Open {item.attachmentName || "attachment"}</a>}
              {onNever && <button type="button" className="zvi-btn" onClick={onNever}>Don&apos;t show again</button>}
              <button type="button" className="zvi-btn" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </InfoModal>
  );
}

export function QuotePopup({ item, onClose, onNever }: { item: InfoItem; onClose: () => void; onNever?: () => void }) {
  return (
    <InfoModal onClose={onClose} label="Quote of the week">
      <Styles />
      <div className="zvi-quote-card">
        <div className="zvi-stagger">
          <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 700, opacity: 0.85 }}>QUOTE OF THE WEEK</div>
          <q style={{ marginTop: 14 }}>{item.body}</q>
          {item.author && <div style={{ marginTop: 14, fontSize: 15, opacity: 0.9 }}>- {item.author}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "center", flexWrap: "wrap" }}>
            {onNever && <button type="button" className="zvi-btn" onClick={onNever}>Don&apos;t show again</button>}
            <button type="button" className="zvi-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </InfoModal>
  );
}

// ── host used by the field and manager portals ────────────────────────────
const SEEN_KEY = "zivira.info.hidden.v1"; // { [itemId]: version } -> "don't show again" for that version
const SESSION_KEY = "zivira.info.session.v1"; // ids already popped up in this browser session
const readJson = (s: Storage, k: string): Record<string, number | true> => { try { return JSON.parse(s.getItem(k) || "{}") || {}; } catch { return {}; } };
const writeJson = (s: Storage, k: string, v: unknown) => { try { s.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

export function InfoAnnouncements({ load }: { load: () => Promise<InfoFeed> }) {
  const [feed, setFeed] = useState<InfoFeed | null>(null);
  const [queue, setQueue] = useState<InfoItem[]>([]);
  useEffect(() => {
    let alive = true;
    load().then((f) => {
      if (!alive) return;
      setFeed(f);
      const hidden = readJson(localStorage, SEEN_KEY), session = readJson(sessionStorage, SESSION_KEY);
      const pending = [...f.notices, ...(f.quote ? [f.quote] : [])].filter((i) => hidden[i.id] !== i.version && !session[i.id]);
      setQueue(pending);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, [load]);

  const current = queue[0];
  const close = useCallback(() => {
    if (!current) return;
    const s = readJson(sessionStorage, SESSION_KEY); s[current.id] = true; writeJson(sessionStorage, SESSION_KEY, s);
    setQueue((q) => q.slice(1));
  }, [current]);
  const never = useCallback(() => {
    if (!current) return;
    const h = readJson(localStorage, SEEN_KEY); h[current.id] = current.version; writeJson(localStorage, SEEN_KEY, h);
    close();
  }, [current, close]);

  return (
    <>
      {feed && feed.flash.length > 0 && <div style={{ margin: "0 0 10px" }}><FlashTicker items={feed.flash} /></div>}
      {current && (current.kind === "QUOTE" ? <QuotePopup item={current} onClose={close} onNever={never} /> : <NoticePopup item={current} onClose={close} onNever={never} />)}
    </>
  );
}
