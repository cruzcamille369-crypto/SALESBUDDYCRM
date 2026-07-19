const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/layout/PortalShell.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /import \{[\s\S]*?Search,[\s\S]*?\} from 'lucide-react';/,
    match => match.replace(/Search,\s*/, '')
);

fs.writeFileSync(file, content);
console.log('Lint error fixed');
