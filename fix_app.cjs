const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const imports = [];
let otherCode = '';

const lines = code.split('\n');
for (const line of lines) {
  if (line.trim().startsWith('import ') && !line.includes('QueryClientProvider client=')) {
    imports.push(line);
  } else {
    otherCode += line + '\n';
  }
}

fs.writeFileSync('App.tsx', imports.join('\n') + '\n\n' + otherCode.trim() + '\n');
