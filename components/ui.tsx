"use client";

import { useState, useCallback } from "react";

// ─── Format Helpers ─────────────────────────────────────
export const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);
export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
export const fmtShort = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
export const fmtDateOnly = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
export const toISO = (d: string) => (d ? new Date(d).toISOString().slice(0, 10) : "");

// ─── Common icon paths ──────────────────────────────────
export const icons = {
  plus: "M12 5v14 M5 12h14",
  search: "M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M21 21l-4.35-4.35",
  edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
  dollar: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18 M6 6l12 12",
  history: "M12 8v4l3 3 M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5",
  print: "M6 9V2h12v7 M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  cart: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
  truck: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
};

// ─── SVG Icon ───────────────────────────────────────────
export function Ic({ d, size = 14, className = "text-text-dim" }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// ─── Modal ──────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`bg-surface border border-border rounded-xl p-6 ${width} w-full max-h-[88vh] overflow-auto shadow-2xl`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text-main"><Ic d={icons.x} size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ─────────────────────────────────────
export function ConfirmModal({ open, msg, onYes, onNo }: { open: boolean; msg: string; onYes: () => void; onNo: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="bg-surface border border-border rounded-xl p-6 w-96 text-center">
        <p className="text-sm mb-5 leading-relaxed">{msg}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onNo} className="px-5 py-2 bg-surface-alt border border-border rounded-md text-sm font-semibold">No</button>
          <button onClick={onYes} className="px-5 py-2 bg-accent text-bg rounded-md text-sm font-semibold">Sí</button>
        </div>
      </div>
    </div>
  );
}

// ─── Field Label ────────────────────────────────────────
export function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] font-semibold text-text-dim uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────
export function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex-1 min-w-[130px]">
      <div className="text-[11px] text-text-dim uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-xl font-bold ${accent || "text-text-main"}`}>{value}</div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────
export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="text-center py-10 text-text-muted">
      <Ic d={icon} size={32} className="text-text-muted mx-auto" />
      <p className="mt-3 text-sm">{text}</p>
    </div>
  );
}

// ─── Print Preview (download HTML) ──────────────────────
const printCSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:28px;color:#222;font-size:13px}
h2{font-size:14px;margin:16px 0 8px;border-bottom:2px solid #c9a24d;padding-bottom:4px}
.sub{color:#666;font-size:11px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;margin-bottom:14px}
th,td{border:1px solid #ddd;padding:5px 8px;text-align:left;font-size:11px}
th{background:#f5f0e5;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:.5px}
.r{text-align:right}.b{font-weight:700}.a{color:#a8862f}.d{color:#c0392b}.s{color:#27ae60}
.tot td{font-weight:700;background:#faf6eb;font-size:12px}
.badge{display:inline-block;padding:1px 7px;border-radius:8px;font-size:9px;font-weight:600}
.bg-g{background:#d4edda;color:#155724}.bg-r{background:#f8d7da;color:#721c24}.bg-y{background:#fff3cd;color:#856404}
.detail{margin:10px 0;padding:10px;background:#fafafa;border:1px solid #eee;border-radius:4px;font-size:11px}
@media print{body{padding:14px}}`;

export function buildPrintHTML(title: string, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${printCSS}</style></head><body>
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;border-bottom:3px solid #c9a24d;padding-bottom:12px">
<div><div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#666">SISTEMAS</div><div style="font-size:20px;font-weight:800;letter-spacing:2px;color:#333"><span style="color:#c9a24d">MEZZAVILLA</span></div><div style="color:#666;font-size:11px">Sistema de Gestión de Áridos</div></div>
<div style="text-align:right"><div style="font-size:11px;color:#666">Impreso</div><div style="font-size:13px;font-weight:600">${fmtDate(new Date().toISOString())}</div></div></div>
${body}</body></html>`;
}

export function downloadHTML(title: string, body: string) {
  const html = buildPrintHTML(title, body);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, "").replace(/ +/g, "_")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Input class ────────────────────────────────────────
export const inputCls = "w-full bg-bg border border-border rounded-md px-3.5 py-2.5 text-sm text-text-main outline-none focus:border-accent transition-colors";
export const selectCls = inputCls + " cursor-pointer";
export const btnPrimary = "bg-accent text-bg px-5 py-2.5 rounded-md font-semibold text-sm hover:brightness-110 transition-all";
export const btnSecondary = "bg-surface-alt text-text-main border border-border px-5 py-2.5 rounded-md font-semibold text-sm";
export const btnDanger = "bg-red-500 text-white px-5 py-2.5 rounded-md font-semibold text-sm";
export const btnSmall = "px-3 py-1.5 rounded text-xs font-semibold transition-colors";