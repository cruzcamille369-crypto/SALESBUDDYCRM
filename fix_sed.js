import fs from 'fs';
const file = '/app/applet/context/providers/AgentPerformanceProvider.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/        const contextValue = useMemo\(\(\) => \(\{ agentPerformances, getAgentData: \(id: string\) => agentPerformances\[id\] \}\), \[agentPerformances\]\);\n\n    return \(\) => \{/g, '        return () => {');
fs.writeFileSync(file, content);
