import fs from 'fs';
const file = '/app/applet/context/CRMPerformanceContext.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/NexusEventBus\.publish\('SHIFT_STARTED', \{ agentId: currentUser\.id, timestamp: now\n\s*\}\);/g, "NexusEventBus.publish('SHIFT_STARTED', { agentId: currentUser.id, timestamp: now });");

fs.writeFileSync(file, content);
