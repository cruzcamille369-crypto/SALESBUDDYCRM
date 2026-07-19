import fs from 'fs';
const file = '/app/applet/components/leads/LeadDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add static import
if (!content.includes("import { realtimeClient } from '../../lib/realtimeClient';")) {
    content = content.replace("import React,", "import { realtimeClient } from '../../lib/realtimeClient';\nimport React,");
}

content = content.replace(/import\('\.\.\/\.\.\/lib\/realtimeClient'\)\.then\(\(\{ realtimeClient \}\) => \{/g, '');
content = content.replace(/realtimeClient\.send\('LEAD_LOCK_ENGAGE', \{/g, 'realtimeClient.send(\'LEAD_LOCK_ENGAGE\', {');
// Wait, replacing block logic is tricky. Let's just do a proper regex or string replacement.

fs.writeFileSync(file, content);
