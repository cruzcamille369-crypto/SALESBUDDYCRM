const fs = require('fs');

let code = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

// Update Fresh Dark
code = code.replace(
    "'--color-text-primary': '210 40% 98%',",
    "'--color-text-primary': '0 0% 100%', // Enhanced Contrast"
);
code = code.replace(
    "'--color-text-secondary': '215 20% 65%',",
    "'--color-text-secondary': '210 20% 84%', // Enhanced Contrast"
);
code = code.replace(
    "'--color-text-muted': '215 16% 50%',",
    "'--color-text-muted': '210 20% 65%', // Enhanced Contrast"
);

// Update Fresh Light
code = code.replace(
    "'--color-text-primary': '215 28% 17%', // #1F2937 Deep charcoal",
    "'--color-text-primary': '215 28% 11%', // #111827 Enhanced Contrast"
);
code = code.replace(
    "'--color-text-secondary': '215 14% 34%', // #4B5563 Mid-to-deep gray",
    "'--color-text-secondary': '215 16% 27%', // #374151 Enhanced Contrast"
);
code = code.replace(
    "'--color-text-muted': '215 16% 47%',",
    "'--color-text-muted': '215 16% 46%', // Enhanced Contrast"
);

fs.writeFileSync('components/layout/PortalShell.tsx', code);
