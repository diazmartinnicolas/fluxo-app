import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

interface CartItemProps {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotalPrice: number;
    description?: string;
    onIncrease: () => void;
    onDecrease: () => void;
    onRemove: () => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export const CartItem: React.FC<CartItemProps> = ({
    name,
    price,
    quantity,
    subtotalPrice,
    description,
    onIncrease,
    onDecrease,
    onRemove,
}) => {
    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
            {/* Información del producto */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">
                    {name}
                </p>
                {description && (
                    <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-2">
                        {description}
                    </p>
                )}
                <p className="text-xs text-orange-600 font-bold mt-1">
                    {formatPrice(subtotalPrice)}
                </p>
            </div>

            {/* Controles de cantidad */}
            <div className="flex items-center gap-2 ml-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={onDecrease}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:bg-gray-50 transition-colors"
                        aria-label="Disminuir cantidad"
                    >
                        <Minus size={12} />
                    </button>

                    <span className="text-sm font-bold w-6 text-center">
                        {quantity}
                    </span>

                    <button
                        onClick={onIncrease}
                        className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded shadow-sm hover:bg-orange-200 transition-colors"
                        aria-label="Aumentar cantidad"
                    >
                        <Plus size={12} />
                    </button>
                </div>

                {/* Botón eliminar */}
                <button
                    onClick={onRemove}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    aria-label="Eliminar del carrito"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default CartItem;
