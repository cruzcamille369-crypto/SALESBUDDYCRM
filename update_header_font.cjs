const fs = require('fs');
const path = require('path');

const shellPath = path.join(process.cwd(), 'components/layout/PortalShell.tsx');
let content = fs.readFileSync(shellPath, 'utf8');

content = content.replace(
    /className="text-xl sm:text-2xl font-bold text-header-text tracking-tight whitespace-nowrap truncate"/,
    'className="text-2xl sm:text-3xl font-black text-header-text tracking-tighter whitespace-nowrap truncate"'
);

fs.writeFileSync(shellPath, content);
console.log('Header font updated.');
