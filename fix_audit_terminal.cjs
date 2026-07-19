const fs = require('fs');

let al = fs.readFileSync('components/widgets/AuditLog.tsx', 'utf8');
al = al.replace(/bg-rose-500\/5 border border-rose-500\/10/g, 'bg-[#09090b] border border-[#27272a]');
al = al.replace(/bg-emerald-500\/5 border border-emerald-500\/10/g, 'bg-[#09090b] border border-[#27272a]');
al = al.replace(/text-text-secondary overflow-x-auto/g, 'text-[#4ade80] overflow-x-auto');
fs.writeFileSync('components/widgets/AuditLog.tsx', al);
