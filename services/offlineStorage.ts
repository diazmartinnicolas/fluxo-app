/**
 * Servicio de almacenamiento offline usando IndexedDB
 * Permite guardar productos, clientes, promociones y pedidos pendientes
 */

const DB_NAME = 'fluxo_offline';
const DB_VERSION = 1;

// Stores disponibles
type StoreName = 'products' | 'customers' | 'promotions' | 'pendingOrders';

interface PendingOrder {
    id: string;
    orderData: any;
    orderItems: any[];
    createdAt: string;
    syncStatus: 'pending' | 'syncing' | 'error';
    errorMessage?: string;
    retryCount: number;
}

// Abrir/crear la base de datos
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Store para productos
            if (!db.objectStoreNames.contains('products')) {
                db.createObjectStore('products', { keyPath: 'id' });
            }

            // Store para clientes
            if (!db.objectStoreNames.contains('customers')) {
                db.createObjectStore('customers', { keyPath: 'id' });
            }

            // Store para promociones
            if (!db.objectStoreNames.contains('promotions')) {
                db.createObjectStore('promotions', { keyPath: 'id' });
            }

            // Store para pedidos pendientes de sincronización
            if (!db.objectStoreNames.contains('pendingOrders')) {
                const store = db.createObjectStore('pendingOrders', { keyPath: 'id' });
                store.createIndex('syncStatus', 'syncStatus', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
    });
}

// Guardar múltiples items en un store
export async function saveToStore<T extends { id: string }>(
    storeName: StoreName,
    items: T[]
): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    // Limpiar store antes de guardar nuevos datos
    store.clear();

    for (const item of items) {
        store.put(item);
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

// Obtener todos los items de un store
export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
    const db = await openDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            db.close();
            resolve(request.result);
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

// Guardar un pedido pendiente
export async function savePendingOrder(
    orderData: any,
    orderItems: any[]
): Promise<string> {
    const db = await openDB();
    const tx = db.transaction('pendingOrders', 'readwrite');
    const store = tx.objectStore('pendingOrders');

    const pendingOrder: PendingOrder = {
        id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        orderData,
        orderItems,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
        retryCount: 0
    };

    store.put(pendingOrder);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            db.close();
            resolve(pendingOrder.id);
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

// Obtener pedidos pendientes
export async function getPendingOrders(): Promise<PendingOrder[]> {
    return getAllFromStore<PendingOrder>('pendingOrders');
}

// Actualizar estado de un pedido pendiente
export async function updatePendingOrderStatus(
    id: string,
    status: 'pending' | 'syncing' | 'error',
    errorMessage?: string
): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('pendingOrders', 'readwrite');
    const store = tx.objectStore('pendingOrders');
    const request = store.get(id);

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            const order = request.result as PendingOrder;
            if (order) {
                order.syncStatus = status;
                if (errorMessage) order.errorMessage = errorMessage;
                if (status === 'error') order.retryCount++;
                store.put(order);
            }
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
        };
        request.onerror = () => {
            db.close();
            reject(request.error);
        };
    });
}

// Eliminar un pedido pendiente (después de sincronizar exitosamente)
export async function removePendingOrder(id: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction('pendingOrders', 'readwrite');
    const store = tx.objectStore('pendingOrders');
    store.delete(id);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

// Contar pedidos pendientes
export async function countPendingOrders(): Promise<number> {
    const orders = await getPendingOrders();
    return orders.filter(o => o.syncStatus === 'pending').length;
}

// Limpiar todos los datos offline (para debugging/reset)
export async function clearAllOfflineData(): Promise<void> {
    const db = await openDB();
    const stores: StoreName[] = ['products', 'customers', 'promotions', 'pendingOrders'];

    const tx = db.transaction(stores, 'readwrite');

    for (const storeName of stores) {
        tx.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
            db.close();
            resolve();
        };
        tx.onerror = () => {
            db.close();
            reject(tx.error);
        };
    });
}

export type { PendingOrder };
