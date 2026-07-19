const fs = require('fs');
let content = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');
content = content.replace(/'--color-border-subtle': 'rgba\([^']*\)'/g, (match) => {
    return "'--color-border-subtle': '210 32% 80%'";
});
content = content.replace(/'--color-border-strong': 'rgba\([^']*\)'/g, (match) => {
    return "'--color-border-strong': '210 32% 70%'";
});
fs.writeFileSync('components/layout/PortalShell.tsx', content);
