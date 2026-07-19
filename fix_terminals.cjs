const fs = require('fs');

let cl = fs.readFileSync('components/admin/dashboard/CommandLog.tsx', 'utf8');
cl = cl.replace('bg-surface-main rounded-2xl border border-border-subtle', 'bg-[#09090b] rounded-2xl border border-[#27272a]');
cl = cl.replace('bg-surface-alt border border-border-subtle', 'bg-[#18181b] border border-[#27272a]');
cl = cl.replace('text-text-muted', 'text-[#a1a1aa]');
cl = cl.replace('text-text-primary', 'text-[#4ade80]');
fs.writeFileSync('components/admin/dashboard/CommandLog.tsx', cl);

let ic = fs.readFileSync('components/admin/system/IntegrationConsole.tsx', 'utf8');
ic = ic.replace('bg-surface-main text-text-primary rounded-xl border border-border-subtle', 'bg-[#09090b] text-[#4ade80] rounded-xl border border-[#27272a]');
ic = ic.replace('bg-surface-alt border-b border-border-subtle', 'bg-[#18181b] border-b border-[#27272a]');
ic = ic.replace('text-text-muted', 'text-[#a1a1aa]');
ic = ic.replace("text-text-primary", "text-[#4ade80]");
ic = ic.replace("text-emerald-600 dark:text-emerald-400", "text-emerald-400");
ic = ic.replace("text-amber-600 dark:text-amber-400", "text-amber-400");
ic = ic.replace("text-rose-600 dark:text-rose-400", "text-rose-400");
fs.writeFileSync('components/admin/system/IntegrationConsole.tsx', ic);
