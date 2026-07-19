import fs from 'fs';
const file = '/app/applet/components/app/MainContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove static imports
content = content.replace("import { AgentPortal } from '../../views/AgentPortal';\n", "");
content = content.replace("import { AdminPortal } from '../../views/AdminPortal';\n", "");

// Add lazy imports
const lazyImports = `
const AgentPortal = React.lazy(() => import('../../views/AgentPortal').then(m => ({ default: m.AgentPortal })));
const AdminPortal = React.lazy(() => import('../../views/AdminPortal').then(m => ({ default: m.AdminPortal })));
`;

content = content.replace("export const MainContent: React.FC = () => {", lazyImports + "\nexport const MainContent: React.FC = () => {");

// Wrap AgentPortal and AdminPortal in React.Suspense
content = content.replace("<AgentPortal />", "<React.Suspense fallback={<div className=\"w-full h-full flex items-center justify-center\"><div className=\"animate-pulse text-indigo-400 font-bold uppercase tracking-widest\">Loading Portal...</div></div>}><AgentPortal /></React.Suspense>");
content = content.replace("<AdminPortal onGhostLogin={handleGhostLogin} />", "<React.Suspense fallback={<div className=\"w-full h-full flex items-center justify-center\"><div className=\"animate-pulse text-indigo-400 font-bold uppercase tracking-widest\">Loading Portal...</div></div>}><AdminPortal onGhostLogin={handleGhostLogin} /></React.Suspense>");

fs.writeFileSync(file, content);
