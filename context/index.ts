// ============================================================
// CONTEXT - Barrel Export
// Exporta todos los contextos desde un único punto
// ============================================================

export { AppProvider, useApp } from './AppContext';
export { AuthProvider, useAuthContext } from './AuthContext';
export { CartProvider, useCartContext } from './CartContext';
export type { PaymentMethod } from './CartContext';
