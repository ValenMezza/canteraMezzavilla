"use client";

import { useTable, type Cliente } from "@/lib/hooks";

export default function ClientesPage() {
  const { data: clientes, loading } = useTable<Cliente>("clientes", "nombre", true);

  if (loading) return <div className="flex items-center justify-center h-64 text-text-dim">Cargando...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-5">Clientes</h1>
      <p className="text-text-dim text-sm">
        Módulo de clientes conectado a Supabase. {clientes.length} clientes cargados.
      </p>
      {/* TODO: Migrar el componente completo de clientes del artifact */}
    </div>
  );
}
