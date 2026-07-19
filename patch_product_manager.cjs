const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/admin/ProductManager.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the old header with the new one
const headerRegex = /<div className="flex items-center justify-between items-end border-b border-border-subtle pb-4">[\s\S]*?<\/div>\s*<\/div>/;
const newHeader = `<div className="h-16 flex items-end justify-between border-b border-[#E1E6EF] bg-[#FFFFFF] px-6 shrink-0">
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
                            className={\`pb-3 text-[14px] font-semibold transition-all \${
                                activeTab === 'catalog'
                                    ? 'text-[#2D6AFF] border-b-2 border-[#2D6AFF]'
                                    : 'text-[#6B7A99] hover:text-[#0F1D35]'
                            }\`}
                        >
                            Catalog & Inventory
                        </button>
                        <button
                            onClick={() => { setActiveTab('presets'); sfx.playClick(); }}
                            className={\`pb-3 text-[14px] font-semibold transition-all \${
                                activeTab === 'presets'
                                    ? 'text-[#2D6AFF] border-b-2 border-[#2D6AFF]'
                                    : 'text-[#6B7A99] hover:text-[#0F1D35]'
                            }\`}
                        >
                            Fulfillment Presets
                        </button>
                    </div>
                </div>
            </div>`;

content = content.replace(headerRegex, newHeader);
fs.writeFileSync(file, content);
console.log('ProductManager updated');
