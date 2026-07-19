const fs = require('fs');
const path = require('path');

const file = path.join(process.cwd(), 'views/AgentPortal.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace the Tabs and the wrapper
content = content.replace(
    /<Tabs value=\{view\} onValueChange=\{setView\} orientation="vertical" className="h-full w-full !flex-col block">/,
    '<Tabs value={view} onValueChange={setView} orientation="vertical" className="w-full h-full">'
);

content = content.replace(
    /<div className="flex flex-col w-full h-full">\s*<SupportTicker \/>/,
    '<div className="flex flex-col w-full h-full flex-1 min-w-0">\n                <SupportTicker />\n                <div className="flex flex-row w-full flex-1 min-h-0 relative">'
);

content = content.replace(
    /<\/PortalShell>\s*<\/div>\s*<\/Tabs>/,
    '</PortalShell>\n                </div>\n            </div>\n        </Tabs>'
);

fs.writeFileSync(file, content);
console.log('Fixed layout in AgentPortal.tsx');
