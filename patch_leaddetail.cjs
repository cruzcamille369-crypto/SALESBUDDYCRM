const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/leads/LeadDetail.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('CustomerDossier')) {
    content = content.replace(
        /import \{ LeadTimeline \} from '\.\/LeadTimeline';/,
        `import { LeadTimeline } from './LeadTimeline';\nimport { CustomerDossier } from '../widgets/customer/CustomerDossier';`
    );
}

// Replace Header with CustomerDossier
const headerRegex = /\{\/\* Header \*\/\}\n\s*<div className="flex items-start justify-between">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>/;
content = content.replace(headerRegex, 
    `{/* Header */}
                    <CustomerDossier 
                        name={activeLead.customerName || 'Prospect'}
                        phone={activeLead.phone || ''}
                        email={activeLead.email}
                        localTime={getPhoneTime(activeLead.phone || '')}
                        tier={activeLead.status}
                        onAction={(action) => {
                            if (action === 'enroll' && onEngage) {
                                onEngage(activeLead);
                            }
                        }}
                    />`
);

fs.writeFileSync(file, content);
console.log('LeadDetail updated');
