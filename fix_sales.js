import fs from 'fs';
const file = '/app/applet/hooks/crm/useCrmSales.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/NexusEventBus\.publish\('SALE_SUBMITTED', \{\s*saleId: newSale\.id,\s*agentId: newSale\.agentId,\s*amount: newSale\.amount,\s*status: newSale\.status,\s*timestamp: newSale\.timestamp\n/g, "NexusEventBus.publish('SALE_SUBMITTED', { saleId: newSale.id, agentId: newSale.agentId, amount: newSale.amount, status: newSale.status, timestamp: newSale.timestamp });\n");
content = content.replace(/NexusEventBus\.publish\('SALE_APPROVED', \{\s*saleId: id,\s*agentId: existingSale\?\.agentId,\s*amount: finalDetails\.amount \|\| existingSale\?\.amount,\s*timestamp: Date\.now\(\)\n\s*\}/g, "NexusEventBus.publish('SALE_APPROVED', { saleId: id, agentId: existingSale?.agentId, amount: finalDetails.amount || existingSale?.amount, timestamp: Date.now() });");

fs.writeFileSync(file, content);
