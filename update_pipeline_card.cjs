const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/pipeline/PipelineCard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import \{ ArrowUpRight, Clock, AlertTriangle, Phone \} from 'lucide-react';/,
    "import { ArrowUpRight, Clock, AlertTriangle, Phone, MessageSquare } from 'lucide-react';"
);

content = content.replace(
    /\{sale.customer\}\n                        <\/span>\n                        <span className="text-xs text-text-muted font-bold truncate block mt-0.5 opacity-80">\n                            \{sale.product\}\n                        <\/span>/,
    `{sale.customer}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] uppercase text-text-muted font-bold truncate opacity-80 border-r border-border-subtle pr-1.5">
                                {sale.product}
                            </span>
                            {sale.phone && (
                                <span className="text-[10px] text-text-muted font-mono tracking-tight opacity-70 truncate">
                                    {sale.phone}
                                </span>
                            )}
                        </div>`
);

content = content.replace(
    /<Phone size=\{16\}\/>\n                            <\/button>\n                        \)\}/,
    `<Phone size={14} fill="currentColor" />
                            </button>
                        )}
                        {sale.phone && (
                            <button className="p-1.5 rounded-lg hover:bg-surface-alt text-text-muted hover:text-blue-500 border border-transparent hover:border-border-subtle transition-all" title="Message">
                                <MessageSquare size={14} fill="currentColor" />
                            </button>
                        )}`
);

fs.writeFileSync(file, content);
console.log('PipelineCard updated');
