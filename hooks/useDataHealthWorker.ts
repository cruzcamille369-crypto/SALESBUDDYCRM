import { useEffect, useRef } from 'react';
import { useCRM } from './useCRM';
import { DataHealthReport, DataHealthAction, User } from '../types';
import { nexusGateway } from '../nexus/adapters/DataGateway';

export const useDataHealthWorker = (currentUser: User | null) => {
    const { sales, users, customers, dataHealthReports } = useCRM();
    const hasRun = useRef(false);

    useEffect(() => {
        if (!currentUser || currentUser.level < 10) return;
        
        // Only run once per session to avoid heavy loops, or if we need to run every X time, we'd set an interval.
        if (hasRun.current) return;
        hasRun.current = true;

        const runWorker = async () => {
            const now = Date.now();
            
            // Check if there's already a report generated this week
            const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
            const recentReport = dataHealthReports.find(r => r.timestamp > oneWeekAgo);
            
            if (recentReport) return; // Already generated this week

            console.log("[DataHealthWorker] Starting background scan...");
            
            const actions: DataHealthAction[] = [];

            // 1. Flag inactive users
            users.forEach(user => {
                if (user.active && (!user.lastActive || now - user.lastActive > oneWeekAgo)) {
                    actions.push({
                        id: `action_flag_${user.id}`,
                        type: 'flag_user',
                        targetId: user.id,
                        targetName: user.name,
                        metadata: { lastActive: user.lastActive }
                    });
                }
            });

            // 2. INTELLIGENT MERGE & SAFEGUARDS: Cross-reference logic for uploads vs existing DB
            const processedIds = new Set<string>();
            
            for (let i = 0; i < customers.length; i++) {
                const c1 = customers[i];
                if (processedIds.has(c1.id)) continue;
                
                const c1Email = c1.email ? c1.email.toLowerCase().trim() : '';
                const c1Phone = c1.phone ? c1.phone.replace(/\D/g, '') : '';
                const c1NameRaw = (c1.fullName || (c1.firstName ? `${c1.firstName} ${c1.lastName}` : '') || c1.name || '').toLowerCase();
                const c1NameStr = c1NameRaw.replace(/[^a-z0-9]/g, '');
                
                // Strip Jr, Sr, II, III, Middle Initials for family/generational checks
                const c1BaseName = c1NameRaw.replace(/\b(sr|jr|iii|ii|i)\b\.?/g, '').replace(/\b[a-z]\b\.?/g, '').replace(/[^a-z0-9]/g, '');
                const c1Address = (c1.address || c1.billingAddress || '').toLowerCase().replace(/[^a-z0-9]/g, '');

                if (!c1NameStr || c1NameStr.length < 3) continue;

                for (let j = i + 1; j < customers.length; j++) {
                    const c2 = customers[j];
                    if (processedIds.has(c2.id)) continue;

                    const c2Email = c2.email ? c2.email.toLowerCase().trim() : '';
                    const c2Phone = c2.phone ? c2.phone.replace(/\D/g, '') : '';
                    const c2NameRaw = (c2.fullName || (c2.firstName ? `${c2.firstName} ${c2.lastName}` : '') || c2.name || '').toLowerCase();
                    const c2NameStr = c2NameRaw.replace(/[^a-z0-9]/g, '');
                    
                    const c2BaseName = c2NameRaw.replace(/\b(sr|jr|iii|ii|i)\b\.?/g, '').replace(/\b[a-z]\b\.?/g, '').replace(/[^a-z0-9]/g, '');
                    const c2Address = (c2.address || c2.billingAddress || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    
                    // CRITICAL SAFETY (Generational Protection): Father & Son -> Same base name, different suffix, same address, different phone
                    const isDifferentGeneration = c1NameRaw !== c2NameRaw && c1BaseName === c2BaseName;
                    if (isDifferentGeneration && c1Address && c1Address === c2Address && c1Phone !== c2Phone) {
                        // DO NOT MERGE. These are likely two different individuals (e.g., John Smith Sr vs John Smith Jr)
                        continue; 
                    }

                    // MATCH 1: Same Name & Email, but Different Phone (Often happens on new uploads/updates)
                    if (c1NameStr === c2NameStr && c1Email && c1Email === c2Email && c1Phone !== c2Phone) {
                        actions.push({
                            id: `action_merge_${c2.id}_into_${c1.id}`,
                            type: 'merge_contact',
                            targetId: c2.id,
                            targetName: c2.name || c2.fullName || 'Unknown',
                            metadata: { mergeIntoId: c1.id, reason: 'Matched Name & Email (Updated Phone)', newPhone: c2Phone }
                        });
                        processedIds.add(c2.id);
                        continue;
                    }

                    // MATCH 2: Exact Duplicate (Name + Phone match OR Name + Email match)
                    if (c1NameStr === c2NameStr && ((c1Email && c1Email === c2Email) || (c1Phone && c1Phone === c2Phone))) {
                        actions.push({
                            id: `action_merge_${c2.id}_into_${c1.id}`,
                            type: 'merge_contact',
                            targetId: c2.id,
                            targetName: c2.name || c2.fullName || 'Unknown',
                            metadata: { mergeIntoId: c1.id, reason: 'Exact Match' }
                        });
                        processedIds.add(c2.id);
                        continue;
                    }

                    // MATCH 3: Same Phone, Different Name (Possible recycled number, spouse, or completely different person)
                    if (c1NameStr !== c2NameStr && c1Phone && c1Phone === c2Phone) {
                        actions.push({
                            id: `action_examine_${c2.id}_conflict_${c1.id}`,
                            type: 'examine_conflict',
                            targetId: c2.id,
                            targetName: c2.name || c2.fullName || 'Unknown',
                            metadata: {
                                conflictWithId: c1.id,
                                conflictWithName: c1.name || c1.fullName || 'Unknown',
                                reason: 'Shared Phone Number but Different Names. Manual review required to avoid merging distinct individuals.'
                            }
                        });
                        processedIds.add(c2.id); // We flag it so it gets reviewed, but we DO NOT auto-merge
                        continue;
                    }
                }
            }

            // 3. SAFE ARCHIVE: Only archive non-paying leads (No LTV, no orders) with > 1 year of silence
            const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
            customers.forEach(customer => {
                const isPayingCustomer = (customer.ltv && customer.ltv > 0) || (customer.orderCount && customer.orderCount > 0);
                
                // CRITICAL SAFETY: Never archive someone who has spent money, only cold leads
                if (customer.status !== 'archived' && !isPayingCustomer && customer.lastContact && customer.lastContact < oneYearAgo) {
                    actions.push({
                         id: `action_archive_${customer.id}`,
                         type: 'archive_contact',
                         targetId: customer.id,
                         targetName: customer.name,
                         metadata: { lastContact: customer.lastContact, reason: 'No interaction for > 1 year' }
                    });
                }
            });

            // 4. Enrich data for dead numbers (e.g. disconnected or failed contact attempts)
            customers.forEach(customer => {
                if (customer.status === 'dead' || (!customer.phone && !customer.email)) {
                    actions.push({
                         id: `action_enrich_${customer.id}`,
                         type: 'enrich_contact',
                         targetId: customer.id,
                         targetName: customer.name,
                         metadata: { reason: 'Requires data enrichment / new contact info' }
                    });
                }
            });
            
            if (actions.length > 0) {
                const newReport: DataHealthReport = {
                    id: `report_${now}`,
                    timestamp: now,
                    status: 'pending',
                    actions,
                    approvedActions: []
                };
                
                // Save report
                await nexusGateway.add('dataHealthReports', newReport);
                console.log("[DataHealthWorker] Generated Data Health Report");
            }
        };

        // Delay execution to not block UI thread immediately
        setTimeout(runWorker, 10000); 

    }, [currentUser, users, customers, sales, dataHealthReports]);
};
