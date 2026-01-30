import { useState, useMemo, useCallback } from 'react';
import { Product, Promotion } from '../types';

// ============================================================
// TIPOS LOCALES DEL HOOK
// ============================================================

export interface CartItem extends Product {
    cartId: string;      // ID único para cada instancia en el carrito
    quantity?: number;   // Cantidad (para versión agrupada)
    subtotalPrice?: number;
}

export interface CartTotals {
    subtotal: number;
    totalDiscount: number;
    finalTotal: number;
    appliedDiscounts: { name: string; amount: number }[];
}

export interface UseCartReturn {
    // Estado
    cart: CartItem[];
    groupedCart: CartItem[];

    // Acciones
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    removeOneFromCart: (productId: string) => void;
    clearCart: () => void;

    // Cálculos
    totals: CartTotals;
    calculateTotals: (promotions: Promotion[]) => CartTotals;
}

// ============================================================
// HOOK: useCart
// Maneja toda la lógica del carrito de compras
// ============================================================

export function useCart(promotions: Promotion[] = []): UseCartReturn {
    const [cart, setCart] = useState<CartItem[]>([]);

    // ----------------------------------------------------------
    // ACCIONES DEL CARRITO
    // ----------------------------------------------------------

    /**
     * Agrega un producto al carrito con un ID único
     * Cada instancia es independiente para permitir promociones
     */
    const addToCart = useCallback((product: Product) => {
        const cartItem: CartItem = {
            ...product,
            cartId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setCart(current => [...current, cartItem]);

        // Feedback háptico en móviles
        if (navigator.vibrate) navigator.vibrate(50);
    }, []);

    /**
     * Elimina TODAS las instancias de un producto del carrito
     */
    const removeFromCart = useCallback((productId: string) => {
        setCart(current => current.filter(item => item.id !== productId));
    }, []);

    /**
     * Elimina UNA instancia de un producto del carrito
     */
    const removeOneFromCart = useCallback((productId: string) => {
        setCart(current => {
            const index = current.findIndex(item => item.id === productId);
            if (index === -1) return current;

            const newCart = [...current];
            newCart.splice(index, 1);
            return newCart;
        });
    }, []);

    /**
     * Vacía completamente el carrito
     */
    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    // ----------------------------------------------------------
    // CARRITO AGRUPADO (para mostrar cantidad por producto)
    // ----------------------------------------------------------

    const groupedCart = useMemo(() => {
        const grouped = cart.reduce((acc: Record<string, CartItem>, item) => {
            if (!acc[item.id]) {
                acc[item.id] = {
                    ...item,
                    quantity: 0,
                    subtotalPrice: 0
                };
            }
            acc[item.id].quantity! += 1;
            acc[item.id].subtotalPrice! += item.price;
            return acc;
        }, {});

        return Object.values(grouped);
    }, [cart]);

    // ----------------------------------------------------------
    // CÁLCULO DE TOTALES CON PROMOCIONES
    // ----------------------------------------------------------

    const calculateTotals = useCallback((promos: Promotion[]): CartTotals => {
        let tempCart = [...cart];
        const appliedDiscounts: { name: string; amount: number }[] = [];
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);

        // Aplicar cada promoción activa
        promos.forEach(promo => {
            let guard = 0; // Prevenir loops infinitos

            while (guard < 50) {
                guard++;

                // Buscar el primer producto que aplica
                const idx1 = tempCart.findIndex(item => item.id === promo.product_1_id);
                if (idx1 === -1) break;

                // Promoción de COMBO (2 productos diferentes)
                if (promo.product_2_id) {
                    const idx2 = tempCart.findIndex(
                        (item, i) => item.id === promo.product_2_id && i !== idx1
                    );

                    if (idx2 !== -1) {
                        const discountAmount = (tempCart[idx1].price + tempCart[idx2].price)
                            * (promo.discount_percentage / 100);

                        appliedDiscounts.push({ name: promo.name, amount: discountAmount });

                        // Remover items usados del tempCart
                        const usedIds = [tempCart[idx1].cartId, tempCart[idx2].cartId];
                        tempCart = tempCart.filter(item => !usedIds.includes(item.cartId));
                    } else {
                        break;
                    }
                }
                // Promoción SIMPLE o 2x1
                else {
                    const is2x1 = promo.type === '2x1' || promo.name.toLowerCase().includes('2x1');

                    if (is2x1) {
                        // 2x1: Necesita 2 del mismo producto
                        const idx2 = tempCart.findIndex(
                            (item, i) => item.id === promo.product_1_id && i !== idx1
                        );

                        if (idx2 !== -1) {
                            const discountAmount = (tempCart[idx1].price + tempCart[idx2].price)
                                * (promo.discount_percentage / 100);

                            appliedDiscounts.push({ name: promo.name, amount: discountAmount });

                            const usedIds = [tempCart[idx1].cartId, tempCart[idx2].cartId];
                            tempCart = tempCart.filter(item => !usedIds.includes(item.cartId));
                        } else {
                            break;
                        }
                    } else {
                        // Descuento simple sobre un producto
                        const discountAmount = tempCart[idx1].price * (promo.discount_percentage / 100);
                        appliedDiscounts.push({ name: promo.name, amount: discountAmount });

                        const usedId = tempCart[idx1].cartId;
                        tempCart = tempCart.filter(item => item.cartId !== usedId);
                    }
                }
            }
        });

        const totalDiscount = appliedDiscounts.reduce((sum, d) => sum + d.amount, 0);

        return {
            subtotal,
            totalDiscount,
            finalTotal: subtotal - totalDiscount,
            appliedDiscounts,
        };
    }, [cart]);

    // Memoizar totales con las promociones actuales
    const totals = useMemo(
        () => calculateTotals(promotions),
        [calculateTotals, promotions]
    );

    // ----------------------------------------------------------
    // RETORNO DEL HOOK
    // ----------------------------------------------------------

    return {
        cart,
        groupedCart,
        addToCart,
        removeFromCart,
        removeOneFromCart,
        clearCart,
        totals,
        calculateTotals,
    };
}
