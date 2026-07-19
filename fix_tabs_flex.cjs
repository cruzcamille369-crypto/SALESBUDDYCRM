const fs = require('fs');
const path = require('path');
const tabsPath = path.join(process.cwd(), 'components/ui/Tabs.tsx');
let content = fs.readFileSync(tabsPath, 'utf8');

// Ensure that orientation vertical really uses a robust layout.
content = content.replace(
    "className={`w-full h-full ${orientation === 'vertical' ? 'flex flex-row' : 'flex flex-col'} ${className}`}",
    "className={`w-full h-full ${orientation === 'vertical' ? 'flex flex-row' : 'flex flex-col'} ${className}`}"
);

fs.writeFileSync(tabsPath, content);
