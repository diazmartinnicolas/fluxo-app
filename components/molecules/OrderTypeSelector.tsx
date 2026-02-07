import React from 'react';
import { UtensilsCrossed, ShoppingBag, Truck } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

export type OrderType = 'local' | 'takeaway' | 'delivery';

interface OrderTypeSelectorProps {
    selected: OrderType;
    onChange: (type: OrderType) => void;
}

interface OrderTypeOption {
    value: OrderType;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

// ============================================================
// CONSTANTES
// ============================================================

const ORDER_TYPES: OrderTypeOption[] = [
    {
        value: 'local',
        label: 'Mesa',
        icon: <UtensilsCrossed size={18} />,
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-500'
    },
    {
        value: 'takeaway',
        label: 'Take Away',
        icon: <ShoppingBag size={18} />,
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-500'
    },
    {
        value: 'delivery',
        label: 'Delivery',
        icon: <Truck size={18} />,
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-500'
    }
];

// ============================================================
// COMPONENTE
// ============================================================

export const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
    selected,
    onChange
}) => {
    return (
        <div className="flex gap-2">
            {ORDER_TYPES.map((type) => {
                const isSelected = selected === type.value;
                return (
                    <button
                        key={type.value}
                        onClick={() => onChange(type.value)}
                        className={`
                            flex-1 flex flex-col items-center justify-center
                            py-2 px-3 rounded-lg border-2 transition-all
                            ${isSelected
                                ? `${type.bgColor} ${type.borderColor} ${type.color}`
                                : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
                            }
                        `}
                    >
                        <span className={isSelected ? type.color : 'text-gray-400'}>
                            {type.icon}
                        </span>
                        <span className={`text-xs font-bold mt-1 ${isSelected ? type.color : 'text-gray-500'}`}>
                            {type.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default OrderTypeSelector;
