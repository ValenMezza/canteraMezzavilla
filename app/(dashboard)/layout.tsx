"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";

const nav = [
  { href: "/stock", label: "Stock", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" },
  { href: "/clientes", label: "Clientes", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/cantera", label: "Cantera", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  { href: "/viajes", label: "Viajes", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
];

function Ic({ d, size = 14, className = "" }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  // Extract username from email (remove @mezzavilla.local or show email)
  const displayName = user?.email?.replace("@mezzavilla.local", "") || user?.email || "...";

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text-main">

      {/* ─── Desktop Sidebar (hidden on mobile) ─── */}
      <nav className="hidden md:flex w-[195px] bg-surface border-r border-border flex-col py-4 shrink-0 h-screen sticky top-0">
        <div className="px-4 mb-7">
          <div className="text-[11px] font-extrabold text-text-dim tracking-[3px]">SISTEMAS</div>
          <div className="text-[17px] font-extrabold text-accent tracking-[2px]">MEZZAVILLA</div>
          <div className="w-9 h-[3px] bg-accent rounded mt-1.5" />
        </div>

        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <button key={n.href} onClick={() => router.push(n.href)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium w-full text-left transition-all border-l-[3px] ${active ? "bg-accent-bg border-accent text-accent font-semibold" : "border-transparent text-text-dim hover:text-text-main hover:bg-surface-alt"}`}>
              <Ic d={n.icon} className={active ? "text-accent" : "text-text-dim"} />
              {n.label}
            </button>
          );
        })}

        <div className="flex-1" />
        <div className="px-4 pt-3 border-t border-border">
          <div className="text-[10px] text-text-muted truncate mb-2">{displayName}</div>
          <button onClick={handleSignOut} className="text-[10px] text-text-muted hover:text-red-400 transition-colors">Cerrar sesión</button>
        </div>
      </nav>

      {/* ─── Mobile Top Bar (hidden on desktop) ─── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-[9px] font-extrabold text-text-dim tracking-[2px] leading-none">SISTEMAS</div>
            <div className="text-[13px] font-extrabold text-accent tracking-[1.5px] leading-tight">MEZZAVILLA</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-muted">{displayName}</span>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-text-dim p-1">
            <Ic d={menuOpen ? "M18 6L6 18 M6 6l12 12" : "M3 12h18 M3 6h18 M3 18h18"} size={18} />
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-[52px] bg-black/50 z-30" onClick={() => setMenuOpen(false)}>
          <div className="bg-surface border-b border-border" onClick={(e) => e.stopPropagation()}>
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <button key={n.href} onClick={() => { router.push(n.href); setMenuOpen(false); }}
                  className={`flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left border-b border-border ${active ? "text-accent bg-accent/5 font-semibold" : "text-text-dim"}`}>
                  <Ic d={n.icon} size={16} className={active ? "text-accent" : "text-text-dim"} />
                  {n.label}
                </button>
              );
            })}
            <button onClick={handleSignOut} className="flex items-center gap-3 px-5 py-3.5 text-sm w-full text-left text-red-400">
              <Ic d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" size={16} className="text-red-400" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 md:max-h-screen">
        {children}
      </main>

      {/* ─── Mobile Bottom Nav (hidden on desktop) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex z-40 safe-area-bottom">
        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <button key={n.href} onClick={() => router.push(n.href)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${active ? "text-accent" : "text-text-muted"}`}>
              <Ic d={n.icon} size={18} className={active ? "text-accent" : "text-text-muted"} />
              <span className="text-[9px] font-semibold">{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
