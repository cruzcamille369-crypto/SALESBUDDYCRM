const { execSync } = require('child_process');

// Find files containing accent-primary
const grepCmd = `grep -rl 'accent-primary' components/admin/`;
let files = [];
try {
  files = execSync(grepCmd).toString().trim().split('\n').filter(Boolean);
} catch (e) {
  files = [];
}

const fs = require('fs');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/accent-primary/g, 'indigo-600');
  content = content.replace(/accent-secondary/g, 'blue-500');
  fs.writeFileSync(file, content);
});
