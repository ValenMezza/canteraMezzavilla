"use client";

import { useTable, type VentaCantera } from "@/lib/hooks";

export default function CanteraPage() {
  const { data: ventas, loading } = useTable<VentaCantera>("ventas_cantera", "created_at", false);

  if (loading) return <div className="flex items-center justify-center h-64 text-text-dim">Cargando...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Venta en Cantera</h1>
      <p className="text-text-dim text-sm">
        Módulo de ventas conectado a Supabase. {ventas.length} ventas registradas.
      </p>
      {/* TODO: Migrar el componente completo de cantera del artifact */}
    </div>
  );
}
