---
description: Plan de implementación para nuevas features de Fluxo
---

# 📋 Plan de Implementación - Fluxo Features

## Features a Implementar

1. **Modo Offline** (Prioridad Alta)
2. **Historial de Cliente en POS** (Prioridad Media)
3. **Cierre de Caja** (Prioridad Media)
4. **Delivery/Para Llevar** (Prioridad Media)

---

## 🔴 1. MODO OFFLINE

### Descripción
Permitir que la app funcione sin conexión a internet, guardando pedidos localmente y sincronizándolos cuando vuelva la conexión.

### Componentes a crear/modificar
- [ ] `hooks/useOnlineStatus.ts` - Hook para detectar estado de conexión
- [ ] `hooks/useOfflineSync.ts` - Hook para sincronización
- [ ] `services/offlineStorage.ts` - Servicio de almacenamiento local (IndexedDB)
- [ ] `components/atoms/ConnectionStatus.tsx` - Indicador visual de conexión
- [ ] Modificar `POS.tsx` - Guardar pedidos offline
- [ ] Modificar `App.tsx` - Agregar indicador de conexión

### Lógica
1. Al crear pedido:
   - Si hay conexión → enviar a Supabase normalmente
   - Si NO hay conexión → guardar en IndexedDB con flag `pending_sync: true`
2. Al detectar reconexión:
   - Sincronizar todos los pedidos pendientes
   - Mostrar notificación de éxito/error
3. Mostrar indicador visual:
   - 🟢 Online
   - 🟡 Sincronizando...
   - 🔴 Offline (X pedidos pendientes)

### Datos a cachear offline
- Productos (para mostrar en POS)
- Clientes (para selección)
- Pedidos pendientes de sync

### Estimación: 4-6 horas

---

## 🟡 2. HISTORIAL DE CLIENTE EN POS

### Descripción
Al seleccionar un cliente en el POS, mostrar su historial de compras, productos favoritos y estadísticas.

### Componentes a crear/modificar
- [ ] `components/molecules/CustomerHistory.tsx` - Panel de historial
- [ ] Modificar `components/molecules/CustomerSelector.tsx` - Agregar preview de historial
- [ ] Modificar `POS.tsx` - Integrar panel de historial

### Datos a mostrar
```
┌────────────────────────────────────┐
│ 👤 Juan Pérez                      │
│ 📱 11-2345-6789                    │
│ ────────────────────────────────── │
│ 📊 Estadísticas                    │
│ • Total gastado: $45,000           │
│ • Visitas: 12 veces                │
│ • Ticket promedio: $3,750          │
│ ────────────────────────────────── │
│ ⭐ Favoritos                        │
│ • Milanesa napolitana (8 veces)    │
│ • Coca Cola (10 veces)             │
│ ────────────────────────────────── │
│ 🕐 Último pedido (hace 3 días)     │
│ • 1x Milanesa + Papas              │
│ • 2x Coca Cola                     │
│ • Total: $4,500                    │
└────────────────────────────────────┘
```

### Queries necesarias
- Obtener últimos N pedidos del cliente
- Calcular productos más frecuentes
- Sumar total gastado

### Estimación: 2-3 horas

---

## 🟡 3. CIERRE DE CAJA

### Descripción
Flujo para cerrar turno/día con conteo de efectivo, cuadre y reporte.

### Componentes a crear
- [ ] `components/CashRegister.tsx` - Módulo principal de caja
- [ ] Agregar ítem en sidebar "Caja"
- [ ] Base de datos: nueva tabla `cash_closings`

### Flujo de cierre
1. **Iniciar Cierre**
   - Mostrar resumen de ventas del período
   - Desglose por método de pago (Efectivo, Tarjeta, MercadoPago, etc.)

2. **Conteo de Efectivo**
   - Input para billetes: $1000, $500, $200, $100, $50, $20, $10
   - Input para monedas: $5, $2, $1
   - Calcular total contado

3. **Cuadre**
   - Efectivo esperado (según sistema)
   - Efectivo contado (según usuario)
   - Diferencia (faltante/sobrante)
   - Campo para observaciones

4. **Confirmación**
   - Guardar cierre en BD
   - Generar reporte imprimible
   - Opción de enviar por email

### Estructura de tabla `cash_closings`
```sql
CREATE TABLE cash_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  opened_at TIMESTAMP,
  closed_at TIMESTAMP DEFAULT NOW(),
  
  -- Ventas del período
  total_sales DECIMAL(10,2),
  cash_sales DECIMAL(10,2),
  card_sales DECIMAL(10,2),
  other_sales DECIMAL(10,2),
  
  -- Conteo
  expected_cash DECIMAL(10,2),
  counted_cash DECIMAL(10,2),
  difference DECIMAL(10,2),
  
  -- Detalle de conteo
  bills_detail JSONB,
  
  notes TEXT,
  status VARCHAR(20) DEFAULT 'closed'
);
```

### Estimación: 4-5 horas

---

## 🟡 4. DELIVERY / PARA LLEVAR

### Descripción
Agregar tipos de pedido y funcionalidad de delivery.

### Cambios en Base de Datos
```sql
-- Agregar columnas a orders
ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'local';
-- Valores: 'local', 'takeaway', 'delivery'

ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN estimated_time TIMESTAMP;
ALTER TABLE orders ADD COLUMN delivery_status VARCHAR(20);
-- Valores: 'pending', 'assigned', 'on_way', 'delivered'
```

### Componentes a crear/modificar
- [ ] Modificar `POS.tsx` - Agregar selector de tipo de pedido
- [ ] `components/molecules/OrderTypeSelector.tsx` - Selector visual
- [ ] `components/molecules/DeliveryForm.tsx` - Formulario de delivery
- [ ] `components/Deliveries.tsx` - Panel de gestión de deliveries (opcional)
- [ ] Modificar `Kitchen.tsx` - Mostrar tipo de pedido

### UI en POS
```
┌─────────────────────────────────────┐
│ Tipo de Pedido                      │
│ ┌─────────┬─────────┬─────────┐    │
│ │ 🍽️ MESA │ 🏃 LLEVAR│ 🛵 DELIV│    │
│ └─────────┴─────────┴─────────┘    │
└─────────────────────────────────────┘

Si selecciona DELIVERY:
┌─────────────────────────────────────┐
│ 📍 Dirección de entrega             │
│ [________________________]          │
│ 📱 Teléfono                         │
│ [____________]                      │
│ ⏱️ Hora estimada                    │
│ [__:__]                             │
└─────────────────────────────────────┘
```

### Estimación: 3-4 horas

---

## 📊 Resumen de Estimaciones

| Feature | Horas | Prioridad |
|---------|-------|-----------|
| Modo Offline | 4-6h | Alta |
| Historial Cliente | 2-3h | Media |
| Cierre de Caja | 4-5h | Media |
| Delivery | 3-4h | Media |
| **TOTAL** | **13-18h** | - |

---

## 🎯 Orden Sugerido de Implementación

1. **Historial de Cliente** (más rápido, impacto visible)
2. **Delivery/Para Llevar** (valor de negocio alto)
3. **Cierre de Caja** (necesidad operativa)
4. **Modo Offline** (más complejo, dejarlo para el final)

---

## ❓ Decisiones Pendientes

1. **Modo Offline**: ¿Qué datos mínimos cachear? ¿Solo productos o también clientes?
2. **Cierre de Caja**: ¿Solo efectivo o también cuadre de tarjetas?
3. **Delivery**: ¿Necesitan asignar repartidores? ¿O solo marcar como "enviado"?
4. **Historial Cliente**: ¿Cuántos pedidos anteriores mostrar?

