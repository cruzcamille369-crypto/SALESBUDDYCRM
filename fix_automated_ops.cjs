const fs = require('fs');

let content = fs.readFileSync('components/admin/CRMAuditDashboard.tsx', 'utf-8');

content = content.replace(
  /<button className="mt-6 px-4 py-2 bg-emerald-500 text-white rounded font-medium hover:bg-emerald-500\/90 transition-colors">[^<]*Enable Automated Operations[^<]*<\/button>/,
  `<button onClick={() => { setToast({title:'Alignment Adjusted', message:'Automated operations triggered to bridge identified gaps.', type:'success'}); }} className="mt-6 px-4 py-2 bg-emerald-500 text-white rounded font-medium hover:bg-emerald-600 shadow-sm transition-colors">Enable Automated Operations</button>`
);

fs.writeFileSync('components/admin/CRMAuditDashboard.tsx', content);
