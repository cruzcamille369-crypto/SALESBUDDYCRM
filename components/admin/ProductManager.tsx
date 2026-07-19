
import React, { useState, useMemo } from 'react';
import { ShieldCheck, Activity } from 'lucide-react';
import { ProductConfig, Product } from '../../types';
import { sfx } from '../../lib/soundService';
import { useCRM } from '../../hooks/useCRM';
import { useSystem } from '../../hooks/useSystem';
import { useProductSystem } from '../../hooks/useProductSystem';
import { ProductSKUCard } from './product/ProductSKUCard';
import { BulkActions } from './product/BulkActions';
import { ProductConfigModal } from './product/ProductConfigModal';
import { SupplyChainHUD } from './product/SupplyChainHUD';
import { CatalogToolbar } from './product/CatalogToolbar';
import { PresetManager } from './PresetManager';

interface Props {
    configForm: ProductConfig;
    setConfigForm: (c: ProductConfig) => void;
    onSave: (c: ProductConfig) => void; 
}

export const ProductManager: React.FC<Props> = ({ configForm, setConfigForm, onSave }) => {
    const { sales } = useCRM();
    const { setToast } = useSystem();
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'catalog' | 'presets'>('catalog');
    
    // Editor State
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const safeConfigForm = useMemo(() => {
        return {
            products: configForm?.products || [],
            quantities: configForm?.quantities || [],
            medicalConditions: configForm?.medicalConditions || [],
            teams: configForm?.teams || [],
            presets: configForm?.presets || []
        };
    }, [configForm]);

    const productLogic = useProductSystem(safeConfigForm, sales, setConfigForm);

    const categories = useMemo(() => {
        const cats = new Set(safeConfigForm.products.map(p => p.category || 'General'));
        return ['All', ...Array.from(cats).sort()];
    }, [safeConfigForm.products]);

    const handleEdit = (p: Product) => {
        sfx.playClick();
        if (Object.keys(p).length === 0) {
            // New Product
            setEditingProduct({
                id: `prod-${Date.now()}`,
                name: '',
                price: 0,
                cost: 0,
                category: 'Wellness',
                dosages: ['Standard'],
                quantities: ['30 Day Supply'],
                stock: 100,
                active: true
            });
        } else {
            setEditingProduct({ ...p });
        }
        setIsEditModalOpen(true);
    };

    const handleDelete = (id: string) => {
        // if (confirm("Are you sure you want to purge this SKU? This action cannot be undone.")) {
            sfx.playDecline();
            const newProds = safeConfigForm.products.filter(p => p.id !== id);
            const newConfig = { ...safeConfigForm, products: newProds };
            setConfigForm(newConfig);
            onSave(newConfig);
            setToast({ title: 'Catalog', message: "SKU Purged from Database", type: "info" });
        // }
    };

    const handleDuplicate = (p: Product) => {
        sfx.playSubmit();
        productLogic.duplicateProduct(p);
        setTimeout(() => onSave({ ...safeConfigForm, products: [...safeConfigForm.products] }), 100); 
        setToast({ title: 'Catalog', message: "SKU Cloned Successfully", type: "success" });
    };

    const handleSaveProduct = (updatedProduct: Partial<Product>) => {
        if (!updatedProduct.name || !updatedProduct.price) {
            sfx.playError();
            setToast({ title: 'Validation Error', message: "Name and Price required.", type: "error" });
            return;
        }

        // const confirmed = window.confirm(`Confirm catalog update for ${updatedProduct.name}?`);
        // if (!confirmed) return;

        const newProds = [...safeConfigForm.products];
        const index = newProds.findIndex(p => p.id === updatedProduct.id);
        
        if (index >= 0) {
            newProds[index] = updatedProduct as Product;
        } else {
            newProds.push(updatedProduct as Product);
        }

        const newConfig = { ...safeConfigForm, products: newProds };
        setConfigForm(newConfig);
        onSave(newConfig);

        sfx.playSuccess();
        setIsEditModalOpen(false);
        setToast({ title: 'Catalog', message: "Catalog Updated & Persisted", type: "success" });
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-700 w-full overflow-hidden pb-4">
            
            <div className="h-16 flex items-end justify-between border-b border-[#E1E6EF] bg-[#FFFFFF] px-6 shrink-0">
                <div className="flex flex-col w-full">
                    <div className="flex justify-between items-center w-full mb-3">
                        <h1 className="text-[20px] font-bold text-[#0F1D35]">Products & SKUs</h1>
                        <button
                            onClick={() => handleEdit({} as any)}
                            className="px-4 py-2 bg-[#2D6AFF] hover:bg-[#1A55E0] text-white text-[14px] font-medium rounded-lg transition-colors h-9 flex items-center"
                        >
                            + New SKU
                        </button>
                    </div>
                    <div className="flex gap-6">
                        <button
                            onClick={() => { setActiveTab('catalog'); sfx.playClick(); }}
                            className={`pb-3 text-[14px] font-semibold transition-all ${
                                activeTab === 'catalog'
                                    ? 'text-[#2D6AFF] border-b-2 border-[#2D6AFF]'
                                    : 'text-[#6B7A99] hover:text-[#0F1D35]'
                            }`}
                        >
                            Catalog & Inventory
                        </button>
                        <button
                            onClick={() => { setActiveTab('presets'); sfx.playClick(); }}
                            className={`pb-3 text-[14px] font-semibold transition-all ${
                                activeTab === 'presets'
                                    ? 'text-[#2D6AFF] border-b-2 border-[#2D6AFF]'
                                    : 'text-[#6B7A99] hover:text-[#0F1D35]'
                            }`}
                        >
                            Fulfillment Presets
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'catalog' ? (
                <div className="flex flex-col flex-1 overflow-hidden min-h-0">
                    <SupplyChainHUD stats={productLogic.stats} />

                    <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-border-subtle bg-surface-main relative min-h-0">
                        
                        <CatalogToolbar 
                            totalItems={safeConfigForm.products.length}
                            searchTerm={productLogic.searchTerm}
                            onSearchChange={productLogic.setSearchTerm}
                            sortMode={productLogic.sortMode}
                            onSortChange={productLogic.setSortMode}
                            categories={categories}
                            activeCategory={productLogic.activeCategory}
                            onCategoryChange={(cat) => { productLogic.setActiveCategory(cat); sfx.playClick(); }}
                            onToggleBulk={() => setIsBulkOpen(!isBulkOpen)}
                            onAddProduct={() => handleEdit({} as any)}
                            viewMode={viewMode}
                            onViewModeChange={(m) => { setViewMode(m); sfx.playClick(); }}
                        />

                        {isBulkOpen && (
                            <BulkActions 
                                onAdjust={(pct) => {
                                    productLogic.adjustGlobalPrices(pct);
                                    setTimeout(() => onSave(safeConfigForm), 100);
                                }} 
                                onClose={() => setIsBulkOpen(false)} 
                            />
                        )}

                        <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 bg-surface-alt/10 ${viewMode === 'list' ? 'px-3' : ''}`}>
                            <div className={viewMode === 'grid' 
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4" 
                                : "flex flex-col gap-2"
                            }>
                                {productLogic.filteredProducts.map(p => (
                                    <ProductSKUCard 
                                        key={p.id}
                                        product={p}
                                        revenue={productLogic.metrics[p.id]?.revenue || 0}
                                        volume={productLogic.metrics[p.id]?.volume || 0}
                                        onToggle={(id) => {
                                            productLogic.toggleProductActive(id);
                                            setTimeout(() => onSave(safeConfigForm), 100);
                                        }}
                                        onEdit={handleEdit}
                                        onDuplicate={handleDuplicate}
                                        onDelete={handleDelete}
                                        viewMode={viewMode}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="p-3 border-t border-border-subtle bg-surface-main shrink-0 flex justify-between items-center px-5">
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Verified</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Activity size={14} className="text-indigo-600" />
                                    <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Optimal</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-mono text-text-muted opacity-50 uppercase tracking-widest">Product Module v4.5</span>
                        </div>

                        <ProductConfigModal 
                            isOpen={isEditModalOpen} 
                            onClose={() => setIsEditModalOpen(false)} 
                            product={editingProduct} 
                            onSave={handleSaveProduct} 
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden">
                    <PresetManager productConfig={safeConfigForm} onUpdateConfig={onSave} />
                </div>
            )}
        </div>
    );
};
