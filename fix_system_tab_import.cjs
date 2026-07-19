const fs = require('fs');
let content = fs.readFileSync('components/admin/system/tabs/SystemTab.tsx', 'utf-8');
content = content.replace(
  `import { SystemConfig } from '../../../../hooks/useSystem';`,
  `import { SystemConfig, useSystem } from '../../../../hooks/useSystem';`
);
fs.writeFileSync('components/admin/system/tabs/SystemTab.tsx', content);
