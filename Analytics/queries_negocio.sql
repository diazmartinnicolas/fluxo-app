-- ==========================================================
-- ANALÍTICA DE NEGOCIO - FLUXO APP (DEMO)
-- Objetivo: Extraer KPIs clave para la gestión de la pizzería.
-- ==========================================================

-- 1. RENDIMIENTO GENERAL (Venta Total, Pedidos y Ticket Promedio)
-- Este query permite llenar las tarjetas principales del dashboard.
SELECT 
  COUNT(id) as total_pedidos,
  SUM(total) as ingresos_totales,
  ROUND(AVG(total), 2) as ticket_promedio
FROM public.orders
WHERE company_id = '17ea9272-bf9d-406d-bca3-01fc75d08032';

-- 2. MIX DE PRODUCTOS (¿Qué es lo que más se vende?)
-- Ayuda a la toma de decisiones sobre stock y promociones.
SELECT 
  p.name as producto, 
  SUM(oi.quantity) as unidades_vendidas,
  SUM(oi.quantity * oi.price_at_moment) as recaudacion
FROM public.order_items oi
JOIN public.products p ON oi.product_id = p.id
WHERE oi.company_id = '17ea9272-bf9d-406d-bca3-01fc75d08032'
GROUP BY p.name
ORDER BY unidades_vendidas DESC;

-- 3. ANÁLISIS DE HORARIOS PICO
-- Identifica en qué momento del día se concentra la demanda.
SELECT 
  extract(hour from created_at) as hora,
  count(*) as cantidad_pedidos
FROM public.orders
WHERE company_id = '17ea9272-bf9d-406d-bca3-01fc75d08032'
GROUP BY 1
ORDER BY 1;