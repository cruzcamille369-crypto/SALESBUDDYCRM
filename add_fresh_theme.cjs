const fs = require('fs');
let content = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

const freshTheme = `        Fresh: (theme === 'dark' ? {
            // Fresh Dark Mode: Deep Navy sidebar, very dark gray/blue workspace
            '--sidebar-bg': '#0f172a',
            '--sidebar-border': 'rgba(255, 255, 255, 0.1)',
            '--sidebar-text': '#ffffff',
            '--sidebar-text-muted': '#94a3b8',
            '--sidebar-accent': '#818cf8',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#1e293b',
            '--header-border': 'rgba(255, 255, 255, 0.1)',
            '--header-text': '#f8fafc',
            '--header-accent': '#10b981',
            // HSL overrides for workspace
            '--color-surface-canvas': '220 26% 14%',
            '--color-surface-widget': '215 28% 17%',
            '--color-surface-main': '220 26% 14%',
            '--color-surface-alt': '215 28% 20%',
            '--color-surface-highlight': '215 28% 25%',
            '--color-text-primary': '210 40% 98%',
            '--color-text-secondary': '215 20% 65%',
            '--color-text-muted': '215 16% 50%',
            '--color-border-subtle': '215 28% 25%',
            '--color-border-strong': '215 28% 35%',
            '--color-accent-primary': '160 84% 39%', // Emerald Green
            '--color-accent-secondary': '217 91% 60%', // Bright Blue
        } : {
            // Fresh Light Mode: Deep Navy sidebar, stark white header, light gray workspace
            '--sidebar-bg': '#111827',
            '--sidebar-border': 'rgba(255, 255, 255, 0.1)',
            '--sidebar-text': '#ffffff',
            '--sidebar-text-muted': '#9ca3af',
            '--sidebar-accent': '#818cf8',
            '--sidebar-accent-contrast': '#ffffff',
            '--header-bg': '#ffffff',
            '--header-border': 'rgba(0, 0, 0, 0.08)',
            '--header-text': '#1f2937',
            '--header-accent': '#10b981',
            // HSL overrides for workspace
            '--color-surface-canvas': '210 20% 98%', // Soft cool light-gray / off-white
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '210 20% 96%',
            '--color-surface-highlight': '210 20% 92%',
            '--color-text-primary': '215 28% 17%', // #1F2937 Deep charcoal
            '--color-text-secondary': '215 14% 34%', // #4B5563 Mid-to-deep gray
            '--color-text-muted': '215 16% 47%',
            '--color-border-subtle': '210 20% 90%', // #E5E7EB equivalent
            '--color-border-strong': '210 20% 80%',
            '--color-accent-primary': '160 84% 39%', // Emerald Green
            '--color-accent-secondary': '217 91% 60%', // Bright Blue
        }) as React.CSSProperties,
`;

content = content.replace("grass: (theme === 'dark' ? {", freshTheme + "        grass: (theme === 'dark' ? {");

content = content.replace(
    "grass: 'bg-[#16a34a] border-[#16a34a]'",
    "grass: 'bg-[#16a34a] border-[#16a34a]',\n                                                        Fresh: 'bg-[#111827] border-[#10b981]'"
);

fs.writeFileSync('components/layout/PortalShell.tsx', content);
