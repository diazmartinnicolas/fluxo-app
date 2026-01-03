import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CheckCircle, Clock, RefreshCw, ChefHat, XCircle, AlertCircle } from 'lucide-react';

interface KitchenProps {
  demoOrders?: any[]; // Pedidos simulados que vienen de App.tsx
  onDemoComplete?: (id: any) => void; // Función para limpiar pedidos demo en App.tsx
}

export default function Kitchen({ demoOrders = [], onDemoComplete }: KitchenProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- CARGA DE DATOS REALES (SUPABASE) ---
  const fetchOrders = async () => {
    setLoading(true);
    
    try {
        const { data: realOrders, error } = await supabase
        .from('orders')
        .select(`
            *,
            client:clients(name),
            order_items (
                quantity,
                product:products(name)
            )
        `)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: true });

        if (error) throw error;
        if (realOrders) setOrders(realOrders);
        
    } catch (error) {
        console.error("Error cargando pedidos reales:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Polling automático para refrescar pedidos reales cada 30s
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- ACCIÓN: COMPLETAR PEDIDO (VERDE) ---
  const handleCompleteOrder = async (orderId: string | number) => {
    
    // 1. Lógica Demo
    if (onDemoComplete && demoOrders.some(o => o.id === orderId)) {
        onDemoComplete(orderId);
        return;
    }

    // 2. Lógica Real (Supabase)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completado' })
      .eq('id', orderId);

    if (error) {
      alert("Error al completar: " + error.message);
    } else {
      fetchOrders(); // Recargar lista real
    }
  };

  // --- ACCIÓN: CANCELAR PEDIDO (ROJO) ---
  const handleCancelOrder = async (orderId: string | number) => {
    if (!confirm("¿Seguro que deseas CANCELAR este pedido?")) return;

    // 1. Lógica Demo
    if (onDemoComplete && demoOrders.some(o => o.id === orderId)) {
        onDemoComplete(orderId); 
        return;
    }

    // 2. Lógica Real
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelado' })
      .eq('id', orderId);

    if (error) {
      alert("Error al cancelar: " + error.message);
    } else {
      fetchOrders(); // Recargar lista real
    }
  };

  // --- MERGE DE DATOS ---
  const allOrders = [...demoOrders, ...orders].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (loading && allOrders.length === 0) return <div className="p-10 text-center text-gray-500 animate-pulse">Cargando comandas...</div>;

  return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <ChefHat size={32} className="text-orange-500" /> Comandas de Cocina
        </h2>
        
        {/* Botón de Refresco (Sin leyenda) */}
        <button 
          onClick={fetchOrders} 
          className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors shadow-sm"
          title="Actualizar"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {allOrders.length === 0 ? (
        <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
          <CheckCircle size={64} className="mb-4 opacity-20"/>
          <p className="text-xl font-medium">Todo limpio, chef.</p>
          <p className="text-sm mt-1">No hay pedidos pendientes en cola.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allOrders.map((order) => {
            // Detectar si es demo para estilo visual diferenciado (opcional, pero útil)
            const isDemo = demoOrders.some(d => d.id === order.id);

            return (
                <div key={order.id} className={`rounded-xl shadow-lg border-l-4 overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in duration-300 ${isDemo ? 'bg-orange-50 border-orange-500' : 'bg-white border-blue-500'}`}>
                {/* Header Ticket */}
                <div className={`p-3 border-b flex justify-between items-start ${isDemo ? 'bg-orange-100 text-orange-900' : 'bg-gray-50 text-gray-800'}`}>
                    <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        #{order.ticket_number} 
                        {isDemo && <span className="text-[10px] bg-orange-600 text-white px-1.5 py-0.5 rounded uppercase">Demo</span>}
                    </h3>
                    <p className={`text-xs font-medium truncate w-32 md:w-40 ${isDemo ? 'text-orange-800' : 'text-gray-500'}`}>
                        {order.client?.name || 'Cliente Mostrador'}
                    </p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${isDemo ? 'bg-white border-orange-200 text-orange-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                    <Clock size={12} />
                    <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>

                {/* Items */}
                <div className="p-4 flex-1 text-gray-700">
                    <ul className="space-y-3">
                    {order.order_items?.map((item: any, index: number) => (
                        <li key={index} className={`flex gap-3 text-sm border-b border-dashed pb-2 last:border-0 last:pb-0 ${isDemo ? 'border-orange-200' : 'border-gray-100'}`}>
                        <span className={`font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs flex-shrink-0 ${isDemo ? 'bg-orange-200 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                            {item.quantity}
                        </span>
                        <span className="leading-tight pt-0.5">
                            {item.product?.name || 'Producto desconocido'}
                        </span>
                        </li>
                    ))}
                    </ul>
                </div>

                {/* Footer Actions */}
                <div className={`p-3 border-t flex gap-2 ${isDemo ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                    {/* BOTÓN CANCELAR (NUEVO) */}
                    <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-4 rounded-lg font-bold border transition-colors flex items-center justify-center gap-2 bg-red-100 border-red-200 text-red-700 hover:bg-red-200"
                        title="Cancelar Pedido"
                    >
                        <XCircle size={20} />
                        <span className="hidden xl:inline">Cancelar</span>
                    </button>

                    {/* BOTÓN LISTO (EXISTENTE) */}
                    <button 
                        onClick={() => handleCompleteOrder(order.id)}
                        className={`flex-1 py-3 rounded-lg font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${isDemo ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        <CheckCircle size={18} /> {isDemo ? 'Despachar' : 'Listo'}
                    </button>
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
}