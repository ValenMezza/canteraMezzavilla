"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useTable, type Producto, type Cliente, type Viaje, type Movimiento } from "@/lib/hooks";
import { Modal, ConfirmModal, Fld, Stat, Empty, Ic, icons, fmt, fmtDate, fmtDateOnly, inputCls, selectCls, btnPrimary, btnSecondary, btnSmall, downloadHTML } from "@/components/ui";

const PARTICULAR = { id: "PARTICULAR", nombre: "Particular", telefono: "-", direccion: "-", cuenta_corriente: false, saldo: 0 };

export default function ViajesPage() {
  const { data: productos, update: updateProd } = useTable<Producto>("productos", "nombre", true);
  const { data: clientesDB, update: updateCli } = useTable<Cliente>("clientes", "nombre", true);
  const { data: viajes, insert: insertViaje, update: updateViaje } = useTable<Viaje>("viajes", "created_at", false);
  const { insert: insertMov } = useTable<Movimiento>("movimientos", "created_at", false);

  const clientes = [PARTICULAR as any, ...clientesDB];

  const [showForm, setShowForm] = useState(false);
  const [editV, setEditV] = useState<Viaje | null>(null);
  const [filtro, setFiltro] = useState("pendiente");
  const [confirm, setConfirm] = useState<{ type: string; viaje: Viaje } | null>(null);

  const pend = viajes.filter((v) => v.estado === "pendiente");
  const fin = viajes.filter((v) => v.estado === "finalizado");
  const canc = viajes.filter((v) => v.estado === "cancelado");
  const shown = filtro === "todos" ? viajes : viajes.filter((v) => v.estado === filtro);

  const isOverdue = (v: Viaje) => { if (v.estado !== "pendiente") return false; return new Date() > new Date(`${v.fecha_entrega}T${v.hora_entrega || "23:59"}`); };

  const doFinalizar = async (v: Viaje) => {
    await updateViaje(v.id, { estado: "finalizado" });
    if (v.producto_id) {
      const p = productos.find((x) => x.id === v.producto_id);
      if (p && v.cantidad_producto) {
        await updateProd(p.id, { stock: Math.max(0, Number(p.stock) - Number(v.cantidad_producto)) });
        await insertMov({ producto_id: v.producto_id, producto_nombre: p.nombre, tipo: "venta", cantidad: Number(v.cantidad_producto), motivo: `Viaje → ${v.cliente_nombre}` } as any);
      }
    }
    if (v.forma_pago === "cuenta_corriente" && v.cliente_id !== "PARTICULAR") {
      const cli = clientesDB.find((c) => c.id === v.cliente_id);
      if (cli) await updateCli(cli.id, { saldo: Number(cli.saldo) - Number(v.total) });
    }
  };

  const doCancelar = async (v: Viaje) => { await updateViaje(v.id, { estado: "cancelado" }); };

  const printAll = () => {
    const rows = viajes.map((v) => {
      const est = v.estado === "finalizado" ? '<span class="badge bg-g">Fin</span>' : v.estado === "cancelado" ? '<span class="badge bg-r">Canc</span>' : '<span class="badge bg-y">Pend</span>';
      return `<tr><td>${fmtDate(v.created_at)}</td><td class="b">${v.cliente_nombre}</td><td>${v.producto_nombre || "-"}</td><td>${v.direccion_entrega}</td><td>${est}</td><td class="r">${fmt(Number(v.precio_flete))}</td><td class="r a b">${fmt(Number(v.total))}</td></tr>`;
    }).join("");
    downloadHTML("Ventas Viajes", `<h2>Viajes (${viajes.length})</h2><table><thead><tr><th>Creado</th><th>Cliente</th><th>Producto</th><th>Dirección</th><th>Estado</th><th class="r">Flete</th><th class="r">Total</th></tr></thead><tbody>${rows}<tr class="tot"><td colspan="6">TOTAL</td><td class="r a">${fmt(viajes.reduce((s, v) => s + Number(v.total), 0))}</td></tr></tbody></table>`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">Venta de Viajes</h1>
        <div className="flex gap-2">
          <button onClick={printAll} className={btnSecondary}><span className="flex items-center gap-1.5"><Ic d={icons.print} size={13} /> Imprimir</span></button>
          <button onClick={() => { setEditV(null); setShowForm(true); }} className={btnPrimary}><span className="flex items-center gap-1.5"><Ic d={icons.plus} size={13} className="text-bg" /> Nuevo Viaje</span></button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <Stat label="Pendientes" value={pend.length} accent={pend.length ? "text-yellow-400" : "text-green-400"} />
        <Stat label="Finalizados" value={fin.length} accent="text-green-400" />
        <Stat label="Cancelados" value={canc.length} accent={canc.length ? "text-red-400" : "text-text-muted"} />
        <Stat label="Facturado" value={fmt(fin.reduce((s, v) => s + Number(v.total), 0))} accent="text-accent" />
      </div>

      <div className="flex gap-1.5 mb-4">
        {([["pendiente", "Pendientes", pend.length], ["finalizado", "Finalizados", fin.length], ["cancelado", "Cancelados", canc.length], ["todos", "Todos", viajes.length]] as const).map(([k, l, n]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`px-4 py-1.5 rounded-md text-xs font-semibold border transition-all ${filtro === k ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>{l} ({n})</button>
        ))}
      </div>

      {shown.length === 0 ? <Empty icon={icons.truck} text="Sin viajes" /> :
        <div className="flex flex-col gap-2">
          {shown.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((v) => {
            const od = isOverdue(v);
            const bCol = v.estado === "finalizado" ? "border-l-green-500" : v.estado === "cancelado" ? "border-l-red-500/40" : od ? "border-l-red-500" : "border-l-yellow-500";
            const sBg = v.estado === "finalizado" ? "bg-green-500/10 text-green-400" : v.estado === "cancelado" ? "bg-red-500/10 text-red-400" : od ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400";
            const sLab = v.estado === "finalizado" ? "Finalizado" : v.estado === "cancelado" ? "Cancelado" : od ? "ATRASADO" : "A tiempo";

            return (
              <div key={v.id} className={`bg-surface border border-border rounded-xl p-4 border-l-4 ${bCol}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm">{v.cliente_nombre}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${sBg}`}>{sLab}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-text-dim flex-wrap">
                      <span className="flex items-center gap-1"><Ic d={icons.phone} size={10} /> {v.telefono_contacto}</span>
                      <span className="flex items-center gap-1"><Ic d={icons.map} size={10} /> {v.direccion_entrega}</span>
                      <span className={`flex items-center gap-1 ${od ? "text-red-400" : ""}`}><Ic d={icons.clock} size={10} className={od ? "text-red-400" : ""} /> {fmtDateOnly(v.fecha_entrega)} {v.hora_entrega}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-text-dim mt-1">
                      <span><strong>Producto:</strong> {v.producto_nombre || "-"}{v.cantidad_producto ? ` (${v.cantidad_producto} ${v.unidad_producto || "m³"})` : ""}</span>
                      <span><strong>Flete:</strong> {fmt(Number(v.precio_flete))}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-accent">{fmt(Number(v.total))}</div>
                    <div className="text-[9px] text-text-muted">{fmtDate(v.created_at)}</div>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {v.estado === "pendiente" && <>
                    <button onClick={() => { setEditV(v); setShowForm(true); }} className={`${btnSmall} bg-blue-500/10 text-blue-400`}><span className="flex items-center gap-1"><Ic d={icons.edit} size={10} className="text-blue-400" /> Editar</span></button>
                    <button onClick={() => setConfirm({ type: "finalizar", viaje: v })} className={`${btnSmall} bg-green-500/10 text-green-400`}><span className="flex items-center gap-1"><Ic d={icons.check} size={10} className="text-green-400" /> Finalizar</span></button>
                    <button onClick={() => setConfirm({ type: "cancelar", viaje: v })} className={`${btnSmall} bg-red-500/10 text-red-400`}><span className="flex items-center gap-1"><Ic d={icons.x} size={10} className="text-red-400" /> Cancelar</span></button>
                  </>}
                </div>
              </div>
            );
          })}
        </div>}

      <ConfirmModal open={!!confirm} msg={confirm ? (confirm.type === "finalizar" ? `¿Finalizar viaje a ${confirm.viaje.cliente_nombre}?` : `¿Cancelar viaje a ${confirm.viaje.cliente_nombre}?`) : ""}
        onYes={async () => { if (!confirm) return; if (confirm.type === "finalizar") await doFinalizar(confirm.viaje); else await doCancelar(confirm.viaje); setConfirm(null); }}
        onNo={() => setConfirm(null)} />

      <ViajeFormModal open={showForm} onClose={() => { setShowForm(false); setEditV(null); }} editV={editV} productos={productos} clientes={clientes}
      onSave={async (data: any) => {          if (editV) await updateViaje(editV.id, data);
          else await insertViaje({ ...data, estado: "pendiente" } as any);
          setShowForm(false); setEditV(null);
        }} />
    </div>
  );
}

