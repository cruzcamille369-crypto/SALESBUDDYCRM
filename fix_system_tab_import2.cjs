const fs = require('fs');
let content = fs.readFileSync('components/admin/system/tabs/SystemTab.tsx', 'utf-8');
content = `import { useSystem } from '../../../../hooks/useSystem';\n` + content;
fs.writeFileSync('components/admin/system/tabs/SystemTab.tsx', content);
