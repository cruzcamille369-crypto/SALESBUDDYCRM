const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regexMem = /if \(tenantIsolatedCollections\.includes\(collectionName\)\) \{\s*rows = rows\.filter\(d => d\.serverId === tenantId \|\| d\.tenantId === tenantId\);\s*\}/;

const replMem = `const isImpersonating = req.headers['x-impersonate-tenant'] === 'true';
              const shouldFilterByTenant = tenantIsolatedCollections.includes(collectionName) && (userLevel < 10 || isImpersonating);
              if (shouldFilterByTenant) {
                  rows = rows.filter(d => d.serverId === tenantId || d.tenantId === tenantId);
              }`;

code = code.replace(regexMem, replMem);

const regexDb = /if \(tenantIsolatedCollections\.includes\(collectionName\)\) \{\s*conditions\.push\(sql\`\(\$\{schema\.crmDocuments\.data\}->>'serverId' = \$\{tenantId\} OR \$\{schema\.crmDocuments\.data\}->>'tenantId' = \$\{tenantId\}\)\`\);\s*\}/;

const replDb = `const isImpersonatingDb = req.headers['x-impersonate-tenant'] === 'true';
              const shouldFilterByTenantDb = tenantIsolatedCollections.includes(collectionName) && (userLevel < 10 || isImpersonatingDb);
              if (shouldFilterByTenantDb) {
                  conditions.push(sql\`(\${schema.crmDocuments.data}->>'serverId' = \${tenantId} OR \${schema.crmDocuments.data}->>'tenantId' = \${tenantId})\`);
              }`;

code = code.replace(regexDb, replDb);
fs.writeFileSync('server.ts', code);
