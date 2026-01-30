import React from 'react';

// ============================================================
// TIPOS
// ============================================================

interface CategoryTabsProps {
    categories: string[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
}

// ============================================================
// COMPONENTE
// ============================================================

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
}) => {
    return (
        <nav
            className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
            role="tablist"
            aria-label="Categorías de productos"
        >
            {categories.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                    <button
                        key={category}
                        onClick={() => onSelectCategory(category)}
                        role="tab"
                        aria-selected={isSelected}
                        className={`
              px-4 py-2 rounded-full text-xs font-bold 
              whitespace-nowrap transition-all
              ${isSelected
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-white border text-gray-600 hover:bg-gray-50'
                            }
            `}
                    >
                        {category}
                    </button>
                );
            })}
        </nav>
    );
};

export default CategoryTabs;
