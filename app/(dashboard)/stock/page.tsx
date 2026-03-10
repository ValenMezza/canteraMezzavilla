"use client";

import { useState } from "react";
import { useTable, type Producto, type Movimiento } from "@/lib/hooks";

export default function StockPage() {
  const {
    data: productos,
    loading,
    insert,
    update,
    remove,
  } = useTable<Producto>("productos", "nombre", true);
  const {
    data: movimientos,
    insert: insertMov,
  } = useTable<Movimiento>("movimientos", "created_at", false);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", unidad: "m³", precio: "", stock: "" });
  const [search, setSearch] = useState("");

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );
  const lowStock = productos.filter((p) => p.stock < 100);
  const totalStock = productos.reduce((s, p) => s + Number(p.stock), 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);

  const openAdd = () => {
    setEditId(null);
    setForm({ nombre: "", unidad: "m³", precio: "", stock: "" });
    setShowAdd(true);
  };

  const openEdit = (p: Producto) => {
    setEditId(p.id);
    setForm({ nombre: p.nombre, unidad: p.unidad, precio: String(p.precio), stock: String(p.stock) });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.precio) return;
    const data = {
      nombre: form.nombre,
      unidad: form.unidad,
      precio: parseFloat(form.precio),
      stock: parseFloat(form.stock) || 0,
    };
    if (editId) {
      await update(editId, data);
    } else {
      await insert(data as any);
    }
    setShowAdd(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-dim">
        Cargando stock...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">Gestión de Stock</h1>
        <button
          onClick={openAdd}
          className="bg-accent text-bg px-5 py-2.5 rounded-md font-semibold text-sm hover:brightness-110 transition-all"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text-dim uppercase tracking-wider mb-2">Productos</div>
          <div className="text-2xl font-bold">{productos.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text-dim uppercase tracking-wider mb-2">Stock Total</div>
          <div className="text-2xl font-bold">{totalStock.toLocaleString("es-AR")} m³</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-[11px] text-text-dim uppercase tracking-wider mb-2">Stock Bajo</div>
          <div className={`text-2xl font-bold ${lowStock.length > 0 ? "text-red-400" : "text-green-400"}`}>
            {lowStock.length}
          </div>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar producto..."
        className="w-full bg-bg border border-border rounded-md px-4 py-2.5 text-sm text-text-main outline-none focus:border-accent mb-4"
      />

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-alt">
              {["Producto", "Unidad", "Stock", "Precio", "Valor", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-text-dim uppercase tracking-wider font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-surface-alt/50 transition-colors">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3 text-text-dim">{p.unidad}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      p.stock < 100
                        ? "bg-red-500/10 text-red-400"
                        : p.stock < 300
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-green-500/10 text-green-400"
                    }`}
                  >
                    {Number(p.stock).toLocaleString("es-AR")}
                  </span>
                </td>
                <td className="px-4 py-3">{fmt(Number(p.precio))}</td>
                <td className="px-4 py-3 font-semibold text-accent">
                  {fmt(Number(p.precio) * Number(p.stock))}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => openEdit(p)}
                      className="px-3 py-1.5 bg-surface-alt text-text-dim rounded text-xs hover:text-text-main transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-text-muted text-sm">Sin productos</div>
        )}
      </div>

      {/* Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold mb-4">
              {editId ? "Editar Producto" : "Nuevo Producto"}
            </h3>
            <div className="mb-3">
              <label className="block text-[11px] text-text-dim uppercase tracking-wider mb-1 font-semibold">Nombre</label>
              <input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-text-dim uppercase tracking-wider mb-1 font-semibold">Unidad</label>
                <select
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none"
                >
                  <option value="m³">m³</option>
                  <option value="tn">Tn</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-text-dim uppercase tracking-wider mb-1 font-semibold">Precio</label>
                <input
                  type="number"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[11px] text-text-dim uppercase tracking-wider mb-1 font-semibold">Stock</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full bg-bg border border-border rounded-md px-3 py-2 text-sm text-text-main outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-surface-alt text-text-main border border-border rounded-md text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-accent text-bg rounded-md text-sm font-semibold hover:brightness-110"
              >
                {editId ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
