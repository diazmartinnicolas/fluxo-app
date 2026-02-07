import { useState, useCallback } from 'react';
import { Customer } from '../types';

// ============================================================
// TIPOS
// ============================================================

export interface UseCustomerSelectorReturn {
    // Estado
    selectedCustomerId: string;
    selectedCustomer: Customer | null;
    searchTerm: string;
    showDropdown: boolean;
    filteredCustomers: Customer[];

    // Acciones
    setSearchTerm: (term: string) => void;
    selectCustomer: (customer: Customer) => void;
    clearSelection: () => void;
    openDropdown: () => void;
    closeDropdown: () => void;
}

// ============================================================
// HOOK: useCustomerSelector
// Maneja la lógica de selección de cliente
// ============================================================

export function useCustomerSelector(
    customers: Customer[]
): UseCustomerSelectorReturn {

    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // ----------------------------------------------------------
    // FILTRADO DE CLIENTES
    // ----------------------------------------------------------

    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.toLowerCase();
        return c.name.toLowerCase().includes(term) ||
            (c.phone && c.phone.includes(searchTerm));
    });

    // ----------------------------------------------------------
    // CLIENTE SELECCIONADO
    // ----------------------------------------------------------

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || null;

    // ----------------------------------------------------------
    // ACCIONES
    // ----------------------------------------------------------

    const selectCustomer = useCallback((customer: Customer) => {
        setSelectedCustomerId(customer.id);
        setSearchTerm(customer.name);
        setShowDropdown(false);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedCustomerId('');
        setSearchTerm('');
    }, []);

    const openDropdown = useCallback(() => {
        setShowDropdown(true);
    }, []);

    const closeDropdown = useCallback(() => {
        setShowDropdown(false);
    }, []);

    // ----------------------------------------------------------
    // RETORNO
    // ----------------------------------------------------------

    return {
        selectedCustomerId,
        selectedCustomer,
        searchTerm,
        showDropdown,
        filteredCustomers,
        setSearchTerm,
        selectCustomer,
        clearSelection,
        openDropdown,
        closeDropdown,
    };
}
