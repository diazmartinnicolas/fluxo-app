import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '../services/supabase';
import {
    saveToStore,
    getAllFromStore,
    getPendingOrders,
    removePendingOrder,
    updatePendingOrderStatus,
    countPendingOrders,
    PendingOrder
} from '../services/offlineStorage';
import { Product, Customer, Promotion } from '../types';

interface OfflineSyncState {
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: Date | null;
    error: string | null;
}

interface UseOfflineSyncReturn {
    state: OfflineSyncState;
    cacheData: (products: Product[], customers: Customer[], promotions: Promotion[]) => Promise<void>;
    getCachedProducts: () => Promise<Product[]>;
    getCachedCustomers: () => Promise<Customer[]>;
    getCachedPromotions: () => Promise<Promotion[]>;
    syncPendingOrders: (createOrderFn: (orderData: any, items: any[]) => Promise<any>) => Promise<number>;
    refreshPendingCount: () => Promise<void>;
}

/**
 * Hook para manejar la sincronización offline
 * Permite cachear datos y sincronizar pedidos pendientes
 */
export function useOfflineSync(): UseOfflineSyncReturn {
    const [state, setState] = useState<OfflineSyncState>({
        isSyncing: false,
        pendingCount: 0,
        lastSyncTime: null,
        error: null
    });

    // Refrescar conteo de pedidos pendientes
    const refreshPendingCount = useCallback(async () => {
        try {
            const count = await countPendingOrders();
            setState(prev => ({ ...prev, pendingCount: count }));
        } catch (err) {
            console.error('Error counting pending orders:', err);
        }
    }, []);

    // Al montar, obtener conteo inicial
    useEffect(() => {
        refreshPendingCount();
    }, [refreshPendingCount]);

    // Cachear datos para uso offline
    const cacheData = useCallback(async (
        products: Product[],
        customers: Customer[],
        promotions: Promotion[]
    ) => {
        try {
            await Promise.all([
                saveToStore('products', products),
                saveToStore('customers', customers),
                saveToStore('promotions', promotions)
            ]);
            console.log('[OfflineSync] Data cached successfully');
        } catch (err) {
            console.error('[OfflineSync] Error caching data:', err);
        }
    }, []);

    // Obtener productos cacheados
    const getCachedProducts = useCallback(async (): Promise<Product[]> => {
        try {
            return await getAllFromStore<Product>('products');
        } catch (err) {
            console.error('[OfflineSync] Error getting cached products:', err);
            return [];
        }
    }, []);

    // Obtener clientes cacheados
    const getCachedCustomers = useCallback(async (): Promise<Customer[]> => {
        try {
            return await getAllFromStore<Customer>('customers');
        } catch (err) {
            console.error('[OfflineSync] Error getting cached customers:', err);
            return [];
        }
    }, []);

    // Obtener promociones cacheadas
    const getCachedPromotions = useCallback(async (): Promise<Promotion[]> => {
        try {
            return await getAllFromStore<Promotion>('promotions');
        } catch (err) {
            console.error('[OfflineSync] Error getting cached promotions:', err);
            return [];
        }
    }, []);

    // Sincronizar pedidos pendientes
    const syncPendingOrders = useCallback(async (
        createOrderFn: (orderData: any, items: any[]) => Promise<any>
    ): Promise<number> => {
        setState(prev => ({ ...prev, isSyncing: true, error: null }));

        let synced = 0;
        let errors = 0;

        try {
            const pendingOrders = await getPendingOrders();
            const toSync = pendingOrders.filter(o => o.syncStatus === 'pending');

            if (toSync.length === 0) {
                setState(prev => ({
                    ...prev,
                    isSyncing: false,
                    lastSyncTime: new Date()
                }));
                return 0;
            }

            console.log(`[OfflineSync] Syncing ${toSync.length} pending orders...`);

            for (const order of toSync) {
                try {
                    // Marcar como sincronizando
                    await updatePendingOrderStatus(order.id, 'syncing');

                    // Intentar crear el pedido
                    await createOrderFn(order.orderData, order.orderItems);

                    // Éxito: eliminar de pendientes
                    await removePendingOrder(order.id);
                    synced++;

                    console.log(`[OfflineSync] Order ${order.id} synced successfully`);
                } catch (err: any) {
                    // Error: marcar como error
                    await updatePendingOrderStatus(order.id, 'error', err.message);
                    errors++;
                    console.error(`[OfflineSync] Error syncing order ${order.id}:`, err);
                }
            }

            // Refrescar conteo
            await refreshPendingCount();

            // Mostrar resultados
            if (synced > 0) {
                toast.success(`✅ ${synced} pedido(s) sincronizado(s)`);
            }
            if (errors > 0) {
                toast.error(`❌ ${errors} pedido(s) con error de sincronización`);
            }

            setState(prev => ({
                ...prev,
                isSyncing: false,
                lastSyncTime: new Date(),
                error: errors > 0 ? `${errors} pedidos con error` : null
            }));

            return synced;
        } catch (err: any) {
            console.error('[OfflineSync] Sync error:', err);
            setState(prev => ({
                ...prev,
                isSyncing: false,
                error: err.message
            }));
            return 0;
        }
    }, [refreshPendingCount]);

    return {
        state,
        cacheData,
        getCachedProducts,
        getCachedCustomers,
        getCachedPromotions,
        syncPendingOrders,
        refreshPendingCount
    };
}

export default useOfflineSync;
