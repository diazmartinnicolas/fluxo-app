import { motion } from 'framer-motion';
import { Lock, Phone, LogOut, Flame } from 'lucide-react';

interface StatusOverlayProps {
    companyName: string;
    onSignOut: () => void;
}

export const StatusOverlay = ({ companyName, onSignOut }: StatusOverlayProps) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Background with heavy blur */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xl" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full text-center relative z-10"
            >
                <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-10 h-10 text-orange-600" />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2">Servicio Pausado</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Hola <strong>{companyName}</strong>, tu acceso a Fluxo se encuentra temporalmente suspendido.
                </p>

                <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Motivo</p>
                    <p className="text-sm text-gray-700 font-medium">Falta de pago de suscripción mensual.</p>
                </div>

                <div className="space-y-3">
                    <a
                        href="https://wa.me/5491121685339?text=Hola%20Nicolas,%20necesito%20ayuda%20con%20mi%20acceso%20a%20Fluxo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Phone size={18} /> Contactar a Soporte
                    </a>

                    <button
                        onClick={onSignOut}
                        className="w-full bg-white hover:bg-gray-50 text-gray-400 font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-orange-600 font-black opacity-20">
                    <Flame size={16} /> Fluxo App
                </div>
            </motion.div>
        </div>
    );
};
