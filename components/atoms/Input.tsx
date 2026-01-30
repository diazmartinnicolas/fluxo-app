import React from 'react';
import { Search, X } from 'lucide-react';

// ============================================================
// TIPOS
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    showClearButton?: boolean;
    onClear?: () => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    showClearButton = false,
    onClear,
    className = '',
    ...props
}) => {
    const hasIcon = !!icon;

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}

            <div className="relative">
                {/* Ícono izquierdo */}
                {hasIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}

                <input
                    className={`
            w-full p-3 border border-gray-200 rounded-xl text-sm 
            bg-white shadow-sm 
            focus:ring-2 focus:ring-orange-200 focus:border-orange-400 
            outline-none transition-all
            ${hasIcon ? 'pl-10' : ''}
            ${showClearButton ? 'pr-10' : ''}
            ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-400' : ''}
            ${className}
          `}
                    {...props}
                />

                {/* Botón Clear */}
                {showClearButton && props.value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Mensaje de error */}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
};

// ============================================================
// VARIANTE: SearchInput
// ============================================================

export const SearchInput: React.FC<Omit<InputProps, 'icon'>> = (props) => {
    return (
        <Input
            icon={<Search size={18} />}
            showClearButton
            {...props}
        />
    );
};

export default Input;
