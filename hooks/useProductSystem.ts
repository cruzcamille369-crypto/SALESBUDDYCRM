
import { useState, useMemo, useCallback } from 'react';
import { Product, ProductConfig, Sale } from '../types';
import { getProductPerformance, calculateMargin } from '../utils/productMath';

export type SortOption = 'name' | 'price-high' | 'price-low' | 'stock-low' | 'margin-high';

export const useProductSystem = (config: ProductConfig, sales: Sale[], onUpdate: (c: ProductConfig) => void) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [sortMode, setSortMode] = useState<SortOption>('name');

    // Mapped performance metrics for current products
    const metrics = useMemo(() => {
        const map: Record<string, { revenue: number, volume: number }> = {};
        const prods = config?.products || [];
        prods.forEach(p => {
            if (p) {
                map[p.id] = getProductPerformance(p.name, sales || []);
            }
        });
        return map;
    }, [config?.products, sales]);

    // Filtering & Sorting logic
    const filteredProducts = useMemo(() => {
        const prods = (config?.products || []).filter(p => {
            if (!p) return false;
            const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 (p.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        return prods.sort((a, b) => {
            switch (sortMode) {
                case 'price-high': return (b.price || 0) - (a.price || 0);
                case 'price-low': return (a.price || 0) - (b.price || 0);
                case 'stock-low': return (a.stock || 0) - (b.stock || 0);
                case 'margin-high': {
                    const marginA = calculateMargin(a.price || 0, a.cost || 0);
                    const marginB = calculateMargin(b.price || 0, b.cost || 0);
                    return marginB - marginA;
                }
                default: return (a.name || '').localeCompare(b.name || '');
            }
        });
    }, [config?.products, searchTerm, activeCategory, sortMode]);

    // Supply Chain Intelligence
    const stats = useMemo(() => {
        const prods = config?.products || [];
        const totalValue = prods.reduce((acc, p) => acc + ((p.price || 0) * (p.stock || 0)), 0);
        const lowStockCount = prods.filter(p => (p.stock || 0) <= (p.minStock || 10)).length;
        const avgMargin = prods.length > 0 
            ? Math.round(prods.reduce((acc, p) => acc + calculateMargin(p.price || 0, p.cost || 0), 0) / prods.length)
            : 0;
        return { totalValue, lowStockCount, avgMargin };
    }, [config?.products]);

    // Bulk price adjustment
    const adjustGlobalPrices = useCallback((percentage: number) => {
        const factor = 1 + (percentage / 100);
        const prods = config?.products || [];
        const updated = prods.map(p => ({
            ...p,
            price: Math.round((p.price || 0) * factor * 100) / 100
        }));
        onUpdate({ ...config, products: updated });
    }, [config, onUpdate]);

    // Single SKU toggle
    const toggleProductActive = useCallback((id: string) => {
        const prods = config?.products || [];
        const updated = prods.map(p => 
            p.id === id ? { ...p, active: !p.active } : p
        );
        onUpdate({ ...config, products: updated });
    }, [config, onUpdate]);

    // Duplicate Product
    const duplicateProduct = useCallback((product: Product) => {
        const newProduct = {
            ...product,
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: `${product.name || ''} (Copy)`,
            sku: `${product.sku || ''}-COPY`
        };
        const prods = config?.products || [];
        onUpdate({ ...config, products: [...prods, newProduct] });
    }, [config, onUpdate]);

    return {
        searchTerm, setSearchTerm,
        activeCategory, setActiveCategory,
        sortMode, setSortMode,
        filteredProducts,
        metrics,
        stats,
        adjustGlobalPrices,
        toggleProductActive,
        duplicateProduct
    };
};
