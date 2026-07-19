const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/leads/LeadListItem.tsx');
let content = fs.readFileSync(file, 'utf8');

// We need to add Phone and MessageSquare to lucide-react imports
content = content.replace(
    /import \{ Bell \} from 'lucide-react';/,
    "import { Bell, Phone, MessageSquare, CheckCircle } from 'lucide-react';"
);

content = content.replace(
    /<div className="flex items-center gap-2 pl-2">/,
    `<div className="flex flex-col gap-1.5 pl-2 mt-1">
                <div className="flex items-center gap-2">`
);

content = content.replace(
    /<\/div>\n        <\/div>\n    \);\n\};/,
    `</div>
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-1 pt-2 border-t border-border-subtle/30">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Quick Actions</span>
                    <div className="flex gap-1">
                        <button className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="Call">
                            <Phone size={14} />
                        </button>
                        <button className="p-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors" title="SMS">
                            <MessageSquare size={14} />
                        </button>
                        <button className="p-1 rounded bg-surface-alt text-text-muted hover:bg-text-primary hover:text-surface-main transition-colors" title="Mark Resolved">
                            <CheckCircle size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};`
);

fs.writeFileSync(file, content);
console.log('LeadListItem updated');
