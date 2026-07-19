import fs from 'fs';
const files = [
    '/app/applet/context/CRMPerformanceContext.tsx',
    '/app/applet/hooks/crm/useCrmSales.ts',
    '/app/applet/hooks/useWorkTimer.ts'
];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Add static import
    let importPath = "'../../nexus/services/NexusEventBus'";
    if (file.includes('useWorkTimer.ts')) {
        importPath = "'../nexus/services/NexusEventBus'";
    } else if (file.includes('CRMPerformanceContext.tsx')) {
        importPath = "'../nexus/services/NexusEventBus'";
    }
    
    if (!content.includes("import { NexusEventBus } from")) {
        content = content.replace("import", "import { NexusEventBus } from " + importPath + ";\nimport");
    }
    
    // Replace dynamic import
    content = content.replace(/import\([^)]+\)\.then\(\(\{ NexusEventBus \}\) => \{\n\s*NexusEventBus/g, 'NexusEventBus');
    content = content.replace(/\s*\}\);\n\s*\}\)/g, '\n        })');
    content = content.replace(/\s*\}\);\n\s*\}\n/g, '\n        }\n');

    // More generic replacement for closing bracket
    // This regex matches `});` that follows `NexusEventBus.publish(...)` or `NexusEventBus.subscribe(...)`
    // but wait, `sed` is safer. Or just write it back and use sed.
    fs.writeFileSync(file, content);
}
