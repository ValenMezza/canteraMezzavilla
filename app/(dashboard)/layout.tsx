"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";

const nav = [
  { href: "/stock", label: "Stock", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12" },
  { href: "/clientes", label: "Clientes", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/cantera", label: "Venta Cantera", icon: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0" },
  { href: "/viajes", label: "Venta Viajes", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
];

function Ic({ d, size = 14, className = "" }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-bg text-text-main">
      {/* Sidebar */}
      <nav className="w-[195px] bg-surface border-r border-border flex flex-col py-4 shrink-0">
        <div className="px-4 mb-7">
          <div className="text-[11px] font-extrabold text-text-dim tracking-[3px]">
            SISTEMAS
          </div>
          <div className="text-[17px] font-extrabold text-accent tracking-[2px]">
            MEZZAVILLA
          </div>
          <div className="w-9 h-[3px] bg-accent rounded mt-1.5" />
        </div>

        {nav.map((n) => {
          const active = pathname === n.href;
          return (
            <button
              key={n.href}
              onClick={() => router.push(n.href)}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium w-full text-left transition-all border-l-[3px] ${
                active
                  ? "bg-accent-bg border-accent text-accent font-semibold"
                  : "border-transparent text-text-dim hover:text-text-main hover:bg-surface-alt"
              }`}
            >
              <Ic d={n.icon} className={active ? "text-accent" : "text-text-dim"} />
              {n.label}
            </button>
          );
        })}

        <div className="flex-1" />

        {/* User info */}
        <div className="px-4 pt-3 border-t border-border">
          <div className="text-[10px] text-text-muted truncate mb-2">
            {user?.email || "..."}
          </div>
          <button
            onClick={handleSignOut}
            className="text-[10px] text-text-muted hover:text-red-400 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto max-h-screen">{children}</main>
    </div>
  );
}
