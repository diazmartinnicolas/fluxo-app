import React from 'react';

// ============================================================
// TIPOS
// ============================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'payment';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

// ============================================================
// ESTILOS
// ============================================================

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-bold rounded-xl transition-all
  disabled:opacity-50 disabled:cursor-not-allowed
  active:scale-95
`;

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg hover:shadow-orange-200',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    payment: 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-4 text-sm',
};

// ============================================================
// COMPONENTE
// ============================================================

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    fullWidth = false,
    children,
    className = '',
    disabled,
    ...props
}) => {
    const classes = [
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
    ].join(' ');

    return (
        <button
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
            ) : icon ? (
                icon
            ) : null}
            {children}
        </button>
    );
};

export default Button;
