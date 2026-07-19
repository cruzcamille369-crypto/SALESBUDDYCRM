const fs = require('fs');
const files = [
  'components/admin/system/tabs/PlaybooksTab.tsx',
  'components/admin/system/tabs/SnapshotsTab.tsx',
  'components/admin/system/tabs/CRMConfigTab.tsx',
  'components/admin/system/tabs/HygieneTab.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/text-surface-main/g, 'text-white');
  content = content.replace(/text-surface-alt/g, 'text-white');
  content = content.replace(/from-surface-alt\/50/g, 'from-slate-50');
  content = content.replace(/bg-text-primary/g, 'bg-slate-900');
  content = content.replace(/text-text-primary/g, 'text-slate-900');
  content = content.replace(/bg-accent-primary/g, 'bg-indigo-600');
  content = content.replace(/text-accent-primary/g, 'text-indigo-600');
  content = content.replace(/shadow-accent-primary\/30/g, 'shadow-indigo-600/30');
  content = content.replace(/border-accent-primary\/30/g, 'border-indigo-600/30');
  content = content.replace(/border-accent-primary/g, 'border-indigo-600');
  content = content.replace(/text-text-muted/g, 'text-slate-500');
  fs.writeFileSync(file, content);
});
