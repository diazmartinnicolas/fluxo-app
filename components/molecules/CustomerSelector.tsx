import React, { useRef, useEffect } from 'react';
import { Search, UserPlus, X, User as UserIcon } from 'lucide-react';
import { Customer } from '../../types';

// ============================================================
// TIPOS
// ============================================================

interface CustomerSelectorProps {
    customers: Customer[];
    selectedCustomer: Customer | null;
    searchTerm: string;
    showDropdown: boolean;
    filteredCustomers: Customer[];
    onSearchChange: (term: string) => void;
    onSelectCustomer: (customer: Customer) => void;
    onClearSelection: () => void;
    onOpenDropdown: () => void;
    onCloseDropdown: () => void;
    onCreateNew: () => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
    selectedCustomer,
    searchTerm,
    showDropdown,
    filteredCustomers,
    onSearchChange,
    onSelectCustomer,
    onClearSelection,
    onOpenDropdown,
    onCloseDropdown,
    onCreateNew,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onCloseDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onCloseDropdown]);

    // Si hay un cliente seleccionado, mostrar su info
    if (selectedCustomer) {
        return (
            <div className="flex justify-between items-center bg-white border border-green-200 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                    <UserIcon size={16} className="text-green-600" />
                    <div>
                        <p className="text-sm font-bold text-gray-800">
                            {selectedCustomer.name}
                        </p>
                        {selectedCustomer.address && (
                            <p className="text-xs text-gray-500">{selectedCustomer.address}</p>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClearSelection}
                    className="text-gray-400 hover:text-red-500 p-1"
                    aria-label="Quitar cliente"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    // Si no hay cliente, mostrar el buscador
    return (
        <div className="flex items-center gap-2" ref={containerRef}>
            <div className="relative flex-1">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                />
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    className="w-full pl-9 p-2.5 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={onOpenDropdown}
                />

                {/* Dropdown de resultados */}
                {showDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-xl z-50 max-h-40 overflow-auto">
                        {filteredCustomers.map((customer) => (
                            <button
                                key={customer.id}
                                onClick={() => onSelectCustomer(customer)}
                                className="w-full p-3 hover:bg-orange-50 cursor-pointer text-sm border-b text-left"
                            >
                                <span className="font-medium">{customer.name}</span>
                                {customer.phone && (
                                    <span className="text-gray-400 ml-2 text-xs">
                                        {customer.phone}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Botón crear nuevo cliente */}
            <button
                onClick={onCreateNew}
                className="p-2.5 bg-white border rounded-lg text-gray-500 hover:text-orange-600 hover:border-orange-300 transition-colors"
                title="Nuevo Cliente"
                aria-label="Crear nuevo cliente"
            >
                <UserPlus size={20} />
            </button>
        </div>
    );
};

export default CustomerSelector;
