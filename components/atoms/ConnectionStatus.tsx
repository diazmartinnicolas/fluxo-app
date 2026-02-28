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
            <div className="fixed top-0 left-0 right-0 z-[100] bg-blue-600 text-white text-center py-1.5 shadow-md flex items-center justify-center gap-2 text-sm font-bold">
                <RefreshCw size={16} className="animate-spin" />
                <span>Sincronizando datos...</span>
            </div>
        );
    }

    // Si está offline
    if (!isOnline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-center py-1.5 shadow-md flex items-center justify-center gap-2 text-sm font-bold">
                <WifiOff size={16} />
                <span>Estás usando Fluxo sin conexión a Internet</span>
                {pendingCount > 0 && (
                    <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-black ml-2 animate-pulse">
                        ⚠️ {pendingCount} pedido(s) sin subir
                    </span>
                )}
            </div>
        );
    }

    // Si está online pero hay pedidos pendientes
    if (pendingCount > 0) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-900 text-center py-1.5 shadow-md flex items-center justify-center gap-3 text-sm font-bold cursor-pointer hover:bg-amber-400 transition-colors"
                onClick={onSync}>
                <Cloud size={16} />
                <span>Tienes {pendingCount} pedido{pendingCount > 1 ? 's' : ''} pendiente(s) de sincronizar</span>
                <span className="bg-white/50 px-2 py-0.5 text-xs rounded shadow-sm flex items-center gap-1">
                    Hacer clic para forzar subida <RefreshCw size={12} />
                </span>
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