function ViajeFormModal({ open, onClose, editV, productos, clientes, onSave }: any) {
  const blank = { cliente_id: "PARTICULAR", cliente_nombre: "Particular", telefono_contacto: "", direccion_entrega: "", producto_id: "", producto_nombre: "", cantidad_producto: "", unidad_producto: "m³", precio_producto: 0, precio_flete: "", fecha_entrega: "", hora_entrega: "", forma_pago: "efectivo", nota: "" };
  const [f, sF] = useState<any>(blank);
  const [qC, sQC] = useState("");
  const [customPrice, setCustomPrice] = useState(false);
  const [precioFinal, setPrecioFinal] = useState("");

  useEffect(() => {
    if (editV) sF({ cliente_id: editV.cliente_id, cliente_nombre: editV.cliente_nombre, telefono_contacto: editV.telefono_contacto || "", direccion_entrega: editV.direccion_entrega || "", producto_id: editV.producto_id || "", producto_nombre: editV.producto_nombre || "", cantidad_producto: editV.cantidad_producto ? String(editV.cantidad_producto) : "", unidad_producto: editV.unidad_producto || "m³", precio_producto: editV.precio_producto || 0, precio_flete: String(editV.precio_flete || ""), fecha_entrega: editV.fecha_entrega || "", hora_entrega: editV.hora_entrega || "", forma_pago: editV.forma_pago || "efectivo", nota: editV.nota || "" });
    else sF(blank);
    setCustomPrice(false); setPrecioFinal(""); sQC("");
  }, [editV, open]);

  const s = (k: string, v: any) => sF((p: any) => ({ ...p, [k]: v }));
  const fC = clientes.filter((c: any) => c.nombre.toLowerCase().includes(qC.toLowerCase()));
  const cSel = clientes.find((c: any) => c.id === f.cliente_id);
  const pTotal = f.precio_producto * (parseFloat(f.cantidad_producto) || 0);
  const calcTotal = pTotal + (parseFloat(f.precio_flete) || 0);
  const total = customPrice && precioFinal !== "" ? parseFloat(precioFinal) || 0 : calcTotal;
  const canSave = f.telefono_contacto?.trim() && f.direccion_entrega?.trim() && f.fecha_entrega && f.hora_entrega;

  return (
    <Modal open={open} onClose={onClose} title={editV ? "Editar Viaje" : "Nuevo Viaje"} width="max-w-xl">
      <Fld label="Cliente">
        <input value={qC} onChange={(e: any) => sQC(e.target.value)} placeholder="Buscar..." className={`${inputCls} mb-1.5`} />
        <div className="max-h-20 overflow-auto border border-border rounded-md">
          {fC.map((c: any) => (
            <button key={c.id} onClick={() => { s("cliente_id", c.id); s("cliente_nombre", c.nombre); if (c.telefono && c.telefono !== "-") s("telefono_contacto", c.telefono); if (c.direccion && c.direccion !== "-") s("direccion_entrega", c.direccion); sQC(""); }}
              className={`flex justify-between w-full px-3 py-1.5 text-xs text-left border-b border-border ${f.cliente_id === c.id ? "bg-accent/10 text-accent" : "hover:bg-surface-alt"}`}>
              <span>{c.nombre}</span>
            </button>
          ))}
        </div>
      </Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="Teléfono *"><input value={f.telefono_contacto} onChange={(e: any) => s("telefono_contacto", e.target.value)} className={inputCls} placeholder="Obligatorio" /></Fld>
        <Fld label="Dirección *"><input value={f.direccion_entrega} onChange={(e: any) => s("direccion_entrega", e.target.value)} className={inputCls} /></Fld>
      </div>
      <Fld label="Producto">
        <div className="flex gap-2">
          <select value={f.producto_id} onChange={(e: any) => { const p = productos.find((x: any) => x.id === e.target.value); s("producto_id", e.target.value); s("producto_nombre", p ? p.nombre : ""); s("precio_producto", p ? Number(p.precio) : 0); s("unidad_producto", p ? p.unidad : "m³"); }} className={`${selectCls} flex-[2]`}>
            <option value="">Seleccionar...</option>
            {productos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre} — {fmt(Number(p.precio))}/{p.unidad}</option>)}
          </select>
          <input type="number" value={f.cantidad_producto} onChange={(e: any) => s("cantidad_producto", e.target.value)} placeholder="Cant." className={`${inputCls} flex-[0.5]`} />
        </div>
      </Fld>
      <Fld label="Flete ($)"><input type="number" value={f.precio_flete} onChange={(e: any) => s("precio_flete", e.target.value)} className={inputCls} /></Fld>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="Día *"><input type="date" value={f.fecha_entrega} onChange={(e: any) => s("fecha_entrega", e.target.value)} className={inputCls} /></Fld>
        <Fld label="Hora *"><input type="time" value={f.hora_entrega} onChange={(e: any) => s("hora_entrega", e.target.value)} className={inputCls} /></Fld>
      </div>
      <Fld label="Pago">
        <div className="flex gap-1.5">
          {[["efectivo", "Efectivo"], ["transferencia", "Transf."], ...(cSel?.cuenta_corriente && f.cliente_id !== "PARTICULAR" ? [["cuenta_corriente", "Cta.Cte."]] : [])].map(([v, l]: any) => (
            <button key={v} onClick={() => s("forma_pago", v)} className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-all ${f.forma_pago === v ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>{l}</button>
          ))}
        </div>
      </Fld>
      <Fld label="Nota"><input value={f.nota} onChange={(e: any) => s("nota", e.target.value)} className={inputCls} /></Fld>

      <div className="mb-3">
        <button onClick={() => { setCustomPrice(!customPrice); if (!customPrice) setPrecioFinal(String(calcTotal)); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold ${customPrice ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>
          <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${customPrice ? "bg-accent border-accent" : "border-text-muted"}`}>{customPrice && <Ic d={icons.check} size={8} className="text-bg" />}</div>
          Modificar precio final
        </button>
      </div>
      {customPrice && <Fld label="Precio Final ($)"><input type="number" value={precioFinal} onChange={(e: any) => setPrecioFinal(e.target.value)} className={`${inputCls} !border-accent`} /></Fld>}

      <div className="bg-surface-alt rounded-lg px-4 py-3 flex justify-between items-center my-3">
        <div><span className="font-semibold text-sm">TOTAL</span>{customPrice && <div className="text-[10px] text-text-dim">Calculado: {fmt(calcTotal)}</div>}</div>
        <span className="text-2xl font-bold text-accent">{fmt(total)}</span>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onClose} className={btnSecondary}>Cancelar</button>
        <button onClick={() => { if (!canSave) return; onSave({ ...f, precio_producto: f.precio_producto, cantidad_producto: parseFloat(f.cantidad_producto) || 0, precio_flete: parseFloat(f.precio_flete) || 0, total }); }} className={btnPrimary}>{editV ? "Guardar" : "Crear Viaje"}</button>
      </div>
    </Modal>
  );
}
