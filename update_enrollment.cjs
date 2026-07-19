const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/forms/EnrollmentFormV2.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /<button onClick=\{\(\) => \{ handleClear\(\); \}\} className="px-6 py-2\.5 bg-surface-alt border border-border-subtle hover:bg-surface-alt\/50 text-text-secondary hover:text-text-primary rounded-full font-bold transition-all text-sm shadow-sm" title="Clear or Reset Form Data">/,
    '<button onClick={() => { if(window.confirm("Are you sure you want to clear all form data? This cannot be undone.")) handleClear(); }} className="px-6 py-2.5 bg-surface-main border border-border-subtle hover:bg-surface-alt hover:text-rose-500 text-text-muted rounded-full font-bold transition-all text-sm" title="Clear or Reset Form Data">'
);

fs.writeFileSync(file, content);
console.log('EnrollmentFormV2 updated');
