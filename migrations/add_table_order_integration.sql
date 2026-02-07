-- Migración: Integración de Mesas con Pedidos
-- Ejecutar en Supabase SQL Editor

-- Agregar columna current_order_id a la tabla tables para rastrear qué pedido tienen
ALTER TABLE tables ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- Agregar columna table_id a la tabla orders para saber a qué mesa pertenece el pedido
ALTER TABLE orders ADD COLUMN IF NOT EXISTS table_id UUID REFERENCES tables(id) ON DELETE SET NULL;

-- Crear índice para buscar pedidos por mesa
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);

-- Crear índice para buscar mesa por pedido actual
CREATE INDEX IF NOT EXISTS idx_tables_current_order_id ON tables(current_order_id);
