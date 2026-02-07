import React from 'react';
import { MapPin, Phone, Clock } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

export interface DeliveryInfo {
    address: string;
    phone: string;
    notes: string;
}

interface DeliveryFormProps {
    deliveryInfo: DeliveryInfo;
    onChange: (info: DeliveryInfo) => void;
    customerAddress?: string;
    customerPhone?: string;
}

// ============================================================
// COMPONENTE
// ============================================================

export const DeliveryForm: React.FC<DeliveryFormProps> = ({
    deliveryInfo,
    onChange,
    customerAddress,
    customerPhone
}) => {
    // La lógica de auto-completar está en el componente padre (POS)
    // para evitar conflictos de estado

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100 space-y-3">
            <p className="text-xs font-bold text-blue-800 flex items-center gap-1 mb-2">
                🛵 Datos de Delivery
            </p>

            {/* Dirección */}
            <div className="relative">
                <MapPin
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="Dirección de entrega"
                    value={deliveryInfo.address}
                    onChange={(e) => onChange({ ...deliveryInfo, address: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-200 rounded-lg
                             focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none
                             bg-white placeholder-gray-400"
                />
            </div>

            {/* Teléfono */}
            <div className="relative">
                <Phone
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400"
                    size={16}
                />
                <input
                    type="tel"
                    placeholder="Teléfono de contacto"
                    value={deliveryInfo.phone}
                    onChange={(e) => onChange({ ...deliveryInfo, phone: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-200 rounded-lg
                             focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none
                             bg-white placeholder-gray-400"
                />
            </div>

            {/* Notas/Observaciones */}
            <div>
                <textarea
                    placeholder="Notas adicionales (ej: tocar timbre, piso 3, etc.)"
                    value={deliveryInfo.notes}
                    onChange={(e) => onChange({ ...deliveryInfo, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg
                             focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none
                             bg-white placeholder-gray-400 resize-none"
                />
            </div>
        </div>
    );
};

export default DeliveryForm;
