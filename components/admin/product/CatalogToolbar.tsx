
import React from 'react';
import { Search, LayoutGrid, List } from 'lucide-react';
import { SortOption } from '../../../hooks/useProductSystem';

interface CatalogToolbarProps {
    totalItems: number;
    searchTerm: string;
    onSearchChange: (val: string) => void;
    sortMode: SortOption;
    onSortChange: (val: SortOption) => void;
    categories: string[];
    activeCategory: string;
    onCategoryChange: (cat: string) => void;
    onToggleBulk: () => void;
    onAddProduct: () => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
    totalItems,
    searchTerm,
    onSearchChange,
    sortMode,
    onSortChange,
    categories,
    activeCategory,
    onCategoryChange,
    onToggleBulk,
    onAddProduct,
    viewMode,
    onViewModeChange
}) => {
        return (
        <div className="flex flex-col border-b border-[#E1E6EF] bg-[#FFFFFF] sticky top-0 z-20">
            <div className="p-[20px_24px] flex flex-col xl:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-baseline gap-3">
                        <h3 className="text-[16px] font-semibold text-[#0F1D35]">Master Catalog</h3>
                        <span className="text-[13px] text-[#6B7A99]">{totalItems} SKUs Active</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="relative group xl:min-w-[240px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7A99]" />
                        <input autoComplete="off" data-lpignore="true" data-prevent-autofill="true" spellCheck={false}
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="Search SKU..." 
                            className="w-full bg-[#F4F6FA] border border-[#E1E6EF] rounded-md py-[8px] pl-10 pr-4 text-[14px] text-[#0F1D35] outline-none focus:border-[#2D6AFF] transition-colors"
                        />
                    </div>
                    
                    <div className="flex bg-[#F4F6FA] p-0.5 rounded-md border border-[#E1E6EF] h-[38px]">
                        <button 
                            onClick={() => onViewModeChange('grid')} 
                            className={`px-3 flex items-center justify-center rounded transition-all ${viewMode === 'grid' ? 'bg-[#FFFFFF] text-[#0F1D35] shadow-sm border border-[#E1E6EF]' : 'text-[#6B7A99] hover:text-[#0F1D35] border border-transparent'}`}
                        >
                            <LayoutGrid size={16}/>
                        </button>
                        <button 
                            onClick={() => onViewModeChange('list')} 
                            className={`px-3 flex items-center justify-center rounded transition-all ${viewMode === 'list' ? 'bg-[#FFFFFF] text-[#0F1D35] shadow-sm border border-[#E1E6EF]' : 'text-[#6B7A99] hover:text-[#0F1D35] border border-transparent'}`}
                        >
                            <List size={16}/>
                        </button>
                    </div>

                    <select 
                        value={sortMode}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="h-[38px] bg-transparent border-none text-[#0F1D35] text-[14px] font-medium outline-none cursor-pointer hover:text-[#2D6AFF] transition-colors"
                    >
                        <option value="name">Sort by: Name (A-Z)</option>
                        <option value="price-high">Sort by: Price (High)</option>
                        <option value="price-low">Sort by: Price (Low)</option>
                        <option value="stock-low">Sort by: Stock (Low)</option>
                        <option value="margin-high">Sort by: Margin (High)</option>
                    </select>
                </div>
            </div>

            {/* Tactical Rail */}
            <div className="px-[24px] pb-4 flex items-center gap-2 overflow-x-auto custom-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`
                            h-[28px] px-[12px] rounded-full text-[11px] font-medium tracking-wide uppercase transition-all whitespace-nowrap
                            ${activeCategory === cat 
                                ? 'bg-[#2D6AFF] text-white' 
                                : 'bg-[#EEF1F7] text-[#6B7A99] hover:bg-[#E0E7FF] hover:text-[#2D6AFF]'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};
