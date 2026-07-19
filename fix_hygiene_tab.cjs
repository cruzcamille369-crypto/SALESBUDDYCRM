const fs = require('fs');
let content = fs.readFileSync('components/admin/system/tabs/HygieneTab.tsx', 'utf-8');
content = content.replace(/border-surface-main/g, 'border-white');
fs.writeFileSync('components/admin/system/tabs/HygieneTab.tsx', content);
