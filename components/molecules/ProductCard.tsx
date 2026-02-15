import React from 'react';
import { Star } from 'lucide-react';
import { Product } from '../../types';

// ============================================================
// TIPOS
// ============================================================

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onToggleFavorite: (productId: string) => void;
    isHalfMode?: boolean;
    isFirstHalfSelected?: boolean;
}

// ============================================================
// COMPONENTE
// ============================================================

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onToggleFavorite,
    isHalfMode = false,
    isFirstHalfSelected = false,
}) => {
    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(val);
    };

    const handleClick = () => {
        onAddToCart(product);
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar que el click agregue al carrito
        onToggleFavorite(product.id);
    };

    return (
        <article
            onClick={handleClick}
            className={`
        bg-white rounded-xl shadow-sm border border-gray-100 
        p-2.5 md:p-3 lg:p-4 hover:shadow-md cursor-pointer transition-all 
        active:scale-95 relative group
        ${isHalfMode && isFirstHalfSelected ? 'ring-2 ring-orange-400' : ''}
      `}
            role="button"
            aria-label={`Agregar ${product.name} al carrito`}
        >
            {/* Botón Favorito */}
            <button
                onClick={handleFavoriteClick}
                className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 z-10"
                aria-label={product.is_favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
                <Star
                    size={16}
                    className={
                        product.is_favorite
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }
                />
            </button>

            {/* Contenido */}
            <header>
                <h3 className="font-bold text-gray-800 text-sm mb-1 pr-6">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                        {product.description}
                    </p>
                )}
            </header>

            {/* Precio */}
            <footer className="mt-2">
                <span className="text-orange-600 font-bold">
                    {formatPrice(product.price)}
                </span>
            </footer>

            {/* Indicador de stock bajo (si aplica) */}
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
                <div className="absolute bottom-2 right-2">
                    <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                        Quedan {product.stock}
                    </span>
                </div>
            )}
        </article>
    );
};

export default ProductCard;
