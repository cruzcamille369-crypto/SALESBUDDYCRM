const fs = require('fs');

let content = fs.readFileSync('components/admin/system/tabs/SystemTab.tsx', 'utf-8');

// Ensure 'Execute' Emergency Flush uses setToast from useSystem if it's not already
if (!content.includes('const { setToast }')) {
   content = content.replace(
      `const [errorCount, setErrorCount] = useState<number>(0);`,
      `const [errorCount, setErrorCount] = useState<number>(0);\n    const { setToast } = useSystem();`
   );
}
// Not strictly needed since it's just window.location.reload()

fs.writeFileSync('components/admin/system/tabs/SystemTab.tsx', content);
