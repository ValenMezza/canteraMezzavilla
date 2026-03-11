"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useTable, type Cliente, type VentaCantera, type Viaje, type Pago } from "@/lib/hooks";
import { Modal, Fld, Stat, Empty, Ic, icons, fmt, fmtDate, fmtDateOnly, toISO, inputCls, selectCls, btnPrimary, btnSecondary, btnDanger, btnSmall, downloadHTML } from "@/components/ui";

export default function ClientesPage() {
  const { data: clientes, loading, insert, update, remove } = useTable<Cliente>("clientes", "nombre", true);
  const { data: ventas } = useTable<VentaCantera>("ventas_cantera", "created_at", false);
  const { data: viajes } = useTable<Viaje>("viajes", "created_at", false);
  const { data: pagos, insert: insertPago } = useTable<Pago>("pagos", "created_at", false);

  const [showAdd, setShowAdd] = useState(false);
  const [editCli, setEditCli] = useState<Cliente | null>(null);
  const [search, setSearch] = useState("");
  const [detCli, setDetCli] = useState<Cliente | null>(null);
  const [detTab, setDetTab] = useState("cantera");
  const [showPago, setShowPago] = useState<Cliente | null>(null);
  const [pagoForm, setPagoForm] = useState({ monto: "", metodo: "efectivo", nota: "" });
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", direccion: "", cuenta_corriente: false });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printType, setPrintType] = useState<"lista" | "resumen">("lista");
  const [printCliId, setPrintCliId] = useState("");
  const [printDesde, setPrintDesde] = useState("");
  const [printHasta, setPrintHasta] = useState("");

  const filtered = clientes.filter((c) => c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.telefono && c.telefono.includes(search)));
  const totalDeuda = clientes.reduce((s, c) => s + Math.min(0, Number(c.saldo)), 0);

  const openAdd = () => { setEditCli(null); setForm({ nombre: "", telefono: "", email: "", direccion: "", cuenta_corriente: false }); setShowAdd(true); };
  const openEdit = (c: Cliente) => { setEditCli(c); setForm({ nombre: c.nombre, telefono: c.telefono || "", email: c.email || "", direccion: c.direccion || "", cuenta_corriente: c.cuenta_corriente }); setShowAdd(true); };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    if (editCli) await update(editCli.id, form);
    else await insert({ ...form, saldo: 0 } as any);
    setShowAdd(false);
  };

  const handlePago = async () => {
    if (!showPago) return;
    const monto = parseFloat(pagoForm.monto);
    if (!monto || monto <= 0) return;
    await update(showPago.id, { saldo: Number(showPago.saldo) + monto });
    await insertPago({ cliente_id: showPago.id, cliente_nombre: showPago.nombre, monto, metodo: pagoForm.metodo, nota: pagoForm.nota } as any);
    setShowPago(null);
  };

  // ─── Print functions ──────────────────────────────
  const printListaClientes = () => {
    const rows = clientes.map((c) => {
      const vc = ventas.filter((v) => v.cliente_id === c.id);
      const vj = viajes.filter((v) => v.cliente_id === c.id && v.estado === "finalizado");
      const tot = vc.reduce((s, v) => s + Number(v.total), 0) + vj.reduce((s, v) => s + Number(v.total), 0);
      return `<tr><td class="b">${c.nombre}</td><td>${c.telefono || "-"}</td><td>${c.email || "-"}</td><td>${c.cuenta_corriente ? "Sí" : "No"}</td><td class="r ${Number(c.saldo) < 0 ? "d" : "s"}">${fmt(Number(c.saldo))}</td><td class="r">${vc.length + vj.length}</td><td class="r a b">${fmt(tot)}</td></tr>`;
    }).join("");
    const totalD = clientes.reduce((s, c) => s + Math.min(0, Number(c.saldo)), 0);
    downloadHTML("Lista Clientes", `<h2>Lista de Clientes (${clientes.length})</h2>
      <table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Email</th><th>Cta.Cte.</th><th class="r">Saldo</th><th class="r">Compras</th><th class="r">Total</th></tr></thead><tbody>${rows}
      <tr class="tot"><td colspan="4">TOTALES</td><td class="r d">${fmt(totalD)}</td><td></td><td class="r a">${fmt(ventas.reduce((s, v) => s + Number(v.total), 0) + viajes.filter((v) => v.estado === "finalizado").reduce((s, v) => s + Number(v.total), 0))}</td></tr></tbody></table>`);
  };

  const printResumenCliente = (cli: Cliente, desde: string, hasta: string) => {
    let vc = ventas.filter((v) => v.cliente_id === cli.id);
    let vj = viajes.filter((v) => v.cliente_id === cli.id);
    let pg = pagos.filter((p) => p.cliente_id === cli.id);
    let rangeLabel = "Histórico completo";
    if (desde || hasta) {
      vc = vc.filter((v) => { const d = toISO(v.created_at); return (!desde || d >= desde) && (!hasta || d <= hasta); });
      vj = vj.filter((v) => { const d = toISO(v.created_at); return (!desde || d >= desde) && (!hasta || d <= hasta); });
      pg = pg.filter((p) => { const d = toISO(p.created_at); return (!desde || d >= desde) && (!hasta || d <= hasta); });
      rangeLabel = `${desde || "..."} al ${hasta || "..."}`;
    }
    const vcRows = vc.map((v) => `<tr><td>${fmtDate(v.created_at)}</td><td>${(v.items || []).map((i: any) => `${i.cantidad} ${i.unidad} ${i.nombre}`).join(", ")}</td><td class="r a">${fmt(Number(v.total))}</td></tr>`).join("");
    const vjRows = vj.map((v) => `<tr><td>${fmtDate(v.created_at)}</td><td>${v.producto_nombre || "-"} → ${v.direccion_entrega}</td><td>${v.estado}</td><td class="r a">${fmt(Number(v.total))}</td></tr>`).join("");
    const pgRows = pg.map((p) => `<tr><td>${fmtDate(p.created_at)}</td><td>${p.metodo === "efectivo" ? "Efectivo" : "Transferencia"}</td><td>${p.nota || "-"}</td><td class="r s">+${fmt(Number(p.monto))}</td></tr>`).join("");
    const totC = vc.reduce((s, v) => s + Number(v.total), 0) + vj.filter((v) => v.estado === "finalizado").reduce((s, v) => s + Number(v.total), 0);
    const totP = pg.reduce((s, p) => s + Number(p.monto), 0);
    downloadHTML(`Resumen ${cli.nombre}`, `<h2>Resumen: ${cli.nombre}</h2><p class="sub">${rangeLabel} &nbsp;|&nbsp; Tel: ${cli.telefono || "-"} &nbsp;|&nbsp; Saldo actual: ${fmt(Number(cli.saldo))}</p>
      ${vc.length ? `<h2>Compras Cantera (${vc.length})</h2><table><thead><tr><th>Fecha</th><th>Detalle</th><th class="r">Total</th></tr></thead><tbody>${vcRows}<tr class="tot"><td colspan="2">SUBTOTAL</td><td class="r a">${fmt(vc.reduce((s, v) => s + Number(v.total), 0))}</td></tr></tbody></table>` : ""}
      ${vj.length ? `<h2>Viajes (${vj.length})</h2><table><thead><tr><th>Fecha</th><th>Detalle</th><th>Estado</th><th class="r">Total</th></tr></thead><tbody>${vjRows}</tbody></table>` : ""}
      ${pg.length ? `<h2>Pagos (${pg.length})</h2><table><thead><tr><th>Fecha</th><th>Método</th><th>Nota</th><th class="r">Monto</th></tr></thead><tbody>${pgRows}<tr class="tot"><td colspan="3">TOTAL PAGADO</td><td class="r s">${fmt(totP)}</td></tr></tbody></table>` : ""}
      <div class="detail"><strong>Total comprado:</strong> <span class="a">${fmt(totC)}</span> &nbsp;|&nbsp; <strong>Total pagado:</strong> <span class="s">${fmt(totP)}</span></div>`);
  };

  const printVentaIndCantera = (v: VentaCantera) => {
    const items = (v.items || []).map((i: any) => `<tr><td>${i.nombre}</td><td class="r">${i.cantidad} ${i.unidad}</td><td class="r">${fmt(i.precio_unit)}</td><td class="r a b">${fmt(i.subtotal)}</td></tr>`).join("");
    const fp = v.forma_pago === "efectivo" ? "Efectivo" : v.forma_pago === "transferencia" ? "Transf." : "Cta.Cte.";
    downloadHTML("Venta Cantera", `<h2>Comprobante de Venta — Cantera</h2>
      <div class="detail"><strong>Cliente:</strong> ${v.cliente_nombre} &nbsp;|&nbsp; <strong>Fecha:</strong> ${fmtDate(v.created_at)} &nbsp;|&nbsp; <strong>Pago:</strong> ${fp}${v.nota ? ` &nbsp;|&nbsp; <strong>Nota:</strong> ${v.nota}` : ""}</div>
      <table><thead><tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th class="r">Subtotal</th></tr></thead><tbody>${items}
      <tr class="tot"><td colspan="3">TOTAL</td><td class="r a">${fmt(Number(v.total))}</td></tr></tbody></table>`);
  };

  const printVentaIndViaje = (v: Viaje) => {
    const est = v.estado === "finalizado" ? "Finalizado" : v.estado === "cancelado" ? "Cancelado" : "Pendiente";
    const fp = v.forma_pago === "efectivo" ? "Efectivo" : v.forma_pago === "transferencia" ? "Transf." : "Cta.Cte.";
    downloadHTML("Viaje", `<h2>Comprobante de Viaje</h2>
      <div class="detail"><strong>Cliente:</strong> ${v.cliente_nombre} &nbsp;|&nbsp; <strong>Tel:</strong> ${v.telefono_contacto}<br/>
      <strong>Dirección:</strong> ${v.direccion_entrega} &nbsp;|&nbsp; <strong>Entrega:</strong> ${fmtDateOnly(v.fecha_entrega)} ${v.hora_entrega}<br/>
      <strong>Estado:</strong> ${est} &nbsp;|&nbsp; <strong>Pago:</strong> ${fp}</div>
      <table><thead><tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Producto</th><th class="r">Flete</th><th class="r">Total</th></tr></thead><tbody>
      <tr><td>${v.producto_nombre || "-"}</td><td class="r">${v.cantidad_producto || "-"} ${v.unidad_producto || ""}</td><td class="r">${fmt(Number(v.precio_producto || 0) * Number(v.cantidad_producto || 0))}</td><td class="r">${fmt(Number(v.precio_flete))}</td><td class="r a b">${fmt(Number(v.total))}</td></tr></tbody></table>`);
  };

  const handlePrint = () => {
    if (printType === "lista") { printListaClientes(); }
    else {
      const cli = clientes.find((c) => c.id === printCliId);
      if (cli) printResumenCliente(cli, printDesde, printHasta);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-text-dim">Cargando...</div>;

  const hasDebt = editCli && Number(editCli.saldo) < 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">Clientes</h1>
        <div className="flex gap-2">
          <button onClick={() => { setPrintType("lista"); setPrintCliId(""); setPrintDesde(""); setPrintHasta(""); setShowPrintModal(true); }} className={btnSecondary}><span className="flex items-center gap-1.5"><Ic d={icons.print} size={13} /> Imprimir</span></button>
          <button onClick={openAdd} className={btnPrimary}><span className="flex items-center gap-1.5"><Ic d={icons.plus} size={13} className="text-bg" /> Nuevo</span></button>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <Stat label="Clientes" value={clientes.length} />
        <Stat label="Con Deuda" value={clientes.filter((c) => Number(c.saldo) < 0).length} accent="text-red-400" />
        <Stat label="Deuda Total" value={fmt(Math.abs(totalDeuda))} accent="text-red-400" />
      </div>

      <div className="relative mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className={`${inputCls} pl-9`} />
        <div className="absolute left-3 top-3"><Ic d={icons.search} size={13} className="text-text-muted" /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => {
          const n = ventas.filter((v) => v.cliente_id === c.id).length + viajes.filter((v) => v.cliente_id === c.id).length;
          return (
            <div key={c.id} className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-accent/30 transition-colors" onClick={() => { setDetCli(c); setDetTab("cantera"); }}>
              <div className="flex justify-between items-start">
                <div><div className="font-semibold text-sm mb-0.5">{c.nombre}</div><div className="text-xs text-text-dim">{c.telefono || "-"}</div></div>
                <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} className="px-2.5 py-1.5 bg-surface-alt text-text-dim rounded text-xs font-semibold hover:text-accent transition-colors flex items-center gap-1">
                    <Ic d={icons.edit} size={11} /> Editar
                  </button>
                  <button onClick={() => { if (Number(c.saldo) < 0) return; remove(c.id); }} className={`px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${Number(c.saldo) < 0 ? "bg-surface-alt text-text-muted cursor-not-allowed" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                    <Ic d={icons.trash} size={11} />
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {c.cuenta_corriente && <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${Number(c.saldo) < 0 ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>{fmt(Number(c.saldo))}</span>}
                {c.cuenta_corriente && <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400">CC</span>}
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent">{n} compras</span>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <Empty icon={icons.truck} text="Sin clientes" />}

      {/* Print Modal */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Imprimir Clientes">
        <Fld label="Tipo de impresión">
          <div className="flex gap-2">
            {([["lista", "Lista de Clientes"], ["resumen", "Resumen Individual"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setPrintType(v as any)} className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-all ${printType === v ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>{l}</button>
            ))}
          </div>
        </Fld>
        {printType === "resumen" && <>
          <Fld label="Cliente">
            <select value={printCliId} onChange={(e) => setPrintCliId(e.target.value)} className={selectCls}>
              <option value="">Seleccionar...</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Desde (opcional)"><input type="date" value={printDesde} onChange={(e) => setPrintDesde(e.target.value)} className={inputCls} /></Fld>
            <Fld label="Hasta (opcional)"><input type="date" value={printHasta} onChange={(e) => setPrintHasta(e.target.value)} className={inputCls} /></Fld>
          </div>
          <p className="text-xs text-text-dim mb-3">Dejá vacío para histórico completo.</p>
        </>}
        <div className="flex gap-2 justify-end mt-2">
          <button onClick={() => setShowPrintModal(false)} className={btnSecondary}>Cerrar</button>
          <button onClick={handlePrint} className={btnPrimary}>Descargar</button>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editCli ? "Editar Cliente" : "Nuevo Cliente"}>
        <Fld label="Nombre"><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inputCls} /></Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Teléfono"><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className={inputCls} /></Fld>
          <Fld label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Fld>
        </div>
        <Fld label="Dirección"><input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className={inputCls} /></Fld>
        <Fld label="Cuenta Corriente">
          <button onClick={() => { if (form.cuenta_corriente && hasDebt) return; setForm({ ...form, cuenta_corriente: !form.cuenta_corriente }); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-semibold transition-all ${form.cuenta_corriente ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"} ${form.cuenta_corriente && hasDebt ? "opacity-50 cursor-not-allowed" : ""}`}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form.cuenta_corriente ? "bg-accent border-accent" : "border-text-muted"}`}>
              {form.cuenta_corriente && <Ic d={icons.check} size={10} className="text-bg" />}
            </div>Habilitar
          </button>
          {form.cuenta_corriente && hasDebt && <p className="text-xs text-red-400 mt-2">No se puede desactivar con deuda pendiente ({fmt(Math.abs(Number(editCli!.saldo)))})</p>}
        </Fld>
        <div className="flex justify-between mt-4">
          <div>{editCli && <button onClick={() => { remove(editCli.id); setShowAdd(false); }} className={btnDanger}>Eliminar</button>}</div>
          <div className="flex gap-2"><button onClick={() => setShowAdd(false)} className={btnSecondary}>Cancelar</button><button onClick={handleSave} className={btnPrimary}>{editCli ? "Guardar" : "Crear"}</button></div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detCli} onClose={() => setDetCli(null)} title={detCli?.nombre || ""} width="max-w-2xl">
        {detCli && (() => {
          const vc = ventas.filter((v) => v.cliente_id === detCli.id);
          const vj = viajes.filter((v) => v.cliente_id === detCli.id);
          const pg = pagos.filter((p) => p.cliente_id === detCli.id);
          return (<>
            <div className="flex gap-2 mb-4 flex-wrap">
              {detCli.cuenta_corriente && <div className={`bg-surface border rounded-xl p-3 flex-1 min-w-[100px] ${Number(detCli.saldo) < 0 ? "border-red-500/20 bg-red-500/5" : "border-green-500/20 bg-green-500/5"}`}><div className="text-[10px] text-text-dim">SALDO</div><div className={`text-lg font-bold ${Number(detCli.saldo) < 0 ? "text-red-400" : "text-green-400"}`}>{fmt(Number(detCli.saldo))}</div></div>}
              <div className="bg-surface border border-border rounded-xl p-3 flex-1 min-w-[100px]"><div className="text-[10px] text-text-dim">COMPRAS</div><div className="text-lg font-bold">{vc.length + vj.length}</div></div>
            </div>
            <div className="flex gap-2 mb-4">
              {detCli.cuenta_corriente && <button onClick={() => { setShowPago(detCli); setPagoForm({ monto: "", metodo: "efectivo", nota: "" }); setDetCli(null); }} className={`${btnPrimary} flex-1 text-center`}>Registrar Pago</button>}
              <button onClick={() => printResumenCliente(detCli, "", "")} className={`${btnSecondary} flex-1 text-center`}><span className="flex items-center justify-center gap-1.5"><Ic d={icons.print} size={12} /> Imprimir Resumen</span></button>
            </div>
            <div className="flex gap-1.5 mb-3">
              {(["cantera", "viajes", "pagos"] as const).map((t) => (
                <button key={t} onClick={() => setDetTab(t)} className={`px-4 py-1.5 rounded-md text-xs font-semibold border transition-all ${detTab === t ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </div>
            <div className="max-h-60 overflow-auto">
              {detTab === "cantera" && (!vc.length ? <Empty icon={icons.cart} text="Sin compras" /> : vc.map((v) => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b border-border">
                  <div><div className="font-medium text-xs">{(v.items || []).map((i: any) => `${i.cantidad} ${i.unidad} ${i.nombre}`).join(", ")}</div><div className="text-[10px] text-text-dim">{fmtDate(v.created_at)}</div></div>
                  <div className="flex items-center gap-2"><span className="font-semibold text-accent text-sm">{fmt(Number(v.total))}</span><button onClick={() => printVentaIndCantera(v)} className="text-text-dim hover:text-text-main"><Ic d={icons.print} size={10} /></button></div>
                </div>
              )))}
              {detTab === "viajes" && (!vj.length ? <Empty icon={icons.truck} text="Sin viajes" /> : vj.map((v) => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b border-border">
                  <div><div className="font-medium text-xs">{v.producto_nombre || "-"} → {v.direccion_entrega}</div><div className="text-[10px] text-text-dim">{fmtDate(v.created_at)} · {v.estado}</div></div>
                  <div className="flex items-center gap-2"><span className="font-semibold text-accent text-sm">{fmt(Number(v.total))}</span><button onClick={() => printVentaIndViaje(v)} className="text-text-dim hover:text-text-main"><Ic d={icons.print} size={10} /></button></div>
                </div>
              )))}
              {detTab === "pagos" && (!pg.length ? <Empty icon={icons.dollar} text="Sin pagos" /> : pg.map((p) => (
                <div key={p.id} className="flex justify-between py-2 border-b border-border">
                  <div><div className="font-medium text-xs">{p.metodo === "efectivo" ? "Efectivo" : "Transferencia"}{p.nota ? ` — ${p.nota}` : ""}</div><div className="text-[10px] text-text-dim">{fmtDate(p.created_at)}</div></div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">+{fmt(Number(p.monto))}</span>
                </div>
              )))}
            </div>
          </>);
        })()}
      </Modal>

      {/* Pago Modal */}
      <Modal open={!!showPago} onClose={() => setShowPago(null)} title={`Pago — ${showPago?.nombre || ""}`}>
        {showPago && <div className="bg-red-500/10 rounded-lg px-4 py-2.5 mb-4 text-sm">Deuda: <strong className="text-red-400">{fmt(Math.abs(Number(showPago.saldo)))}</strong></div>}
        <Fld label="Monto ($)"><input type="number" value={pagoForm.monto} onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })} className={inputCls} /></Fld>
        <Fld label="Método">
          <div className="flex gap-2">
            {(["efectivo", "transferencia"] as const).map((m) => (
              <button key={m} onClick={() => setPagoForm({ ...pagoForm, metodo: m })} className={`flex-1 py-2 rounded-md text-sm font-semibold border transition-all ${pagoForm.metodo === m ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>
                {m === "efectivo" ? "Efectivo" : "Transferencia"}
              </button>
            ))}
          </div>
        </Fld>
        <Fld label="Nota"><input value={pagoForm.nota} onChange={(e) => setPagoForm({ ...pagoForm, nota: e.target.value })} className={inputCls} /></Fld>
        <div className="flex gap-2 justify-end mt-4">
          <button onClick={() => setShowPago(null)} className={btnSecondary}>Cancelar</button>
          <button onClick={handlePago} className="bg-green-500 text-bg px-5 py-2.5 rounded-md text-sm font-semibold">Registrar</button>
        </div>
      </Modal>
    </div>
  );
}
