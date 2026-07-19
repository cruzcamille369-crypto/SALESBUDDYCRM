import fs from 'fs';
const file = '/app/applet/components/forms/enrollment/hooks/useEnrollment.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { ChatService } from '../../../../services/ChatService';")) {
    content = content.replace("import { formatUSAPhone", "import { ChatService } from '../../../../services/ChatService';\nimport { formatUSAPhone");
}

content = content.replace(/const \{ ChatService \} = await import\('\.\.\/\.\.\/\.\.\/\.\.\/services\/ChatService'\);\n\s*/g, '');

fs.writeFileSync(file, content);
