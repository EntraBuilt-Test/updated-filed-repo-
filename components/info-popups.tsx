"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

// Information Upload UI shared by the admin (preview), field and manager portals: Flash News ticker, the Notice Board experience
// (animated modal with a carousel for several unseen notices, plus a compact home card) and the Quote of the Week card/preview.
// CSS animations only; every animation is switched off under prefers-reduced-motion. "Don't show again" is remembered per item AND
// per version (editing an item in admin bumps its version, so the edited item shows again).

export type InfoItem = {
  id: string; kind: "FLASH" | "NOTICE" | "QUOTE"; title: string; body: string; author: string; priority: "NORMAL" | "HIGH" | "URGENT"; pinned: boolean;
  startDate: string | null; endDate: string | null; attachmentUrl: string; attachmentName: string; version: number; createdBy?: string; createdAt?: string | null; updatedAt?: string | null;
};
export type InfoFeed = { flash: InfoItem[]; notices: InfoItem[]; quote: InfoItem | null; talkInfo: string };

const CSS = `
.zvi-ticker{display:flex;align-items:center;gap:12px;overflow:hidden;background:linear-gradient(90deg,#7c2d12,#c2410c);color:#fff;border-radius:10px;padding:6px 12px;font-size:13px}
.zvi-ticker-tag{flex:none;white-space:nowrap;font-weight:700;letter-spacing:.06em;font-size:11px;background:rgba(255,255,255,.2);border-radius:6px;padding:3px 12px;min-width:max-content}
.zvi-ticker-viewport{overflow:hidden;flex:1;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,#000 24px,#000 calc(100% - 24px),transparent)}
.zvi-ticker-track{display:inline-flex;gap:56px;padding-left:100%;animation:zvi-scroll var(--zvi-dur,30s) linear infinite}
.zvi-ticker:hover .zvi-ticker-track{animation-play-state:paused}
.zvi-ticker-item b{margin-right:6px}
@keyframes zvi-scroll{to{transform:translateX(-100%)}}
.zvi-overlay{position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.5);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px);animation:zvi-fade .3s ease-out both}
.zvi-modal{width:min(560px,100%);max-height:88vh;overflow:auto;animation:zvi-pop .35s cubic-bezier(.2,.9,.3,1.2) both}
.zvi-stagger>*{opacity:0;transform:translateY(8px);animation:zvi-rise .4s ease-out forwards}
.zvi-stagger>*:nth-child(1){animation-delay:.12s}.zvi-stagger>*:nth-child(2){animation-delay:.2s}.zvi-stagger>*:nth-child(3){animation-delay:.28s}.zvi-stagger>*:nth-child(4){animation-delay:.36s}.zvi-stagger>*:nth-child(5){animation-delay:.44s}
.zvi-quote-card{color:#fff;border-radius:22px;padding:34px 28px;background:linear-gradient(120deg,#4338ca,#7e22ce,#be185d,#4338ca);background-size:300% 300%;animation:zvi-grad 9s ease infinite;box-shadow:0 22px 60px rgba(0,0,0,.4);text-align:center}
.zvi-quote-card q{display:block;font-size:24px;line-height:1.35;font-weight:600;quotes:"\\201C" "\\201D"}
.zvi-btn{border:1px solid rgba(0,0,0,.18);background:#fff;color:#111;border-radius:8px;padding:6px 14px;font-size:13px;cursor:pointer}
.zvi-btn:hover{background:#f1f5f9}
@keyframes zvi-fade{from{opacity:0}}
@keyframes zvi-pop{from{opacity:0;transform:scale(.88) translateY(10px)}}
@keyframes zvi-rise{to{opacity:1;transform:none}}
@keyframes zvi-grad{50%{background-position:100% 50%}}

/* ---- Notice Board popup ---- */
.zvn-card{--zvn-bg:#fff;--zvn-ink:#0f172a;--zvn-mute:#64748b;--zvn-line:#e2e8f0;--zvn-soft:#f1f5f9;position:relative;background:var(--zvn-bg);color:var(--zvn-ink);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(2,6,23,.45);animation:zvn-spring .55s cubic-bezier(.18,1.25,.32,1) both;font-family:inherit}
.dark .zvn-card,[data-theme="dark"] .zvn-card{--zvn-bg:#0f172a;--zvn-ink:#f1f5f9;--zvn-mute:#94a3b8;--zvn-line:#1e293b;--zvn-soft:#1e293b}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]):not(.light) .zvn-card{--zvn-bg:#0f172a;--zvn-ink:#f1f5f9;--zvn-mute:#94a3b8;--zvn-line:#1e293b;--zvn-soft:#1e293b}}
.zvn-head{position:relative;overflow:hidden;padding:20px 22px 22px;color:#fff;background:linear-gradient(115deg,#0f766e 0%,#14b8a6 45%,#f97316 100%);background-size:200% 200%;animation:zvn-flow 8s ease-in-out infinite}
.zvn-head::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);transform:translateX(-120%);animation:zvn-shimmer 3.6s ease-in-out 1s infinite;pointer-events:none}
.zvn-dots{position:absolute;inset:0;pointer-events:none}
.zvn-dots i{position:absolute;width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.55);animation:zvn-float 6s ease-in-out infinite}
.zvn-dots i:nth-child(1){left:12%;top:70%;animation-delay:0s}.zvn-dots i:nth-child(2){left:30%;top:30%;animation-delay:1.2s;width:4px;height:4px}.zvn-dots i:nth-child(3){left:58%;top:75%;animation-delay:2.1s}.zvn-dots i:nth-child(4){left:78%;top:25%;animation-delay:.6s;width:8px;height:8px;opacity:.6}.zvn-dots i:nth-child(5){left:90%;top:68%;animation-delay:3s;width:4px;height:4px}
.zvn-row{position:relative;display:flex;align-items:center;gap:14px}
.zvn-icon{position:relative;flex:none;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.22);display:grid;place-items:center}
.zvn-icon::before,.zvn-icon::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(255,255,255,.6);animation:zvn-ring 2.4s ease-out infinite}
.zvn-icon::after{animation-delay:1.2s}
.zvn-icon svg{width:24px;height:24px;animation:zvn-ring-bell 2.6s ease-in-out 1s infinite;transform-origin:50% 12%}
.zvn-pill{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.14em;border-radius:999px;padding:3px 10px;background:rgba(255,255,255,.25)}
.zvn-badge{margin-left:auto;font-size:11px;font-weight:800;letter-spacing:.06em;border-radius:999px;padding:3px 10px;color:#fff}
.zvn-badge.URGENT{background:#dc2626;animation:zvn-pulse 1.4s ease-in-out infinite}.zvn-badge.HIGH{background:#ea580c}.zvn-badge.NORMAL{background:#2563eb}
.zvn-body{padding:20px 22px 6px}
.zvn-body>*{opacity:0;transform:translateY(10px);animation:zvi-rise .45s ease-out forwards}
.zvn-body>*:nth-child(1){animation-delay:.2s}.zvn-body>*:nth-child(2){animation-delay:.3s}.zvn-body>*:nth-child(3){animation-delay:.4s}.zvn-body>*:nth-child(4){animation-delay:.5s}
.zvn-title{margin:0;font-size:24px;line-height:1.2;font-weight:800;letter-spacing:-.01em}
.zvn-text{margin:12px 0 0;font-size:15px;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:38vh;overflow:auto}
.zvn-chip{display:inline-flex;align-items:center;gap:6px;margin-top:14px;padding:6px 12px;border-radius:999px;background:var(--zvn-soft);color:var(--zvn-ink);font-size:13px;text-decoration:none;border:1px solid var(--zvn-line)}
.zvn-meta{margin:14px 0 0;font-size:12px;color:var(--zvn-mute)}
.zvn-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:14px 22px 20px;opacity:0;animation:zvi-rise .45s ease-out .6s forwards}
.zvn-nav{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--zvn-mute);width:100%}
.zvn-nav button{border:1px solid var(--zvn-line);background:var(--zvn-soft);color:var(--zvn-ink);border-radius:8px;width:30px;height:28px;cursor:pointer}
.zvn-nav button:disabled{opacity:.4;cursor:default}
.zvn-dotbar{display:flex;gap:6px;flex:1;justify-content:center}
.zvn-dotbar b{width:7px;height:7px;border-radius:50%;background:var(--zvn-line);transition:all .25s}
.zvn-dotbar b.on{width:20px;border-radius:4px;background:#0f766e}
.zvn-actions{display:flex;gap:10px;justify-content:flex-end;align-items:center;width:100%}
.zvn-ghost{background:none;border:0;color:var(--zvn-mute);font-size:13px;cursor:pointer;padding:8px 6px;text-decoration:underline}
.zvn-primary{border:0;border-radius:12px;padding:10px 26px;font-size:15px;font-weight:700;color:#fff;cursor:pointer;background:linear-gradient(135deg,#0f766e,#ea580c);box-shadow:0 8px 20px rgba(234,88,12,.3);transition:transform .15s}
.zvn-primary:hover{transform:translateY(-1px)}.zvn-primary:active{transform:scale(.97)}
.zvn-slide{animation:zvn-slide .35s cubic-bezier(.2,.8,.2,1) both}
.zvn-card :focus-visible{outline:3px solid #f97316;outline-offset:2px}

/* ---- Home cards ---- */
.zvn-home{--zvn-bg:#fff;--zvn-ink:#0f172a;--zvn-mute:#64748b;--zvn-line:#e2e8f0;display:flex;align-items:center;gap:10px;width:100%;text-align:left;cursor:pointer;border:1px solid #99f6e4;border-left:4px solid #0f766e;border-radius:14px;padding:9px 12px;background:linear-gradient(90deg,#f0fdfa,var(--zvn-bg));color:var(--zvn-ink);font-family:inherit;animation:zvi-rise .4s ease-out both;transition:box-shadow .2s,transform .2s}
.zvn-home:hover{box-shadow:0 6px 18px rgba(15,118,110,.18);transform:translateY(-1px)}
.dark .zvn-home,[data-theme="dark"] .zvn-home{--zvn-bg:#0f172a;--zvn-ink:#f1f5f9;--zvn-mute:#94a3b8;border-color:#115e59;background:linear-gradient(90deg,#042f2e,#0f172a)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]):not(.light) .zvn-home{--zvn-bg:#0f172a;--zvn-ink:#f1f5f9;--zvn-mute:#94a3b8;border-color:#115e59;background:linear-gradient(90deg,#042f2e,#0f172a)}}
.zvn-home-ic{position:relative;flex:none;width:30px;height:30px;border-radius:50%;background:#0f766e;color:#fff;display:grid;place-items:center}
.zvn-home-ic::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid #14b8a6;animation:zvn-ring 2.4s ease-out infinite}
.zvn-home-ic svg{width:16px;height:16px;animation:zvn-ring-bell 3s ease-in-out infinite;transform-origin:50% 12%}
.zvn-home-lbl{font-size:10px;font-weight:800;letter-spacing:.1em;color:#0f766e;text-transform:uppercase}
.dark .zvn-home-lbl{color:#5eead4}
.zvn-home-head{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:zvn-headline .5s ease-out both}
.zvn-count{flex:none;min-width:22px;height:22px;border-radius:11px;background:#ea580c;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 6px}
.zvn-quote{border:1px solid #fed7aa;border-radius:14px;padding:10px 14px;background:linear-gradient(135deg,#fff7ed,#fff);color:#7c2d12;position:relative;animation:zvi-rise .4s ease-out both}
.dark .zvn-quote,[data-theme="dark"] .zvn-quote{border-color:#7c2d12;background:linear-gradient(135deg,#431407,#0f172a);color:#fed7aa}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]):not(.light) .zvn-quote{border-color:#7c2d12;background:linear-gradient(135deg,#431407,#0f172a);color:#fed7aa}}
.zvn-quote-mark{position:absolute;left:10px;top:-4px;font-size:38px;line-height:1;font-family:Georgia,serif;opacity:.35}
.zvn-quote p{margin:0 0 0 22px;font-size:13px;font-style:italic;line-height:1.5}
.zvn-quote small{display:block;margin:4px 0 0 22px;font-size:11px;font-weight:700;opacity:.8}
.zvn-quote-lbl{display:block;margin:0 0 2px 22px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.75}

@keyframes zvn-spring{0%{opacity:0;transform:translateY(34px) scale(.9)}60%{opacity:1}100%{opacity:1;transform:none}}
@keyframes zvn-flow{50%{background-position:100% 50%}}
@keyframes zvn-shimmer{60%,100%{transform:translateX(120%)}}
@keyframes zvn-float{0%,100%{transform:translateY(0);opacity:.35}50%{transform:translateY(-16px);opacity:.9}}
@keyframes zvn-ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.65);opacity:0}}
@keyframes zvn-ring-bell{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(14deg)}82%{transform:rotate(-12deg)}88%{transform:rotate(8deg)}94%{transform:rotate(-4deg)}}
@keyframes zvn-pulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.6)}50%{box-shadow:0 0 0 7px rgba(220,38,38,0)}}
@keyframes zvn-slide{from{opacity:0;transform:translateX(var(--zvn-dir,24px))}}
@keyframes zvn-headline{from{opacity:0;transform:translateY(6px)}}
@media (max-width:480px){.zvn-title{font-size:21px}.zvn-head{padding:16px 16px 18px}.zvn-body{padding:16px 16px 4px}.zvn-foot{padding:12px 16px 16px}.zvn-primary{padding:10px 20px}}
@media (prefers-reduced-motion:reduce){
 .zvi-overlay,.zvi-modal,.zvi-quote-card,.zvn-card,.zvn-head,.zvn-head::after,.zvn-dots i,.zvn-icon::before,.zvn-icon::after,.zvn-icon svg,.zvn-badge.URGENT,.zvn-slide,.zvn-home,.zvn-home-ic::after,.zvn-home-ic svg,.zvn-home-head,.zvn-quote{animation:none!important}
 .zvn-body>*,.zvn-foot,.zvi-stagger>*{opacity:1!important;transform:none!important;animation:none!important}
 .zvi-ticker-viewport{white-space:normal;mask-image:none}.zvi-ticker-track{animation:none!important;padding-left:0;flex-wrap:wrap;gap:6px 24px}
}`;
const Styles = () => <style>{CSS}</style>;

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function InfoModal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && ref.current) {                                     // focus trap
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null);
        if (!f.length) { e.preventDefault(); return; }
        const first = f[0], last = f[f.length - 1], at = document.activeElement;
        if (e.shiftKey && (at === first || at === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
      }
    };
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
      <span className="zvi-ticker-tag">FLASH UPDATE</span>
      <div className="zvi-ticker-viewport">
        {/* every item once: the track starts off-screen to the right and runs left, so the same message is never visible twice */}
        <div className="zvi-ticker-track" style={{ ["--zvi-dur" as string]: `${dur}s` }}>
          {items.map((i) => <span key={i.id} className="zvi-ticker-item">{i.priority === "URGENT" && <b>URGENT:</b>}{i.title ? <b>{i.title}:</b> : null}{i.body}</span>)}
        </div>
      </div>
    </div>
  );
}

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const ClipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m21.4 11.1-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg>
);
const fmtDate = (v?: string | null) => { if (!v) return ""; const d = new Date(v); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };

