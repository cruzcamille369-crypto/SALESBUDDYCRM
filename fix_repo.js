import fs from 'fs';
const file = '/app/applet/nexus/repositories/BaseRepository.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { realtimeClient } from '../../lib/realtimeClient';")) {
    content = content.replace("import { INITIAL_PRODUCT_CONFIG }", "import { realtimeClient } from '../../lib/realtimeClient';\nimport { INITIAL_PRODUCT_CONFIG }");
}

content = content.replace(/import\('\.\.\/\.\.\/lib\/realtimeClient'\)\.then\(\(\{ realtimeClient \}\) => \{\n\s*this\.wsUnsubscribe = realtimeClient\.subscribe/g, 'this.wsUnsubscribe = realtimeClient.subscribe');
content = content.replace(/\s*\}\);\n\s*\} catch \(e\)/g, '\n        } catch (e)');

fs.writeFileSync(file, content);
