import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { logAction } from '../services/audit';
import { Profile } from '../types';

// ============================================================
// TIPOS DEL CONTEXTO
// ============================================================

interface AuthContextType {
    // Estado de sesión
    session: any;
    userProfile: Profile | null;
    loading: boolean;

    // Acciones
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

// ============================================================
// CONTEXTO
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    // ----------------------------------------------------------
    // EFECTO: Inicializar sesión y escuchar cambios
    // ----------------------------------------------------------

    useEffect(() => {
        // Obtener sesión actual
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);

            if (session) {
                fetchProfile(session.user.id);
            } else {
                // Limpiar estado al cerrar sesión
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // ----------------------------------------------------------
    // FUNCIONES PRIVADAS
    // ----------------------------------------------------------

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`*, companies(*)`)
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            setUserProfile(data);
        } catch (err) {
            console.error("Error al cargar perfil:", err);
        } finally {
            setLoading(false);
        }
    };

    // ----------------------------------------------------------
    // ACCIONES PÚBLICAS
    // ----------------------------------------------------------

    const signOut = async () => {
        await logAction('LOGOUT', 'Sesión cerrada', 'Sistema');
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (session?.user?.id) {
            await fetchProfile(session.user.id);
        }
    };

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    return (
        <AuthContext.Provider value={{
            session,
            userProfile,
            loading,
            signOut,
            refreshProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================================
// HOOK DE ACCESO
// ============================================================

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuthContext must be used within AuthProvider");
    }
    return context;
};
