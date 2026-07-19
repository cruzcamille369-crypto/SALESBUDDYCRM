import fs from 'fs';
const file = '/app/applet/hooks/useAppInitialization.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { realtimeClient } from '../lib/realtimeClient';")) {
    content = content.replace("import { nexusGateway", "import { realtimeClient } from '../lib/realtimeClient';\nimport { nexusGateway");
}

content = content.replace(/import\('\.\.\/lib\/realtimeClient'\)\.then\(\(\{ realtimeClient \}\) => \{\n\s*realtimeClient\.send/g, 'realtimeClient.send');
content = content.replace(/\s*\}\);\n\s*\}\n\s*\}, \[currentUser/g, '\n        }\n    }, [currentUser');

fs.writeFileSync(file, content);
