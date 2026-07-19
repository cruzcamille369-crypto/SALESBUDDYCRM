import fs from 'fs';
const file = '/app/applet/components/leads/LeadDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import\('\.\.\/\.\.\/lib\/realtimeClient'\)\.then\(\(\{ realtimeClient \}\) => \{\n\s*realtimeClient\.send/g, 'realtimeClient.send');
content = content.replace(/\s*\}\);\n\s*\}\);\n\s*const renewalInterval/g, '\n        // Setup lease renewal heartbeat tick\n        const renewalInterval');
content = content.replace(/\s*\}\);\n\s*\}, 15000\);/g, '\n        }, 15000);');
content = content.replace(/\s*\}\);\n\s*\}\);/g, '\n        };');

content = content.replace(/import\('\.\.\/\.\.\/lib\/realtimeClient'\)\.then\(\(\{ realtimeClient \}\) => \{/g, '');

fs.writeFileSync(file, content);
