import React from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface ConnectionStatusProps {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    onSync?: () => void;
}

/**
 * Componente que muestra el estado de conexión y pedidos pendientes
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    isOnline,
    isSyncing,
    pendingCount,
    onSync
}) => {
    // Si está online y no hay pedidos pendientes, no mostrar nada
    if (isOnline && pendingCount === 0 && !isSyncing) {
        return null;
    }

    // Si está sincronizando
    if (isSyncing) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Sincronizando...</span>
                </div>
            </div>
        );
    }

    // Si está offline
    if (!isOnline) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
                    <WifiOff size={16} />
                    <span className="text-sm font-medium">Sin conexión</span>
                    {pendingCount > 0 && (
                        <span className="bg-white text-red-500 px-2 py-0.5 rounded-full text-xs font-bold">
                            {pendingCount}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    // Si está online pero hay pedidos pendientes
    if (pendingCount > 0) {
        return (
            <div className="fixed bottom-4 left-4 z-50">
                <button
                    onClick={onSync}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg transition-colors group"
                >
                    <Cloud size={16} />
                    <span className="text-sm font-medium">
                        {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                    </span>
                    <RefreshCw size={14} className="group-hover:animate-spin" />
                </button>
            </div>
        );
    }

    return null;
};

/**
 * Versión compacta para mostrar en el header
 */
export const ConnectionStatusBadge: React.FC<{
    isOnline: boolean;
    pendingCount: number;
}> = ({ isOnline, pendingCount }) => {
    if (isOnline && pendingCount === 0) {
        return (
            <div className="flex items-center gap-1 text-green-500">
                <Wifi size={14} />
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center gap-1 text-red-500">
                <WifiOff size={14} />
                {pendingCount > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                        {pendingCount}
                    </span>
                )}
            </div>
        );
    }

    // Online con pedidos pendientes
    return (
        <div className="flex items-center gap-1 text-amber-500">
            <CloudOff size={14} />
            <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">
                {pendingCount}
            </span>
        </div>
    );
};

export default ConnectionStatus;
