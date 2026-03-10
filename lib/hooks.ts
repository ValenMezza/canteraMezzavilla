"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabase = createClient();

// ─── Generic hook for a Supabase table ─────────────────
export function useTable<T extends { id: string }>(
  table: string,
  orderBy: string = "created_at",
  ascending: boolean = false
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from(table)
      .select("*")
      .order(orderBy, { ascending });
    if (!error && rows) setData(rows as T[]);
    setLoading(false);
  }, [table, orderBy, ascending]);

  useEffect(() => {
    fetch();

    // Realtime subscription
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          fetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetch, table]);

  const insert = useCallback(
    async (row: Omit<T, "id" | "created_at">) => {
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(row)
        .select()
        .single();
      if (!error && inserted) {
        setData((prev) => [inserted as T, ...prev]);
      }
      return { data: inserted as T | null, error };
    },
    [table]
  );

  const update = useCallback(
    async (id: string, changes: Partial<T>) => {
      const { data: updated, error } = await supabase
        .from(table)
        .update(changes)
        .eq("id", id)
        .select()
        .single();
      if (!error && updated) {
        setData((prev) =>
          prev.map((r) => (r.id === id ? (updated as T) : r))
        );
      }
      return { data: updated as T | null, error };
    },
    [table]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (!error) {
        setData((prev) => prev.filter((r) => r.id !== id));
      }
      return { error };
    },
    [table]
  );

  return { data, loading, refetch: fetch, insert, update, remove, setData };
}

// ─── Auth hook ──────────────────────────────────────────
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signOut };
}

// ─── Types ──────────────────────────────────────────────
export interface Producto {
  id: string;
  nombre: string;
  unidad: string;
  precio: number;
  stock: number;
  created_at: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  cuenta_corriente: boolean;
  saldo: number;
  created_at: string;
}

export interface VentaCantera {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  items: VentaItem[];
  total: number;
  forma_pago: string;
  nota: string;
  created_at: string;
}

export interface VentaItem {
  producto_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
}

export interface Viaje {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  telefono_contacto: string;
  direccion_entrega: string;
  producto_id: string;
  producto_nombre: string;
  cantidad_producto: number;
  unidad_producto: string;
  precio_producto: number;
  precio_flete: number;
  total: number;
  fecha_entrega: string;
  hora_entrega: string;
  forma_pago: string;
  estado: "pendiente" | "finalizado" | "cancelado";
  nota: string;
  created_at: string;
}

export interface Movimiento {
  id: string;
  producto_id: string;
  producto_nombre: string;
  tipo: "ingreso" | "egreso" | "venta";
  cantidad: number;
  motivo: string;
  created_at: string;
}

export interface Pago {
  id: string;
  cliente_id: string;
  cliente_nombre: string;
  monto: number;
  metodo: string;
  nota: string;
  created_at: string;
}
