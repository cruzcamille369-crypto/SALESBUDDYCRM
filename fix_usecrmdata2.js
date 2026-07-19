import fs from 'fs';
const file = '/app/applet/hooks/useCRMData.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/                \}\n            \}\);\n        \}\);\n/g, '                }\n            });\n');
content = content.replace(/        if \(d\.urgency === 'Flash'\) \{\n            realtimeClient\.send\('FLASH_DIRECTIVE', d\);\n            \}\);\n        \}/g, '        if (d.urgency === \'Flash\') {\n            realtimeClient.send(\'FLASH_DIRECTIVE\', d);\n        }');

fs.writeFileSync(file, content);
