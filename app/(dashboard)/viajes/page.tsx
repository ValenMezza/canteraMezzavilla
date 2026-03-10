"use client";

import { useTable, type Viaje } from "@/lib/hooks";

export default function ViajesPage() {
  const { data: viajes, loading } = useTable<Viaje>("viajes", "created_at", false);

  if (loading) return <div className="flex items-center justify-center h-64 text-text-dim">Cargando...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Venta de Viajes</h1>
      <p className="text-text-dim text-sm">
        Módulo de viajes conectado a Supabase. {viajes.length} viajes registrados.
      </p>
      {/* TODO: Migrar el componente completo de viajes del artifact */}
    </div>
  );
}
