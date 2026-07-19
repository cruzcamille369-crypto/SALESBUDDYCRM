const fs = require('fs');
let content = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

// For Classic dark mode, make the canvas dark:
let classicDark = `
            // Main workspace canvas (Dark)
            '--color-surface-canvas': '0 0% 6%',
            '--color-surface-widget': '0 0% 9%',
            '--color-surface-main': '0 0% 12%',
            '--color-surface-alt': '0 0% 16%',
            '--color-surface-highlight': '0 0% 20%',
            '--color-text-primary': '0 0% 100%',
            '--color-text-secondary': '0 0% 80%',
            '--color-text-muted': '0 0% 60%',
            '--color-border-subtle': '0 0% 18%',
            '--color-border-strong': '0 0% 28%',
            '--color-accent-primary': '250 85% 70%', 
            '--color-accent-secondary': '330 80% 70%',
`;

// For Classic light mode, make the canvas light:
let classicLight = `
            // Main workspace canvas (Light)
            '--color-surface-canvas': '0 0% 98%',
            '--color-surface-widget': '0 0% 100%',
            '--color-surface-main': '0 0% 100%',
            '--color-surface-alt': '0 0% 96%',
            '--color-surface-highlight': '0 0% 92%',
            '--color-text-primary': '0 0% 0%',
            '--color-text-secondary': '0 0% 40%',
            '--color-text-muted': '0 0% 50%',
            '--color-border-subtle': '0 0% 90%',
            '--color-border-strong': '0 0% 80%',
            '--color-accent-primary': '250 85% 60%', 
            '--color-accent-secondary': '330 80% 60%',
`;

content = content.replace(/\/\/ Main workspace canvas gets flipped to white!(.*?)(?= \/\/ LIGHT MODE|\} : \{)/s, classicDark);
content = content.replace(/\/\/ Main workspace canvas gets flipped to black!(.*?)(?=\})/s, classicLight);

fs.writeFileSync('components/layout/PortalShell.tsx', content);