/** The Notice Board modal. One notice, or a carousel (dots, "1 of 3", arrows, swipe) for several. "Got it" advances; the last one closes. */
export function NoticeCarousel({ items, onGotIt, onNever, onClose }: { items: InfoItem[]; onGotIt: (item: InfoItem) => void; onNever?: (item: InfoItem) => void; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(24);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const at = Math.min(i, Math.max(0, n - 1));
  const item = items[at];
  const go = useCallback((d: number) => { setDir(d > 0 ? 24 : -24); setI((x) => Math.min(Math.max(0, n - 1), Math.max(0, x + d))); }, [n]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [go]);
  if (!item) return null;
  const posted = [item.createdBy ? `Posted by ${item.createdBy}` : "", fmtDate(item.updatedAt || item.createdAt)].filter(Boolean).join(" · ");
  const window_ = (item.startDate || item.endDate) ? `${item.startDate ? `From ${item.startDate}` : ""}${item.startDate && item.endDate ? " " : ""}${item.endDate ? `until ${item.endDate}` : ""}` : "";
  return (
    <InfoModal onClose={onClose} label="Notice board">
      <Styles />
      <div className="zvn-card" onTouchStart={(e) => { touch.current = e.touches[0].clientX; }} onTouchEnd={(e) => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; touch.current = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); }}>
        <div className="zvn-head">
          <div className="zvn-dots" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="zvn-row">
            <span className="zvn-icon"><BellIcon /></span>
            <span className="zvn-pill">NOTICE BOARD</span>
            <span className={`zvn-badge ${item.priority}`}>{item.priority}</span>
          </div>
        </div>
        <div className="zvn-body zvn-slide" key={item.id + ":" + item.version} style={{ ["--zvn-dir" as string]: `${dir}px` }}>
          <h3 className="zvn-title">{item.title || "Notice"}</h3>
          <p className="zvn-text">{item.body}</p>
          {item.attachmentUrl ? <a className="zvn-chip" href={item.attachmentUrl} target="_blank" rel="noreferrer"><ClipIcon />{item.attachmentName || "Open attachment"}</a> : <span />}
          <p className="zvn-meta">{[posted, window_].filter(Boolean).join("  |  ")}</p>
        </div>
        <div className="zvn-foot">
          {n > 1 && (
            <div className="zvn-nav">
              <button type="button" onClick={() => go(-1)} disabled={at === 0} aria-label="Previous notice">&#8249;</button>
              <div className="zvn-dotbar" aria-hidden="true">{items.map((x, k) => <b key={x.id} className={k === at ? "on" : ""} />)}</div>
              <span aria-live="polite">{at + 1} of {n}</span>
              <button type="button" onClick={() => go(1)} disabled={at === n - 1} aria-label="Next notice">&#8250;</button>
            </div>
          )}
          <div className="zvn-actions">
            {onNever && <button type="button" className="zvn-ghost" onClick={() => onNever(item)}>Don&apos;t show again</button>}
            <button type="button" className="zvn-primary" onClick={() => { if (n === 1 || at === n - 1) { onGotIt(item); } else { onGotIt(item); } }}>Got it</button>
          </div>
        </div>
      </div>
    </InfoModal>
  );
}

