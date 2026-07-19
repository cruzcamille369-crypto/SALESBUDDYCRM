const fs = require('fs');
const path = require('path');

const shellPath = path.join(process.cwd(), 'components/layout/PortalShell.tsx');
let content = fs.readFileSync(shellPath, 'utf8');

// Add hover interactions to desktop sidebar
content = content.replace(
    /hidden lg:flex transition-all duration-300 ease-out flex-col shrink-0 h-full\s+bg-sidebar-bg border-r border-sidebar-border text-sidebar-text\s+w-\[72px\] items-center z-20/,
    `hidden lg:flex transition-all duration-300 ease-out flex-col shrink-0 h-full
                    bg-sidebar-bg border-r border-sidebar-border text-sidebar-text
                    w-[72px] items-center z-20 hover:shadow-xl hover:border-sidebar-accent/30 group/sidebar`
);

// Add hover interactions to header
content = content.replace(
    /className="h-\[56px\] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-\[50\] transition-all duration-500"/,
    `className="h-[56px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-300 hover:shadow-sm hover:border-border-strong group/header"`
);

// Enhance header elements interactions
content = content.replace(
    /className="w-8 h-8 flex items-center justify-center rounded-md bg-sidebar-accent text-\[var\(--sidebar-accent-contrast\)\] cursor-pointer hover:opacity-90 transition-all shadow-sm shrink-0"/g,
    `className="w-8 h-8 flex items-center justify-center rounded-md bg-sidebar-accent text-[var(--sidebar-accent-contrast)] cursor-pointer hover:opacity-100 hover:scale-105 hover:shadow-md hover:shadow-sidebar-accent/20 active:scale-95 transition-all duration-200 shrink-0"`
);

// Enhance close icon hover
content = content.replace(
    /className="p-2 text-sidebar-text-muted hover:text-sidebar-text transition-colors"/,
    `className="p-2 text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-accent/10 rounded-lg transition-all duration-200 hover:rotate-90"`
);

fs.writeFileSync(shellPath, content);
console.log('Interactions updated in PortalShell.tsx');
