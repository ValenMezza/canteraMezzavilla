"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useTable, type Producto, type Cliente, type VentaCantera, type Movimiento } from "@/lib/hooks";
import { Modal, Fld, Stat, Empty, Ic, icons, fmt, fmtDate, fmtShort, toISO, inputCls, selectCls, btnPrimary, btnSecondary, btnSmall, downloadHTML } from "@/components/ui";

const PARTICULAR = { id: "PARTICULAR", nombre: "Particular", telefono: "-", email: "-", direccion: "-", cuenta_corriente: false, saldo: 0, created_at: "" };

export default function CanteraPage() {
  const { data: productos, update: updateProd } = useTable<Producto>("productos", "nombre", true);
  const { data: clientesDB } = useTable<Cliente>("clientes", "nombre", true);
  const { data: ventas, insert: insertVenta } = useTable<VentaCantera>("ventas_cantera", "created_at", false);
  const { insert: insertMov } = useTable<Movimiento>("movimientos", "created_at", false);
  const { update: updateCli } = useTable<Cliente>("clientes", "nombre", true);

  const clientes = [PARTICULAR as any, ...clientesDB];

  const [items, setItems] = useState([{ productoId: "", cantidad: "" }]);
  const [cliId, setCliId] = useState("PARTICULAR");
  const [fp, setFp] = useState("efectivo");
  const [qCli, setQCli] = useState("");
  const [nota, setNota] = useState("");
  const [customPrice, setCustomPrice] = useState(false);
  const [precioFinal, setPrecioFinal] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDesde, setPrintDesde] = useState("");
  const [printHasta, setPrintHasta] = useState("");

  const cSel = clientes.find((c: any) => c.id === cliId);
  const fCli = clientes.filter((c: any) => c.nombre.toLowerCase().includes(qCli.toLowerCase()));

  const calcTotal = items.reduce((s, it) => { const p = productos.find((x) => x.id === it.productoId); return s + (p ? Number(p.precio) * (parseFloat(it.cantidad) || 0) : 0); }, 0);
  const total = customPrice && precioFinal !== "" ? parseFloat(precioFinal) || 0 : calcTotal;
  const canSell = items.every((it) => { if (!it.productoId || !it.cantidad || parseFloat(it.cantidad) <= 0) return false; const p = productos.find((x) => x.id === it.productoId); return p && parseFloat(it.cantidad) <= Number(p.stock); }) && items.length > 0 && total > 0;

  const vender = async () => {
    if (!canSell || !cSel) return;
    const vitems = items.map((it) => { const p = productos.find((x) => x.id === it.productoId)!; return { producto_id: p.id, nombre: p.nombre, unidad: p.unidad, cantidad: parseFloat(it.cantidad), precio_unit: Number(p.precio), subtotal: Number(p.precio) * parseFloat(it.cantidad) }; });
    await insertVenta({ cliente_id: cliId, cliente_nombre: cSel.nombre, items: vitems, total, forma_pago: fp, nota } as any);
    for (const it of items) {
      const c = parseFloat(it.cantidad); const p = productos.find((x) => x.id === it.productoId)!;
      await updateProd(p.id, { stock: Number(p.stock) - c });
      await insertMov({ producto_id: p.id, producto_nombre: p.nombre, tipo: "venta", cantidad: c, motivo: `Cantera → ${cSel.nombre}` } as any);
    }
    if (fp === "cuenta_corriente" && cliId !== "PARTICULAR") await updateCli(cliId, { saldo: Number(cSel.saldo) - total });
    setItems([{ productoId: "", cantidad: "" }]); setCliId("PARTICULAR"); setFp("efectivo"); setNota(""); setCustomPrice(false); setPrecioFinal("");
  };

  const printVentaInd = (v: VentaCantera) => {
    const items = (v.items || []).map((i: any) => `<tr><td>${i.nombre}</td><td class="r">${i.cantidad} ${i.unidad}</td><td class="r">${fmt(i.precio_unit)}</td><td class="r a b">${fmt(i.subtotal)}</td></tr>`).join("");
    const fpLabel = v.forma_pago === "efectivo" ? "Efectivo" : v.forma_pago === "transferencia" ? "Transf." : "Cta.Cte.";
    downloadHTML("Venta Cantera", `<h2>Comprobante de Venta — Cantera</h2>
      <div class="detail"><strong>Cliente:</strong> ${v.cliente_nombre} &nbsp;|&nbsp; <strong>Fecha:</strong> ${fmtDate(v.created_at)} &nbsp;|&nbsp; <strong>Pago:</strong> ${fpLabel}${v.nota ? ` &nbsp;|&nbsp; <strong>Nota:</strong> ${v.nota}` : ""}</div>
      <table><thead><tr><th>Producto</th><th class="r">Cantidad</th><th class="r">Precio</th><th class="r">Subtotal</th></tr></thead><tbody>${items}
      <tr class="tot"><td colspan="3">TOTAL</td><td class="r a">${fmt(Number(v.total))}</td></tr></tbody></table>`);
  };

  const printTotales = () => {
    let fil = ventas;
    let rangeLabel = "Histórico completo";
    if (printDesde || printHasta) {
      fil = ventas.filter((v) => { const d = toISO(v.created_at); return (!printDesde || d >= printDesde) && (!printHasta || d <= printHasta); });
      rangeLabel = `${printDesde || "..."} al ${printHasta || "..."}`;
    }
    const rows = fil.map((v) => {
      const prods = (v.items || []).map((i: any) => `${i.cantidad} ${i.unidad} ${i.nombre}`).join(", ");
      const fpLabel = v.forma_pago === "efectivo" ? "Efectivo" : v.forma_pago === "transferencia" ? "Transf." : "Cta.Cte.";
      return `<tr><td>${fmtDate(v.created_at)}</td><td class="b">${v.cliente_nombre}</td><td>${prods}</td><td>${fpLabel}</td><td class="r a b">${fmt(Number(v.total))}</td></tr>`;
    }).join("");
    downloadHTML("Ventas Cantera", `<h2>Ventas en Cantera (${fil.length})</h2><p class="sub">${rangeLabel}</p>
      <table><thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Pago</th><th class="r">Total</th></tr></thead><tbody>${rows}
      <tr class="tot"><td colspan="4">TOTAL</td><td class="r a">${fmt(fil.reduce((s, v) => s + Number(v.total), 0))}</td></tr></tbody></table>`);
  };

  const hoy = ventas.filter((v) => fmtShort(v.created_at) === fmtShort(new Date().toISOString()));

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-xl font-bold">Venta en Cantera</h1>
        <button onClick={() => { setPrintDesde(""); setPrintHasta(""); setShowPrintModal(true); }} className={btnSecondary}><span className="flex items-center gap-1.5"><Ic d={icons.print} size={13} /> Imprimir</span></button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <Stat label="Ventas Hoy" value={hoy.length} />
        <Stat label="Hoy" value={fmt(hoy.reduce((s, v) => s + Number(v.total), 0))} accent="text-accent" />
        <Stat label="Total" value={ventas.length} />
      </div>

      <div className="flex gap-5 flex-wrap">
        {/* Form */}
        <div className="bg-surface border border-border rounded-xl p-5 flex-1 min-w-[340px]">
          <h3 className="font-semibold mb-4">Nueva Venta</h3>
          <Fld label="Cliente">
            <input value={qCli} onChange={(e) => setQCli(e.target.value)} placeholder="Buscar..." className={`${inputCls} mb-1.5`} />
            <div className="max-h-24 overflow-auto border border-border rounded-md">{fCli.map((c: any) => (
              <button key={c.id} onClick={() => { setCliId(c.id); setQCli(""); if (c.id === "PARTICULAR" || !c.cuenta_corriente) setFp("efectivo"); }}
                className={`flex justify-between w-full px-3 py-1.5 text-xs text-left border-b border-border transition-colors ${cliId === c.id ? "bg-accent/10 text-accent" : "hover:bg-surface-alt"}`}>
                <span>{c.nombre}</span>{c.cuenta_corriente && <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">CC</span>}
              </button>
            ))}</div>
          </Fld>
          <Fld label="Productos">
            {items.map((it, i) => {
              const p = productos.find((x) => x.id === it.productoId);
              const overStock = p && parseFloat(it.cantidad) > Number(p.stock);
              return (
                <div key={i} className="flex gap-1.5 mb-1.5 items-center">
                  <select value={it.productoId} onChange={(e) => { const n = [...items]; n[i].productoId = e.target.value; setItems(n); }} className={`${selectCls} flex-[2]`}>
                    <option value="">Seleccionar...</option>
                    {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre} — {Number(p.stock)} {p.unidad} — {fmt(Number(p.precio))}</option>)}
                  </select>
                  <input type="number" value={it.cantidad} onChange={(e) => { const n = [...items]; n[i].cantidad = e.target.value; setItems(n); }} placeholder="Cant." className={`${inputCls} flex-[0.5] ${overStock ? "!border-red-500" : ""}`} />
                  {p && <span className="text-xs text-text-dim min-w-[55px] text-right">{fmt(Number(p.precio) * (parseFloat(it.cantidad) || 0))}</span>}
                  {items.length > 1 && <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-400"><Ic d={icons.x} size={12} className="text-red-400" /></button>}
                </div>
              );
            })}
            <button onClick={() => setItems([...items, { productoId: "", cantidad: "" }])} className="w-full py-1.5 border border-dashed border-border rounded-md text-xs text-text-dim mt-1">+ Agregar</button>
          </Fld>
          <Fld label="Forma de Pago">
            <div className="flex gap-1.5">
              {[["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ...(cSel?.cuenta_corriente && cliId !== "PARTICULAR" ? [["cuenta_corriente", "Cta.Cte."]] : [])].map(([v, l]) => (
                <button key={v} onClick={() => setFp(v)} className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-all ${fp === v ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>{l}</button>
              ))}
            </div>
          </Fld>
          <Fld label="Nota"><input value={nota} onChange={(e) => setNota(e.target.value)} className={inputCls} placeholder="Patente, ref..." /></Fld>
          <div className="mb-3">
            <button onClick={() => { setCustomPrice(!customPrice); if (!customPrice) setPrecioFinal(String(calcTotal)); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border text-xs font-semibold ${customPrice ? "bg-accent/10 border-accent/30 text-accent" : "bg-surface-alt border-border text-text-dim"}`}>
              <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center ${customPrice ? "bg-accent border-accent" : "border-text-muted"}`}>{customPrice && <Ic d={icons.check} size={8} className="text-bg" />}</div>
              Modificar precio final
            </button>
          </div>
          {customPrice && <Fld label="Precio Final ($)"><input type="number" value={precioFinal} onChange={(e) => setPrecioFinal(e.target.value)} className={`${inputCls} !border-accent`} /></Fld>}
          <div className="bg-surface-alt rounded-lg px-4 py-3 flex justify-between items-center my-3">
            <div><span className="font-semibold text-sm">TOTAL</span>{customPrice && calcTotal !== total && <div className="text-[10px] text-text-dim">Calculado: {fmt(calcTotal)}</div>}</div>
            <span className="text-2xl font-bold text-accent">{fmt(total)}</span>
          </div>
          <button onClick={vender} disabled={!canSell} className={`w-full py-3 rounded-md text-sm font-semibold transition-all ${canSell ? "bg-accent text-bg hover:brightness-110" : "bg-surface-alt text-text-muted cursor-not-allowed"}`}>Confirmar Venta</button>
        </div>

        {/* Recent sales */}
        <div className="bg-surface border border-border rounded-xl p-5 w-72 shrink-0">
          <h3 className="font-semibold mb-3">Últimas Ventas</h3>
          {ventas.length === 0 ? <Empty icon={icons.cart} text="Sin ventas" /> :
            <div className="max-h-[430px] overflow-auto">{ventas.slice(0, 15).map((v) => (
              <div key={v.id} className="py-2 border-b border-border">
                <div className="flex justify-between mb-0.5">
                  <span className="font-semibold text-xs">{v.cliente_nombre}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-accent text-xs">{fmt(Number(v.total))}</span>
                    <button onClick={() => printVentaInd(v)} className="text-text-dim hover:text-text-main"><Ic d={icons.print} size={10} /></button>
                  </div>
                </div>
                <div className="text-[10px] text-text-dim">{(v.items || []).map((i: any) => `${i.cantidad} ${i.unidad} ${i.nombre}`).join(" · ")}</div>
                <div className="text-[10px] text-text-muted">{fmtDate(v.created_at)}</div>
              </div>
            ))}</div>}
        </div>
      </div>

      {/* Print Modal */}
      <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Imprimir Ventas Cantera">
        <div className="grid grid-cols-2 gap-3">
          <Fld label="Desde (opcional)"><input type="date" value={printDesde} onChange={(e) => setPrintDesde(e.target.value)} className={inputCls} /></Fld>
          <Fld label="Hasta (opcional)"><input type="date" value={printHasta} onChange={(e) => setPrintHasta(e.target.value)} className={inputCls} /></Fld>
        </div>
        <p className="text-xs text-text-dim mb-3">Dejá vacío para histórico completo.</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowPrintModal(false)} className={btnSecondary}>Cerrar</button>
          <button onClick={printTotales} className={btnPrimary}>Descargar</button>
        </div>
      </Modal>
    </div>
  );
}