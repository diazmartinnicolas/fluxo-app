import { useMemo } from 'react';
import { Profile } from '../types';

// ============================================================
// TIPOS
// ============================================================

export interface UseAuthReturn {
    // Estados de rol
    isDemo: boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isCashier: boolean;
    isKitchen: boolean;

    // Información del usuario
    companyName: string;
    roleLabel: string;

    // Permisos específicos
    canManageInventory: boolean;
    canManageUsers: boolean;
    canViewReports: boolean;
    canManagePromotions: boolean;
    canAccessKitchen: boolean;
    canAccessPOS: boolean;
    canAccessCustomers: boolean;
    canAccessReservations: boolean;

    // Utilidades
    hasPermission: (permission: string) => boolean;
}

// ============================================================
// HOOK: useAuth
// Maneja la lógica de autenticación y permisos
// ============================================================

export function useAuth(
    session: any,
    userProfile: Profile | null
): UseAuthReturn {

    // ----------------------------------------------------------
    // DETECCIÓN DE ROLES
    // ----------------------------------------------------------

    const isDemo = useMemo(() => {
        return session?.user?.email?.toLowerCase().includes('demo') ?? false;
    }, [session?.user?.email]);

    const isSuperAdmin = useMemo(() => {
        // Super admin por rol o por email específico del CEO
        return (
            userProfile?.role === 'super_admin' ||
            session?.user?.email === 'diazmartinnicolas@gmail.com'
        );
    }, [userProfile?.role, session?.user?.email]);

    const isAdmin = useMemo(() => {
        return userProfile?.role === 'admin' || isSuperAdmin || isDemo;
    }, [userProfile?.role, isSuperAdmin, isDemo]);

    const isCashier = useMemo(() => {
        return userProfile?.role === 'cashier';
    }, [userProfile?.role]);

    const isKitchen = useMemo(() => {
        return userProfile?.role === 'cocina';
    }, [userProfile?.role]);

    const isWaiter = useMemo(() => {
        return userProfile?.role === 'mozo' || userProfile?.role === 'waiter';
    }, [userProfile?.role]);

    // ----------------------------------------------------------
    // INFORMACIÓN DEL USUARIO
    // ----------------------------------------------------------

    const companyName = useMemo(() => {
        if (isDemo) return 'Modo Demo';
        return userProfile?.companies?.name || 'Fluxo';
    }, [isDemo, userProfile?.companies?.name]);

    const roleLabel = useMemo(() => {
        if (isDemo) return 'Usuario Demo';

        const roles: Record<string, string> = {
            super_admin: 'CEO',
            admin: 'Administrador',
            cashier: 'Cajero',
            cocina: 'Cocina',
        };

        const label = roles[userProfile?.role || ''] || 'Usuario';

        // Para super admin, no mostrar el nombre de empresa
        return isSuperAdmin ? label : `${label} (${companyName})`;
    }, [isDemo, userProfile?.role, isSuperAdmin, companyName]);

    // ----------------------------------------------------------
    // PERMISOS ESPECÍFICOS
    // ----------------------------------------------------------

    const canManageInventory = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    const canManageUsers = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    const canViewReports = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    const canManagePromotions = useMemo(() => {
        return isAdmin;
    }, [isAdmin]);

    const canAccessKitchen = useMemo(() => {
        // Admin, cocina y cajero pueden ver cocina
        return isAdmin || isKitchen || isCashier;
    }, [isAdmin, isKitchen, isCashier]);

    const canAccessPOS = useMemo(() => {
        // Admin, cajero y mozo pueden acceder al POS
        return isAdmin || isCashier || isWaiter;
    }, [isAdmin, isCashier, isWaiter]);

    const canAccessCustomers = useMemo(() => {
        // Cocina NO puede ver clientes
        return isAdmin || isCashier || isWaiter;
    }, [isAdmin, isCashier, isWaiter]);

    const canAccessReservations = useMemo(() => {
        // Cocina NO puede ver reservas
        return isAdmin || isCashier || isWaiter;
    }, [isAdmin, isCashier, isWaiter]);

    // ----------------------------------------------------------
    // VERIFICADOR GENÉRICO DE PERMISOS
    // ----------------------------------------------------------

    const hasPermission = (permission: string): boolean => {
        const permissions: Record<string, boolean> = {
            'inventory': canManageInventory,
            'users': canManageUsers,
            'reports': canViewReports,
            'promotions': canManagePromotions,
            'kitchen': canAccessKitchen,
            'pos': canAccessPOS,
            'customers': canAccessCustomers,
            'reservations': canAccessReservations,
            'admin': isAdmin,
            'super_admin': isSuperAdmin,
        };

        return permissions[permission] ?? false;
    };

    // ----------------------------------------------------------
    // RETORNO DEL HOOK
    // ----------------------------------------------------------

    return {
        // Estados de rol
        isDemo,
        isSuperAdmin,
        isAdmin,
        isCashier,
        isKitchen,

        // Información del usuario
        companyName,
        roleLabel,

        // Permisos específicos
        canManageInventory,
        canManageUsers,
        canViewReports,
        canManagePromotions,
        canAccessKitchen,
        canAccessPOS,
        canAccessCustomers,
        canAccessReservations,

        // Utilidades
        hasPermission,
    };
}
