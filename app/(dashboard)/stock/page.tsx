"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useTable, type Producto, type Movimiento } from "@/lib/hooks";
import { Modal, Fld, Stat, Empty, ConfirmModal, Ic, icons, fmt, fmtDate, inputCls, selectCls, btnPrimary, btnSecondary, btnSmall } from "@/components/ui";

export default function StockPage() {
  const { data: productos, loading, insert, update, remove } = useTable<Producto>("productos", "nombre", true);
  const { data: movimientos, insert: insertMov } = useTable<Movimiento>("movimientos", "created_at", false);

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", unidad: "m³", precio: "", stock: "" });
  const [search, setSearch] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [ajuste, setAjuste] = useState<Producto | null>(null);
  const [ajForm, setAjForm] = useState({ cantidad: "", tipo: "ingreso" as "ingreso" | "egreso", motivo: "" });

  const filtered = productos.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()));
  const lowStock = productos.filter((p) => Number(p.stock) < 100);
  const totalStock = productos.reduce((s, p) => s + Number(p.stock), 0);

  const openAdd = () => { setEditId(null); setForm({ nombre: "", unidad: "m³", precio: "", stock: "" }); setShowAdd(true); };
  const openEdit = (p: Producto) => { setEditId(p.id); setForm({ nombre: p.nombre, unidad: p.unidad, precio: String(p.precio), stock: String(p.stock) }); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.nombre || !form.precio) return;
    const data = { nombre: form.nombre, unidad: form.unidad, precio: parseFloat(form.precio), stock: parseFloat(form.stock) || 0 };
    if (editId) await update(editId, data);
    else await insert(data as any);
    setShowAdd(false);
  };

  const handleAjuste = async () => {
    if (!ajuste) return;
    const cant = parseFloat(ajForm.cantidad);
    if (!cant || cant <= 0) return;
    const newStock = Math.max(0, Number(ajuste.stock) + (ajForm.tipo === "ingreso" ? cant : -cant));
    await update(ajuste.id, { stock: newStock });
    await insertMov({ producto_id: ajuste.id, producto_nombre: ajuste.nombre, tipo: ajForm.tipo, cantidad: cant, motivo: ajForm.motivo } as any);
    setAjuste(null);
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-dim">Cargando stock...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">Gestión de Stock</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowLog(true)} className={btnSecondary}><span className="flex items-center gap-1.5"><Ic d={icons.history} size={13} /> Movimientos</span></button>
          <button onClick={openAdd} className={btnPrimary}><span className="flex items-center gap-1.5"><Ic d={icons.plus} size={13} className="text-bg" /> Nuevo</span></button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <Stat label="Productos" value={productos.length} />
        <Stat label="Stock Total" value={`${totalStock.toLocaleString("es-AR")} m³`} />
        <Stat label="Stock Bajo" value={lowStock.length} accent={lowStock.length > 0 ? "text-red-400" : "text-green-400"} />
      </div>

      <div className="relative mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto..." className={`${inputCls} pl-9`} />
        <div className="absolute left-3 top-3"><Ic d={icons.search} size={13} className="text-text-muted" /></div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-surface-alt">
            {["Producto", "Und", "Stock", "Precio", "Valor", ""].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] text-text-dim uppercase tracking-wider font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>{filtered.map((p) => (
            <tr key={p.id} className="border-t border-border hover:bg-surface-alt/50">
              <td className="px-4 py-3 font-medium">{p.nombre}</td>
              <td className="px-4 py-3 text-text-dim">{p.unidad}</td>
              <td className="px-4 py-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${Number(p.stock) < 100 ? "bg-red-500/10 text-red-400" : Number(p.stock) < 300 ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>
                  {Number(p.stock).toLocaleString("es-AR")}
                </span>
              </td>
              <td className="px-4 py-3">{fmt(Number(p.precio))}</td>
              <td className="px-4 py-3 font-semibold text-accent">{fmt(Number(p.precio) * Number(p.stock))}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => { setAjuste(p); setAjForm({ cantidad: "", tipo: "ingreso", motivo: "" }); }} className={`${btnSmall} bg-blue-500/10 text-blue-400`}>Ajustar</button>
                  <button onClick={() => openEdit(p)} className={`${btnSmall} bg-surface-alt text-text-dim`}>Editar</button>
                  <button onClick={() => remove(p.id)} className={`${btnSmall} bg-red-500/10 text-red-400`}>Eliminar</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <Empty icon={icons.cart} text="Sin productos" />}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editId ? "Editar Producto" : "Nuevo Producto"}>
        <Fld label="Nombre"><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputCls} /></Fld>
        <div className="grid grid-cols-3 gap-3">
          <Fld label="Unidad"><select value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className={selectCls}><option value="m³">m³</option><option value="tn">Tn</option><option value="kg">Kg</option></select></Fld>
          <Fld label="Precio ($)"><input type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className={inputCls} /></Fld>
          <Fld label="Stock"><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} /></Fld>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setShowAdd(false)} className={btnSecondary}>Cancelar</button>
          <button onClick={handleSave} className={btnPrimary}>{editId ? "Guardar" : "Crear"}</button>
        </div>
      </Modal>

      {/* Ajuste Modal */}
      <Modal open={!!ajuste} onClose={() => setAjuste(null)} title={`Ajustar — ${ajuste?.nombre || ""}`}>
        {ajuste && <div className="bg-surface-alt rounded-lg px-4 py-2.5 mb-4 text-sm">Stock actual: <strong>{Number(ajuste.stock).toLocaleString("es-AR")} {ajuste.unidad}</strong></div>}
        <Fld label="Tipo">
          <div className="flex gap-2">
            {(["ingreso", "egreso"] as const).map((t) => (
              <button key={t} onClick={() => setAjForm({ ...ajForm, tipo: t })} className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-all ${ajForm.tipo === t ? (t === "ingreso" ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-red-500/10 text-red-400 border-red-500/30") : "bg-surface-alt text-text-dim border-border"}`}>
                {t === "ingreso" ? "Ingreso" : "Egreso"}
              </button>
            ))}
          </div>
        </Fld>
        <Fld label="Cantidad"><input type="number" value={ajForm.cantidad} onChange={(e) => setAjForm({ ...ajForm, cantidad: e.target.value })} className={inputCls} /></Fld>
        <Fld label="Motivo"><input value={ajForm.motivo} onChange={(e) => setAjForm({ ...ajForm, motivo: e.target.value })} className={inputCls} placeholder="Compra, ajuste..." /></Fld>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setAjuste(null)} className={btnSecondary}>Cancelar</button>
          <button onClick={handleAjuste} className={`px-5 py-2.5 rounded-md text-sm font-semibold text-white ${ajForm.tipo === "ingreso" ? "bg-green-500" : "bg-red-500"}`}>Confirmar</button>
        </div>
      </Modal>

      {/* Movimientos Modal */}
      <Modal open={showLog} onClose={() => setShowLog(false)} title="Historial de Movimientos" width="max-w-xl">
        {movimientos.length === 0 ? <Empty icon={icons.history} text="Sin movimientos" /> :
          <div className="max-h-96 overflow-auto">{movimientos.slice(0, 60).map((m) => (
            <div key={m.id} className="flex justify-between items-center py-2 border-b border-border">
              <div>
                <div className="font-medium text-xs">{m.producto_nombre}</div>
                <div className="text-[10px] text-text-dim">{m.motivo || "-"} · {fmtDate(m.created_at)}</div>
              </div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${m.tipo === "ingreso" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                {m.tipo === "ingreso" ? "+" : "-"}{Number(m.cantidad)}
              </span>
            </div>
          ))}</div>}
      </Modal>
    </div>
  );
}
