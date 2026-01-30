import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Customer } from '../types';

// ============================================================
// TIPOS DEL CONTEXTO
// ============================================================

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta';

interface CartContextType {
    // Cliente seleccionado
    selectedCustomerId: string;
    setSelectedCustomerId: (id: string) => void;
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;

    // Método de pago
    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;

    // Estado de procesamiento
    isProcessing: boolean;
    setIsProcessing: (processing: boolean) => void;

    // Reset después de checkout
    resetCheckout: () => void;
}

// ============================================================
// CONTEXTO
// ============================================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Estado del cliente
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Método de pago
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');

    // Estado de procesamiento
    const [isProcessing, setIsProcessing] = useState(false);

    // ----------------------------------------------------------
    // ACCIONES
    // ----------------------------------------------------------

    const resetCheckout = () => {
        setSelectedCustomerId('');
        setSelectedCustomer(null);
        setPaymentMethod('efectivo');
        setIsProcessing(false);
    };

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    return (
        <CartContext.Provider value={{
            selectedCustomerId,
            setSelectedCustomerId,
            selectedCustomer,
            setSelectedCustomer,
            paymentMethod,
            setPaymentMethod,
            isProcessing,
            setIsProcessing,
            resetCheckout,
        }}>
            {children}
        </CartContext.Provider>
    );
};

// ============================================================
// HOOK DE ACCESO
// ============================================================

export const useCartContext = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCartContext must be used within CartProvider");
    }
    return context;
};
