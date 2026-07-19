const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/admin/product/ProductSKUCard.tsx');
let content = fs.readFileSync(file, 'utf8');

const newGridView = `    // --- GRID VIEW ---
    return (
        <div className={\`group relative bg-[#FFFFFF] border rounded-[10px] p-[20px] transition-all duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] overflow-hidden flex flex-col \${
            product.active ? 'border-[#E1E6EF] hover:border-[#2D6AFF]' : 'border-dashed opacity-70 bg-[#F4F6FA]'
        }\`}>
            {/* Hover Actions */}
            <div className="absolute top-4 right-4 flex gap-1 z-20">
                <button onClick={() => onDuplicate(product)} className="opacity-0 group-hover:opacity-100 p-2 rounded-md bg-white hover:bg-[#F4F6FA] text-[#6B7A99] hover:text-[#0F1D35] border border-[#E1E6EF] shadow-sm transition-all" title="Clone SKU">
                    <Copy size={14}/>
                </button>
                <button onClick={() => onToggle(product.id)} className={\`p-2 rounded-md bg-white border shadow-sm transition-all \${product.active ? 'opacity-0 group-hover:opacity-100 border-[#E1E6EF] hover:bg-amber-50 text-[#6B7A99]' : 'border-[#22C55E] bg-emerald-50 text-[#22C55E]'}\`} title={product.active ? 'Deactivate' : 'Publish'}>
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
                            <p className="text-[14px] font-bold text-[#0F1D35]">\${product.price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7A99] mb-1">Margin</p>
                            <p className={\`text-[14px] font-bold \${margin > 40 ? 'text-[#22C55E]' : 'text-amber-500'}\`}>{margin}%</p>
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
};`;

const renderRegex = /\/\/ --- GRID VIEW ---[\s\S]*\}\;/;
content = content.replace(renderRegex, newGridView);

fs.writeFileSync(file, content);
console.log('ProductSKUCard updated');
