const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/layout/PortalShell.tsx');
let content = fs.readFileSync(file, 'utf8');

// Update theme colors
content = content.replace(
    /('--sidebar-bg': '#111827',|'--sidebar-bg': '#1e293b',)/g,
    "'--sidebar-bg': '#FFFFFF',"
);

content = content.replace(
    /('--sidebar-border': 'rgba\(255, 255, 255, 0\.1\)',)/g,
    "'--sidebar-border': '#E1E6EF',"
);

content = content.replace(
    /('--sidebar-text': '#ffffff',)/g,
    "'--sidebar-text': '#0F1D35',"
);

content = content.replace(
    /('--sidebar-text-muted': '#9ca3af',|'--sidebar-text-muted': '#94a3b8',)/g,
    "'--sidebar-text-muted': '#6B7A99',"
);

content = content.replace(
    /('--sidebar-accent': '#818cf8',)/g,
    "'--sidebar-accent': '#2D6AFF',"
);

content = content.replace(
    /('--header-bg': '#ffffff',|'--header-bg': '#1e293b',)/g,
    "'--header-bg': '#0A1628',"
);

content = content.replace(
    /('--header-border': 'rgba\(0, 0, 0, 0\.08\)',|'--header-border': 'rgba\(255, 255, 255, 0\.1\)',)/g,
    "'--header-border': '#1E3459',"
);

content = content.replace(
    /('--header-text': '#1f2937',|'--header-text': '#f8fafc',)/g,
    "'--header-text': '#FFFFFF',"
);

content = content.replace(
    /('--color-surface-canvas': '210 20% 98%',)/g,
    "'--color-surface-canvas': '220 33% 97%'," // F4F6FA roughly
);

// We need to change the top nav layout.
// "Logo text: White, 16px Semi-Bold, "Admin Portal""
// "Search bar: #1A2B45 bg, white text, 36px tall, 400px wide"
// "Placeholder: "Search anything..." — NOT "OMNI SEARCH""

fs.writeFileSync(file, content);
console.log('PortalShell updated theme');
