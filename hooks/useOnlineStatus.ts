import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar el estado de conexión a internet
 * Retorna true si hay conexión, false si está offline
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [wasOffline, setWasOffline] = useState<boolean>(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            // Si estábamos offline y ahora estamos online, marcar para sincronización
            if (!isOnline) {
                setWasOffline(true);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOnline]);

    const resetWasOffline = useCallback(() => {
        setWasOffline(false);
    }, []);

    return { isOnline, wasOffline, resetWasOffline };
}

export default useOnlineStatus;
