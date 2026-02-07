import React, { useEffect, useState } from 'react';
import { Clock, Star, ShoppingBag, TrendingUp, Package, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { Customer } from '../../types';

// ============================================================
// TIPOS
// ============================================================

interface OrderHistoryItem {
    id: string;
    ticket_number: number;
    total: number;
    created_at: string;
    order_items: {
        item_name: string;
        quantity: number;
        price_at_moment: number;
        product?: any;
    }[];
}

interface CustomerStats {
    totalSpent: number;
    orderCount: number;
    averageTicket: number;
    favoriteProducts: { name: string; count: number }[];
    lastOrders: OrderHistoryItem[];
}

interface CustomerHistoryProps {
    customer: Customer;
    companyId?: string;
}

// ============================================================
// COMPONENTE
// ============================================================

export const CustomerHistory: React.FC<CustomerHistoryProps> = ({
    customer,
    companyId
}) => {
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCustomerHistory = async () => {
            if (!customer?.id) return;

            setLoading(true);
            setError(null);

            try {
                // Obtener los últimos 10 pedidos del cliente
                let query = supabase
                    .from('orders')
                    .select(`
            id,
            ticket_number,
            total,
            created_at,
            order_items (
              item_name,
              quantity,
              price_at_moment,
              product:products (name)
            )
          `)
                    .eq('client_id', customer.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (companyId) {
                    query = query.eq('company_id', companyId);
                }

                const { data: orders, error: ordersError } = await query;

                if (ordersError) throw ordersError;

                // Calcular estadísticas
                const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
                const orderCount = orders?.length || 0;
                const averageTicket = orderCount > 0 ? totalSpent / orderCount : 0;

                // Calcular productos favoritos
                const productCounts: Record<string, number> = {};
                orders?.forEach(order => {
                    order.order_items?.forEach((item: any) => {
                        const productName = item.item_name || item.product?.name || 'Producto';
                        productCounts[productName] = (productCounts[productName] || 0) + item.quantity;
                    });
                });

                const favoriteProducts = Object.entries(productCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);

                setStats({
                    totalSpent,
                    orderCount,
                    averageTicket,
                    favoriteProducts,
                    lastOrders: orders || []
                });
            } catch (err: any) {
                console.error('Error fetching customer history:', err);
                setError('Error al cargar historial');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerHistory();
    }, [customer?.id, companyId]);

    // Formatear precio
    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // Formatear fecha relativa
    const formatRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
        return `Hace ${Math.floor(diffDays / 30)} meses`;
    };

    if (loading) {
        return (
            <div className="p-4 flex items-center justify-center text-gray-400">
                <Loader2 className="animate-spin mr-2" size={16} />
                <span className="text-sm">Cargando historial...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-center text-red-500 text-sm">
                {error}
            </div>
        );
    }

    if (!stats || stats.orderCount === 0) {
        return (
            <div className="p-4 text-center text-gray-400">
                <ShoppingBag className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">Sin historial de compras</p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 overflow-hidden">
            {/* Header con stats principales */}
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={16} />
                    <span className="font-bold text-sm">Historial de {customer.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/20 rounded-lg p-2">
                        <p className="text-lg font-bold">{formatPrice(stats.totalSpent)}</p>
                        <p className="text-[10px] opacity-80">Total gastado</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                        <p className="text-lg font-bold">{stats.orderCount}</p>
                        <p className="text-[10px] opacity-80">Pedidos</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-2">
                        <p className="text-lg font-bold">{formatPrice(stats.averageTicket)}</p>
                        <p className="text-[10px] opacity-80">Ticket prom.</p>
                    </div>
                </div>
            </div>

            {/* Productos favoritos */}
            {stats.favoriteProducts.length > 0 && (
                <div className="p-3 border-b border-blue-100">
                    <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                        <Star size={12} className="text-yellow-500" /> Favoritos
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {stats.favoriteProducts.map((product, idx) => (
                            <span
                                key={idx}
                                className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                            >
                                {product.name} <span className="font-bold">({product.count})</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Últimos pedidos */}
            <div className="p-3">
                <p className="text-xs font-bold text-blue-800 mb-2 flex items-center gap-1">
                    <Clock size={12} /> Últimos Pedidos
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {stats.lastOrders.slice(0, 5).map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg p-2 text-xs border border-blue-50 hover:border-blue-200 transition-colors"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-gray-700">
                                    #{order.ticket_number}
                                </span>
                                <span className="text-gray-400">
                                    {formatRelativeDate(order.created_at)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 truncate flex-1">
                                    {order.order_items?.slice(0, 2).map((item: any) =>
                                        item.item_name || item.product?.name || 'Item'
                                    ).join(', ')}
                                    {order.order_items?.length > 2 && '...'}
                                </span>
                                <span className="font-bold text-blue-600 ml-2">
                                    {formatPrice(order.total)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomerHistory;
