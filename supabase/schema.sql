-- ═══════════════════════════════════════════════════════════
-- SISTEMAS MEZZAVILLA - Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════

-- 1) Productos
CREATE TABLE IF NOT EXISTS productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  unidad TEXT DEFAULT 'm³',
  precio NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2) Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  email TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  cuenta_corriente BOOLEAN DEFAULT false,
  saldo NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Ventas Cantera
CREATE TABLE IF NOT EXISTS ventas_cantera (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pago TEXT DEFAULT 'efectivo',
  nota TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Viajes
CREATE TABLE IF NOT EXISTS viajes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  telefono_contacto TEXT DEFAULT '',
  direccion_entrega TEXT DEFAULT '',
  producto_id TEXT DEFAULT '',
  producto_nombre TEXT DEFAULT '',
  cantidad_producto NUMERIC(12,2) DEFAULT 0,
  unidad_producto TEXT DEFAULT 'm³',
  precio_producto NUMERIC(12,2) DEFAULT 0,
  precio_flete NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_entrega DATE,
  hora_entrega TEXT DEFAULT '',
  forma_pago TEXT DEFAULT 'efectivo',
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'finalizado', 'cancelado')),
  nota TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Movimientos de stock
CREATE TABLE IF NOT EXISTS movimientos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso', 'venta')),
  cantidad NUMERIC(12,2) NOT NULL,
  motivo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6) Pagos
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nombre TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  metodo TEXT DEFAULT 'efectivo',
  nota TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (solo usuarios autenticados)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_cantera ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- Políticas: cualquier usuario autenticado puede CRUD
CREATE POLICY "Auth users full access" ON productos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON ventas_cantera FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON viajes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON movimientos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth users full access" ON pagos FOR ALL USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════
-- Datos iniciales de productos
-- ═══════════════════════════════════════════════════════════

INSERT INTO productos (nombre, unidad, precio, stock) VALUES
  ('Arena Gruesa', 'm³', 8500, 500),
  ('Arena Fina', 'm³', 9000, 350),
  ('Piedra Partida 6-20', 'm³', 11000, 800),
  ('Piedra Partida 6-12', 'm³', 12000, 600),
  ('Tosca', 'm³', 6500, 1200),
  ('Cascote', 'm³', 5000, 400)
ON CONFLICT DO NOTHING;