/** Single-notice popup (admin "Preview popup", and anywhere one item is shown). */
export function NoticePopup({ item, onClose, onNever }: { item: InfoItem; onClose: () => void; onNever?: () => void }) {
  return <NoticeCarousel items={[item]} onGotIt={onClose} onNever={onNever ? () => onNever() : undefined} onClose={onClose} />;
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

// ── home panel cards (read the same feed the shell polls) ─────────────────
let sharedFeed: InfoFeed | null = null;
const listeners = new Set<() => void>();
const publishFeed = (f: InfoFeed) => { sharedFeed = f; listeners.forEach((l) => l()); };
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export function useInfoFeed(): InfoFeed | null { return useSyncExternalStore(subscribe, () => sharedFeed, () => null); }

/** Compact animated Notice Board card: icon, rotating headline when there are several, count badge; tap opens the full popup. */
export function NoticeCard() {
  const feed = useInfoFeed();
  const items = feed?.notices ?? [];
  const [k, setK] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (items.length < 2) return; const t = window.setInterval(() => setK((x) => x + 1), 5000); return () => window.clearInterval(t); }, [items.length]);
  if (!items.length) return null;
  const cur = items[k % items.length];
  return (
    <>
      <Styles />
      <button type="button" className="zvn-home" onClick={() => setOpen(true)} aria-label={`Notice Board, ${items.length} notice${items.length > 1 ? "s" : ""}. Open`}>
        <span className="zvn-home-ic"><BellIcon /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span className="zvn-home-lbl">Notice Board</span>
          <span className="zvn-home-head" key={cur.id + ":" + cur.version + ":" + k}>{cur.title ? `${cur.title}: ` : ""}{cur.body}</span>
        </span>
        {items.length > 1 && <span className="zvn-count">{items.length}</span>}
      </button>
      {open && <NoticeCarousel items={items} onGotIt={() => setOpen(false)} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Calm Quote for the Week card (no popup). */
export function QuoteCard() {
  const q = useInfoFeed()?.quote;
  if (!q) return null;
  return (
    <>
      <Styles />
      <div className="zvn-quote" role="figure" aria-label="Quote for the week">
        <span className="zvn-quote-mark" aria-hidden="true">&ldquo;</span>
        <span className="zvn-quote-lbl">Quote for the Week</span>
        <p>{q.body}</p>
        {q.author ? <small>- {q.author}</small> : null}
      </div>
    </>
  );
}

// ── host used by the field and manager portals ────────────────────────────
const SEEN_KEY = "zivira.info.hidden.v1"; // { [itemId]: version } -> "don't show again" for that version
const SESSION_KEY = "zivira.info.session.v1"; // ids already popped up in this browser session
const readJson = (s: Storage, k: string): Record<string, number | true> => { try { return JSON.parse(s.getItem(k) || "{}") || {}; } catch { return {}; } };
const writeJson = (s: Storage, k: string, v: unknown) => { try { s.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } };

// The feed is re-read when the tab/app regains focus, when the network comes back and every REFRESH_MS, so an item the admin adds, edits or
// deletes reaches an open portal without a reload. Unseen notices (per item AND version) open as one popup / carousel; a refetch only queues
// notices not already shown and drops queued ones that are gone. The Quote for the Week is a home card only (no popup).
const REFRESH_MS = 60_000;
export function InfoAnnouncements({ load }: { load: () => Promise<InfoFeed> }) {
  const [feed, setFeed] = useState<InfoFeed | null>(null);
  const [queue, setQueue] = useState<InfoItem[]>([]);
  useEffect(() => {
    let alive = true;
    const run = () => {
      load().then((f) => {
        if (!alive) return;
        setFeed(f); publishFeed(f);
        const hidden = readJson(localStorage, SEEN_KEY), session = readJson(sessionStorage, SESSION_KEY);
        const fresh = f.notices.filter((i) => hidden[i.id] !== i.version && session[i.id] !== i.version);
        setQueue((prev) => {
          const byId = new Map(fresh.map((i) => [i.id, i]));
          const kept = prev.filter((p) => byId.has(p.id)).map((p) => byId.get(p.id)!);      // still published (latest text)
          const have = new Set(kept.map((p) => p.id));
          return [...kept, ...fresh.filter((i) => !have.has(i.id))];
        });
      }).catch(() => undefined);
    };
    run();
    const timer = window.setInterval(run, REFRESH_MS);
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    window.addEventListener("focus", run); window.addEventListener("online", run); document.addEventListener("visibilitychange", onVisible);
    return () => { alive = false; window.clearInterval(timer); window.removeEventListener("focus", run); window.removeEventListener("online", run); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const seen = useCallback((items: InfoItem[]) => {
    const s = readJson(sessionStorage, SESSION_KEY); for (const it of items) s[it.id] = it.version; writeJson(sessionStorage, SESSION_KEY, s);
    const ids = new Set(items.map((x) => x.id)); setQueue((q) => q.filter((x) => !ids.has(x.id)));
  }, []);
  const gotIt = useCallback((it: InfoItem) => seen([it]), [seen]);
  const never = useCallback((it: InfoItem) => {
    const h = readJson(localStorage, SEEN_KEY); h[it.id] = it.version; writeJson(localStorage, SEEN_KEY, h); seen([it]);
  }, [seen]);

  return (
    <>
      {feed && feed.flash.length > 0 && <div style={{ margin: "0 0 10px" }}><FlashTicker items={feed.flash} /></div>}
      {queue.length > 0 && <NoticeCarousel items={queue} onGotIt={gotIt} onNever={never} onClose={() => seen(queue)} />}
    </>
  );
}
