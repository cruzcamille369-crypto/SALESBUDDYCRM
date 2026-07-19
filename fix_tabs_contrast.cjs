const fs = require('fs');
const path = require('path');

const tabsPath = path.join(process.cwd(), 'components/ui/Tabs.tsx');
let content = fs.readFileSync(tabsPath, 'utf8');

// Enhance horizontal tabs
content = content.replace(
    /const horizontalStyles = `px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-all duration-200 border-b-2 outline-none \$\{/,
    'const horizontalStyles = `px-5 py-3.5 flex items-center gap-2.5 text-[15px] font-extrabold tracking-wide transition-all duration-300 border-b-2 outline-none ${'
);

// Enhance active horizontal tab
content = content.replace(
    /isActive \n\s+\? 'horizontal-tab-trigger-active' \n\s+: 'horizontal-tab-trigger-inactive'/,
    `isActive \n      ? 'horizontal-tab-trigger-active text-text-primary' \n      : 'horizontal-tab-trigger-inactive text-text-muted hover:text-text-primary'`
);

// Enhance vertical tabs (sidebar icons)
content = content.replace(
    /const verticalStyles = `w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 outline-none \$\{/,
    'const verticalStyles = `w-full flex justify-center items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 outline-none ${'
);

// Enhance active vertical tab
content = content.replace(
    /isActive \n\s+\? 'vertical-tab-trigger-active' \n\s+: 'vertical-tab-trigger-inactive'/,
    `isActive \n      ? 'vertical-tab-trigger-active text-sidebar-accent shadow-md shadow-sidebar-accent/10' \n      : 'vertical-tab-trigger-inactive text-sidebar-text-muted hover:text-sidebar-text'`
);

fs.writeFileSync(tabsPath, content);
console.log('Tabs.tsx contrast and font weight updated.');
