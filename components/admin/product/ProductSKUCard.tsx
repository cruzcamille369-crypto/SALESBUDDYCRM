
import React from 'react';
import { Package, Power, Edit3, Copy, AlertTriangle, Trash2, ShieldCheck, Activity } from 'lucide-react';
import { Product } from '../../../types';
import { getInventoryHealth, calculateMargin } from '../../../utils/productMath';

interface Props {
    product: Product;
    revenue: number;
    volume: number;
    onToggle: (id: string) => void;
    onEdit: (p: Product) => void;
    onDuplicate: (p: Product) => void;
    onDelete: (id: string) => void;
    viewMode: 'grid' | 'list';
}

export const ProductSKUCard: React.FC<Props> = ({ product, volume, onToggle, onEdit, onDuplicate, onDelete, viewMode }) => {
    const _health = getInventoryHealth(product);
    const margin = calculateMargin(product.price, product.cost || 0);

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className={`group flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm ${product.active ? 'bg-surface-main border-border-subtle hover:border-indigo-600/30' : 'bg-surface-alt/40 border-dashed border-border-subtle opacity-70'}`}>
                
                {/* Left Side: Drag Handle & Core Identity */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex flex-col gap-[3px] px-1 opacity-20 cursor-grab hover:opacity-100 transition-opacity">
                        <div className="w-1 h-1 bg-text-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-text-primary rounded-full"></div>
                        <div className="w-1 h-1 bg-text-primary rounded-full"></div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${product.active ? 'bg-indigo-600/10 border-indigo-600/20 text-indigo-600' : 'bg-surface-alt text-text-muted border-border-subtle'}`}>
                        <Package size={18} strokeWidth={2.5}/>
                    </div>
                    
                    <div className="flex flex-col min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h5 className="font-bold text-[14px] text-text-primary tracking-tight truncate">{product.name}</h5>
                            {!product.active && <span className="text-[10px] bg-surface-alt border border-border-subtle px-1.5 py-0.5 rounded font-bold text-text-muted uppercase tracking-wider">Draft</span>}
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="text-[11px] font-bold uppercase tracking-widest text-text-muted bg-surface-alt px-1.5 py-0.5 rounded border border-border-subtle w-fit">
                                {product.category || 'GENERAL'}
                             </div>
                             <span className="text-xs text-text-muted font-mono">{product.sku || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Middle: Economics */}
                <div className="flex items-center gap-8 px-6 border-l border-r border-border-subtle mx-4 shrink-0 hidden lg:flex">
                    <div className="w-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Pricing</p>
                        <p className="text-sm font-bold text-text-primary num-font">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="w-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Cost</p>
                        <p className="text-sm font-medium text-text-secondary num-font">${product.cost?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div className="w-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Margin</p>
                        <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-bold num-font ${margin > 40 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin}%</p>
                            <div className={`w-1.5 h-1.5 rounded-full ${margin > 40 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                        </div>
                    </div>
                    <div className="w-24">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Stock</p>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-text-primary">{product.stock || 0}</p>
                            {(product.stock || 0) < 20 && <AlertTriangle size={12} className="text-rose-500" />}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onToggle(product.id)} className={`p-2 rounded-md border border-transparent transition-all ${product.active ? 'hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20 text-text-muted' : 'text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/20'}`} title={product.active ? 'Deactivate' : 'Publish'}>
                        <Power size={14} strokeWidth={2.5}/>
                    </button>
                    <button onClick={() => onDuplicate(product)} className="p-2 hover:bg-surface-alt border border-transparent hover:border-border-subtle rounded-md text-text-muted transition-colors" title="Duplicate">
                        <Copy size={14} strokeWidth={2.5}/>
                    </button>
                    <button onClick={() => onEdit(product)} className="p-2 hover:bg-indigo-600/10 border border-transparent hover:border-indigo-600/20 rounded-md text-text-muted hover:text-indigo-600 transition-colors" title="Edit Configuration">
                        <Edit3 size={14} strokeWidth={2.5}/>
                    </button>
                    <div className="w-px h-4 bg-border-subtle mx-1"></div>
                    <button onClick={() => onDelete(product.id)} className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-md text-text-muted hover:text-rose-500 transition-colors" title="Delete">
                        <Trash2 size={14} strokeWidth={2.5}/>
                    </button>
                </div>
            </div>
        );
    }

        // --- GRID VIEW ---
    return (
        <div className={`group relative bg-[#FFFFFF] border rounded-[10px] p-[20px] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col ${
            product.active ? 'border-[#E1E6EF] hover:border-[#2D6AFF]' : 'border-dashed opacity-70 bg-[#F4F6FA]'
        }`}>
            {/* Hover Actions */}
            <div className="absolute top-4 right-4 flex gap-1 z-20">
                <button onClick={() => onDuplicate(product)} className="opacity-0 group-hover:opacity-100 p-2 rounded-md bg-white hover:bg-[#F4F6FA] text-[#6B7A99] hover:text-[#0F1D35] border border-[#E1E6EF] shadow-sm transition-all" title="Clone SKU">
                    <Copy size={14}/>
                </button>
                <button onClick={() => onToggle(product.id)} className={`p-2 rounded-md bg-white border shadow-sm transition-all ${product.active ? 'opacity-0 group-hover:opacity-100 border-[#E1E6EF] hover:bg-amber-50 text-[#6B7A99]' : 'border-[#22C55E] bg-emerald-50 text-[#22C55E]'}`} title={product.active ? 'Deactivate' : 'Publish'}>
                    <Power size={14}/>
                </button>
                <button onClick={() => onEdit(product)} className="opacity-0 group-hover:opacity-100 p-2 bg-white hover:bg-blue-50 rounded-md text-[#6B7A99] hover:text-[#2D6AFF] border border-[#E1E6EF] shadow-sm transition-all" title="Edit SKU">
                    <Edit3 size={14}/>
                </button>
                <button onClick={() => onDelete(product.id)} className="opacity-0 group-hover:opacity-100 p-2 bg-white hover:bg-red-50 rounded-md text-[#6B7A99] hover:text-[#EF4444] border border-[#E1E6EF] shadow-sm transition-all" title="Delete">
                    <Trash2 size={14}/>
                </button>
            </div>

            <div className="flex-1 relative z-10 w-full flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EEF5FF] text-[#2D6AFF]">
                        <Package size={20} strokeWidth={2}/>
                    </div>
                </div>
                
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <span className="bg-[#EEF1F7] text-[#6B7A99] text-[11px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide truncate max-w-[60%]">
                            {product.category || 'GENERAL'}
                        </span>
                        <span className="text-[11px] text-[#6B7A99] font-medium tracking-wide font-mono truncate">
                            · {product.sku || 'N/A'}
                        </span>
                    </div>
                    
                    <h5 className="font-semibold text-[#0F1D35] text-[16px] truncate pr-2 mb-4">{product.name}</h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7A99] mb-1">Price</p>
                            <p className="text-[14px] font-bold text-[#0F1D35]">${product.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7A99] mb-1">Margin</p>
                            <p className={`text-[14px] font-bold ${margin > 40 ? 'text-[#22C55E]' : 'text-amber-500'}`}>{margin}%</p>
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#E1E6EF] flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#22C55E]" />
                        <span className="text-[12px] font-medium text-[#22C55E]">Verified</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-[#2D6AFF]" />
                        <span className="text-[12px] font-medium text-[#2D6AFF]">Optimal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
