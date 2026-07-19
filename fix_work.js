import fs from 'fs';
const file = '/app/applet/hooks/useWorkTimer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/NexusEventBus\.publish\('AFK_DETECTED', \{ agentId: currentUser\?\.id, timestamp: now\n\s*\}\);/g, "NexusEventBus.publish('AFK_DETECTED', { agentId: currentUser?.id, timestamp: now });");

fs.writeFileSync(file, content);
