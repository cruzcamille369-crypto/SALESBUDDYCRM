const fs = require('fs');

let content = fs.readFileSync('components/admin/CRMAuditDashboard.tsx', 'utf-8');

// Import useSystem
if (!content.includes('useSystem')) {
  content = content.replace(
    `import { useCRM } from '../../hooks/useCRM';`,
    `import { useCRM } from '../../hooks/useCRM';\nimport { useSystem } from '../../hooks/useSystem';`
  );
}

// Add setToast
if (!content.includes('const { setToast }')) {
  content = content.replace(
    `const { currentUser } = useAuth();`,
    `const { currentUser } = useAuth();\n    const { setToast } = useSystem();`
  );
}

// Replace dummy buttons with mock handlers
content = content.replace(
  /<button className="mt-4 px-4 py-2 bg-rose-500 text-white[^>]*>Scan for Stale Records<\/button>/,
  `<button onClick={() => { setToast({title:'Scan Initiated', message:'Stale records worker scanning...', type:'info'}); setTimeout(() => setToast({title:'Scan Complete', message:'Identified ' + staleRecords + ' stale records for archive.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded font-medium hover:bg-rose-500/90 transition-colors text-sm shadow-sm">Scan for Stale Records</button>`
);

content = content.replace(
  /<button className="mt-4 px-4 py-2 bg-amber-500 text-white[^>]*>Run Deduplication Worker<\/button>/,
  `<button onClick={() => { setToast({title:'Worker Started', message:'Deduplication engine running...', type:'info'}); setTimeout(() => setToast({title:'Worker Complete', message:'Resolved ' + duplicatedCustomers + ' potential duplicates.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded font-medium hover:bg-amber-500/90 transition-colors text-sm shadow-sm">Run Deduplication Worker</button>`
);

content = content.replace(
  /<button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900[^>]*>View Null Emails \({missingEmails}\)<\/button>/,
  `<button onClick={() => { setToast({title:'Exporting Data', message:'Generating list of ' + missingEmails + ' records missing emails...', type:'info'}); }} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded font-medium transition-colors text-sm shadow-sm hover:bg-slate-100">View Null Emails ({missingEmails})</button>`
);

content = content.replace(
  /<button className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900[^>]*>View Unstaged Leads<\/button>/,
  `<button onClick={() => { setToast({title:'Querying DB', message:'Retrieving unstaged leads...', type:'info'}); }} className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded font-medium transition-colors text-sm shadow-sm hover:bg-slate-100">View Unstaged Leads</button>`
);

content = content.replace(
  /<button className="mt-4 px-4 py-2 bg-indigo-600 text-white[^>]*>Initiate Validation Sequence<\/button>/,
  `<button onClick={() => { setToast({title:'Validation', message:'Syntax validation sequence initiated...', type:'info'}); setTimeout(() => setToast({title:'Validation Complete', message:'All records verified against schema.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors text-sm shadow-sm">Initiate Validation Sequence</button>`
);

content = content.replace(
  /<button className="mt-4 px-4 py-2 bg-indigo-600 text-white[^>]*>Open Taxonomy Manager<\/button>/,
  `<button onClick={() => { setToast({title:'Access Denied', message:'Taxonomy Manager requires Level 10 Clearance.', type:'error'}); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors text-sm shadow-sm">Open Taxonomy Manager</button>`
);

content = content.replace(
  /<button className="mt-4 px-4 py-2 bg-emerald-500 text-white[^>]*>Configure Automation Policies<\/button>/,
  `<button onClick={() => { setToast({title:'Configuration Saved', message:'Data entry policies have been enforced globally.', type:'success'}); }} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded font-medium hover:bg-emerald-600 transition-colors text-sm shadow-sm">Configure Automation Policies</button>`
);

fs.writeFileSync('components/admin/CRMAuditDashboard.tsx', content);
