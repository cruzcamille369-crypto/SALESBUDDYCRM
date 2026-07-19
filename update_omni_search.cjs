const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/admin/OmniSearch.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update width and style
content = content.replace(
    /style=\{\{ width: '300px', height: '35px' \}\}/g,
    "style={{ width: '400px', height: '36px', backgroundColor: '#1A2B45' }}"
);
content = content.replace(
    /<span className="text-sm font-semibold uppercase tracking-wide hidden md:block">Omni Search<\/span>/g,
    `<span className="text-sm font-normal text-slate-300 hidden md:block">Search anything...</span>`
);

content = content.replace(
    /placeholder="Search by phone, name..."/g,
    `placeholder="Search anything..."`
);

fs.writeFileSync(file, content);
console.log('OmniSearch updated');
