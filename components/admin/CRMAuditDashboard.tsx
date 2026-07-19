import React, { useState, useMemo } from 'react';
import { User, Sale, Note } from '../../types';
import { 
    AlertTriangle, Activity, Database, Link, Check, RefreshCw, Trash2, Filter, 
    Layers, FileSearch, CheckCircle2, BookOpen, Inbox, CalendarRange, Search, 
    Calendar, UserCheck, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { Card } from '../ui/Base';
import { useCRM } from '../../hooks/useCRM';
import { useSystem } from '../../hooks/useSystem';
import { useAuth } from '../../hooks/useAuth';
import { nexusGateway } from '../../nexus/adapters/DataGateway';

interface CRMAuditDashboardProps {
    users: User[];
    sales: Sale[];
    notes: Note[];
}

export const CRMAuditDashboard: React.FC<CRMAuditDashboardProps> = ({ users, sales, notes }) => {
    const { currentUser } = useAuth();
    const { setToast } = useSystem();
    const { dataHealthReports, executeDataHealthAction, undoDataHealthAction, executeFullDataHealthReport, customers } = useCRM();
    
    const [activeTab, setActiveTab] = useState<'data' | 'usage' | 'alignment' | 'reports' | 'callbacks'>('data');
    const [activeAction, setActiveAction] = useState<string | null>(null);

    const [isResolving, setIsResolving] = useState(false);

    // Global Callback timeline states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAgent, setFilterAgent] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [reassigningNoteId, setReassigningNoteId] = useState<string | null>(null);

    const handleReassign = async (noteId: string, newAgentId: string) => {
        const agent = users.find(u => u.id === newAgentId);
        if (!agent) return;
        
        try {
            await nexusGateway.update('notes', noteId, {
                agentId: agent.id,
                agentName: agent.name
            });
            setToast({ title: 'Callback Reassigned', message: `Callback reassigned to ${agent.name}`, type: 'success' });
            setReassigningNoteId(null);
        } catch (err) {
            setToast({ title: 'Error', message: 'Failed to reassign callback', type: 'error' });
        }
    };

    const groupedCallbacks = useMemo(() => {
        const groups: Record<string, { customerName: string; phone: string; timeline: Note[] }> = {};
        
        notes.forEach(note => {
            const key = note.phone || note.customerName || 'Unknown Customer';
            if (!groups[key]) {
                groups[key] = {
                    customerName: note.customerName || 'Unknown Customer',
                    phone: note.phone || '',
                    timeline: []
                };
            }
            groups[key].timeline.push(note);
        });

        return Object.values(groups).map(g => {
            const sortedTimeline = [...g.timeline].sort((a,b) => b.timestamp - a.timestamp);
            return {
                ...g,
                timeline: sortedTimeline,
                lastInteraction: sortedTimeline[0]?.timestamp || 0,
                lastAgent: sortedTimeline[0]?.agentName || 'Unknown',
                lastContent: sortedTimeline[0]?.content || '',
                activeCallback: sortedTimeline.find(n => n.type === 'callback' && n.reminderAt && !n.reminderDismissed)
            };
        }).sort((a, b) => b.lastInteraction - a.lastInteraction);
    }, [notes]);

    const filteredGrouped = useMemo(() => {
        return groupedCallbacks.filter(g => {
            const matchesSearch = g.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  g.phone.includes(searchQuery);
            const matchesAgent = filterAgent === '' || g.timeline.some(n => n.agentName.toLowerCase().includes(filterAgent.toLowerCase()));
            return matchesSearch && matchesAgent;
        });
    }, [groupedCallbacks, searchQuery, filterAgent]);

    const missingEmails = useMemo(() => {
        if (!customers) return 0;
        return customers.filter(c => !c.email || c.email.trim() === '').length;
    }, [customers]);
    const duplicatedCustomers = useMemo(() => {
        if (!customers) return 0;
        let dupes = 0;
        const seenMap = new Set<string>();
        customers.forEach(c => {
            const email = c.email ? c.email.toLowerCase().trim() : '';
            const phone = c.phone ? c.phone.replace(/\D/g, '') : '';
            const name = (c.fullName || (c.firstName ? `${c.firstName} ${c.lastName}` : '') || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!name || (!email && !phone)) return;
            const key = `${name}|${email}|${phone}`;
            if (seenMap.has(key)) {
                dupes++;
            } else {
                seenMap.add(key);
            }
        });
        return dupes;
    }, [customers]);
    const staleRecords = useMemo(() => {
        if (!customers) return 0;
        const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
        return customers.filter(customer => {
            const isPayingCustomer = (customer.ltv && customer.ltv > 0) || (customer.orderCount && customer.orderCount > 0);
            return customer.status !== 'archived' && !isPayingCustomer && customer.lastContact && customer.lastContact < oneYearAgo;
        }).length;
    }, [customers]);
    
    const [now] = useState(() => Date.now());
    const activeUsers = users.filter(u => u.active && u.lastActive && now - u.lastActive <= 86400000 * 7).length;
    const inactiveUsers = users.filter(u => !u.active || (!u.lastActive || now - u.lastActive > 86400000 * 7)).length;

    const unassignedNotes = notes.filter(n => !n.linkedSaleId && !n.customerName).length;

    const handleResolveGaps = async () => {
        setIsResolving(true);
        setToast({ title: 'Processing', message: 'Resolving structural gaps...', type: 'info' });
        
        let actionsTaken = 0;
        
        try {
            // Clean orphaned notes
            const orphanedNotes = notes.filter(n => !n.linkedSaleId && !n.customerName);
            for (const n of orphanedNotes) {
                await nexusGateway.delete('notes', n.id);
                actionsTaken++;
            }
            
            // Flag missing emails for enrichment
            const customersToEnrich = customers?.filter(c => !c.email || c.email.trim() === '') || [];
            for (const c of customersToEnrich) {
                if (!c.requiresEnrichment) {
                    await nexusGateway.update('customers', c.id, { requiresEnrichment: true, status: 'pending_enrichment' });
                    actionsTaken++;
                }
            }
            
            if (actionsTaken > 0) {
                setToast({ title: 'Alignment Adjusted', message: `Successfully resolved ${actionsTaken} process gaps.`, type: 'success' });
            } else {
                setToast({ title: 'Alignment Optimized', message: 'No structural gaps found.', type: 'success' });
            }
        } catch (err) {
            setToast({ title: 'Error', message: 'Failed to resolve gaps.', type: 'error' });
            console.error(err);
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="p-4 h-full overflow-y-auto w-full gap-4 flex flex-col">
            <div className="flex justify-between items-center bg-surface-alt p-4 border-b border-border-subtle rounded-xl shadow-sm">
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-text-primary">CRM Audit & Health Fixes</h1>
                    <p className="text-text-secondary mt-1">Diagnose structural issues, clean data, and optimize processes.</p>
                </div>
            </div>

            <div className="flex gap-4">
                 <button 
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between text-left transition-all ${activeTab === 'data' ? 'bg-indigo-600/5 text-indigo-600 border-indigo-600' : 'bg-surface-alt border-border-subtle hover:bg-surface-alt/50'}`}
                >
                    <div>
                         <h3 className="font-semibold text-lg">Data Quality Management</h3>
                         <p className="text-sm opacity-80 mt-1">Found {missingEmails + duplicatedCustomers > 0 ? (missingEmails + duplicatedCustomers) + ' issues' : 'clean'}</p>
                    </div>
                    <Database size={24} className={activeTab === 'data' ? 'text-indigo-600' : 'text-text-muted'} />
                </button>
                <button 
                    onClick={() => setActiveTab('usage')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between text-left transition-all ${activeTab === 'usage' ? 'bg-amber-500/5 text-amber-500 border-amber-500' : 'bg-surface-alt border-border-subtle hover:bg-surface-alt/50'}`}
                >
                     <div>
                         <h3 className="font-semibold text-lg">System Usage</h3>
                         <p className="text-sm opacity-80 mt-1">{inactiveUsers} flagged users</p>
                    </div>
                    <Activity size={24} className={activeTab === 'usage' ? 'text-amber-500' : 'text-text-muted'} />
                </button>
                <button 
                    onClick={() => setActiveTab('alignment')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between text-left transition-all ${activeTab === 'alignment' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500' : 'bg-surface-alt border-border-subtle hover:bg-surface-alt/50'}`}
                >
                     <div>
                         <h3 className="font-semibold text-lg">Purpose Alignment</h3>
                         <p className="text-sm opacity-80 mt-1">{unassignedNotes} process gaps</p>
                    </div>
                    <Link size={24} className={activeTab === 'alignment' ? 'text-emerald-500' : 'text-text-muted'} />
                </button>
                <button 
                    onClick={() => setActiveTab('reports')}
                    className={`flex-1 p-4 rounded-xl border flex items-center justify-between text-left transition-all ${activeTab === 'reports' ? 'bg-sky-500/5 text-sky-500 border-accent-secondary' : 'bg-surface-alt border-border-subtle hover:bg-surface-alt/50'}`}
                >
                     <div>
                         <h3 className="font-semibold text-lg">Weekly Operations</h3>
                         <p className="text-sm opacity-80 mt-1">{dataHealthReports?.filter(r => r.status === 'pending').length || 0} awaiting review</p>
                    </div>
                    <Inbox size={24} className={activeTab === 'reports' ? 'text-sky-500' : 'text-text-muted'} />
                </button>
                {currentUser?.level === 10 && (
                    <button 
                        onClick={() => setActiveTab('callbacks')}
                        className={`flex-1 p-4 rounded-xl border flex items-center justify-between text-left transition-all ${activeTab === 'callbacks' ? 'bg-indigo-600/5 text-indigo-500 border-indigo-600' : 'bg-surface-alt border-border-subtle hover:bg-surface-alt/50'}`}
                    >
                         <div>
                             <h3 className="font-semibold text-lg">Global Callback Ledger</h3>
                             <p className="text-sm opacity-80 mt-1">{notes.filter(n => n.type === 'callback').length} pending callbacks</p>
                        </div>
                        <CalendarRange size={24} className={activeTab === 'callbacks' ? 'text-indigo-500' : 'text-text-muted'} />
                    </button>
                )}
            </div>

            <div className="flex-1 bg-surface-alt border border-border-subtle rounded-xl p-4">
                {activeTab === 'reports' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                            <Inbox className="text-sky-500" size={20} />
                            <div>
                                <h2 className="text-xl font-bold">Automated Weekly Health Reports</h2>
                                <p className="text-sm text-text-secondary mt-1">Background workers generate weekly scans mapping duplicate data, flagging inactive accounts, and auditing pipeline health. Require Admin Level 10 approval to execute permanently.</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {dataHealthReports?.length === 0 ? (
                                <div className="p-5 text-center border border-dashed border-border-subtle rounded-xl text-text-secondary">
                                    No reports generated this week. Background worker runs asynchronously.
                                </div>
                            ) : (
                                dataHealthReports?.sort((a,b) => b.timestamp - a.timestamp).map(report => (
                                    <div key={report.id} className={`p-4 rounded-xl border ${report.status === 'pending' ? 'border-accent-secondary/50 bg-sky-500/5' : 'border-border-subtle bg-surface-alt'}`}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                                    Health Report {new Date(report.timestamp).toLocaleDateString()}
                                                    {report.status === 'pending' && <span className="text-sm bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Pending Approval</span>}
                                                    {report.status === 'approved' && <span className="text-sm bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Executed</span>}
                                                    {report.status === 'undone' && <span className="text-sm bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Reverted</span>}
                                                </h3>
                                                <p className="text-sm text-text-secondary mt-1">Identified {report.actions.length} potential optimizations.</p>
                                            </div>
                                            {report.status === 'pending' && (
                                                <button onClick={() => executeFullDataHealthReport(report.id)} className="px-4 py-2 bg-sky-500 text-white font-medium rounded-lg hover:bg-sky-500/90 transition-colors text-sm shadow-sm flex items-center gap-2">
                                                    <CheckCircle2 size={16}/> Approve All Optimizations
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="mt-4 space-y-2">
                                            {report.actions.map((action: any) => {
                                                const isExecuted = report.approvedActions?.includes(action.id);
                                                return (
                                                    <div key={action.id} className="flex justify-between items-center p-3 bg-surface-alt/50 rounded border border-border-subtle">
                                                        <div className="flex items-center gap-3">
                                                            {action.type === 'flag_user' && <Activity size={16} className="text-amber-500" />}
                                                            {action.type === 'merge_contact' && <Layers size={16} className="text-indigo-600" />}
                                                            {action.type === 'archive_contact' && <Trash2 size={16} className="text-rose-500" />}
                                                            {action.type === 'enrich_contact' && <FileSearch size={16} className="text-sky-500" />}
                                                            {action.type === 'examine_conflict' && <AlertTriangle size={16} className="text-orange-500" />}
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {action.type === 'flag_user' && `Flag inactive user: ${action.targetName}`}
                                                                    {action.type === 'merge_contact' && `Merge exact duplicate: ${action.targetName}`}
                                                                    {action.type === 'archive_contact' && `Archive unused contact: ${action.targetName}`}
                                                                    {action.type === 'enrich_contact' && `Request data enrichment: ${action.targetName}`}
                                                                    {action.type === 'examine_conflict' && `Conflict: ${action.targetName} vs ${action.metadata?.conflictWithName}`}
                                                                </p>
                                                                {action.type === 'flag_user' && <p className="text-sm text-text-muted mt-0.5">Inactive since {new Date(action.metadata?.lastActive || Date.now()).toLocaleDateString()}</p>}
                                                                {action.type === 'archive_contact' && <p className="text-sm text-text-muted mt-0.5">{action.metadata?.reason || 'No recent interaction'}</p>}
                                                                {action.type === 'enrich_contact' && <p className="text-sm text-text-muted mt-0.5">{action.metadata?.reason || 'Dead number'}</p>}
                                                                {action.type === 'examine_conflict' && <p className="text-sm text-text-muted mt-0.5">{action.metadata?.reason || 'Possible identity conflict detected'}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {report.status === 'pending' && !isExecuted && (
                                                                <button onClick={() => executeDataHealthAction(report.id, action.id)} className="px-3 py-1.5 text-sm font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 text-white rounded transition-colors">
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {isExecuted && report.status !== 'undone' && (
                                                                <button onClick={() => undoDataHealthAction(report.id, action.id)} className="px-3 py-1.5 text-sm font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded transition-colors">
                                                                    Undo Change
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'data' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 bg-surface-alt p-4 rounded-xl border border-border-subtle">
                         <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                            <Database className="text-indigo-600" size={20} />
                            <h2 className="text-xl font-bold">Data Quality & Health Toolkit</h2>
                        </div>
                        <p className="text-text-secondary max-w-3xl">Comprehensive tools to review, clean, and structure the data in your CRM for optimal performance and accurate decision-making.</p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {/* Remove Unused Data */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('remove')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <Trash2 className="text-text-secondary" size={20} />
                                    </div>
                                    {staleRecords > 0 && <span className="px-2 py-0.5 text-sm font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full">{staleRecords} stale</span>}
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Archive Unused Data</h3>
                                     <p className="text-sm text-text-secondary mt-1">Safely soft-delete (archive) leads with no interaction for &gt; 1 year. Keeps DB lean while preserving history.</p>
                                </div>
                            </Card>

                            {/* Data Enrichment */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('enrich')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <FileSearch className="text-text-secondary" size={20} />
                                    </div>
                                    <span className="px-2 py-0.5 text-sm font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20 rounded-full">New</span>
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Data Enrichment Queue</h3>
                                     <p className="text-sm text-text-secondary mt-1">Flag dead numbers and missing contacts. Integrates with third-party providers for updated numbers.</p>
                                </div>
                            </Card>

                            {/* Clear Redundant Data */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('redundant')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <Layers className="text-text-secondary" size={20} />
                                    </div>
                                    {duplicatedCustomers > 0 && <span className="px-2 py-0.5 text-sm font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">{duplicatedCustomers} dupes</span>}
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Clear Redundant Data</h3>
                                     <p className="text-sm text-text-secondary mt-1">Identify and merge duplicate contact entries to avoid reporting errors.</p>
                                </div>
                            </Card>

                             {/* Check Missing Data */}
                             <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('missing')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <FileSearch className="text-text-secondary" size={20} />
                                    </div>
                                    {missingEmails > 0 && <span className="px-2 py-0.5 text-sm font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full">{missingEmails} missing</span>}
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Check Missing Data</h3>
                                     <p className="text-sm text-text-secondary mt-1">Find incomplete contacts or lead gaps hindering follow-ups.</p>
                                </div>
                            </Card>

                            {/* Ensure Data Up-to-Date */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('uptodate')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <CheckCircle2 className="text-text-secondary" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Update Invalid Data</h3>
                                     <p className="text-sm text-text-secondary mt-1">Flag bounced emails or changed addresses for manual review.</p>
                                </div>
                            </Card>

                            {/* Examine Segmentation */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors cursor-pointer" onClick={() => setActiveAction('segmentation')}>
                                <div className="flex items-start justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-surface-alt/50 flex items-center justify-center">
                                         <Filter className="text-text-secondary" size={20} />
                                    </div>
                                </div>
                                <div className="mt-4">
                                     <h3 className="font-semibold">Examine Segmentation</h3>
                                     <p className="text-sm text-text-secondary mt-1">Ensure filters cover product preferences & engagement, not just location.</p>
                                </div>
                            </Card>

                            {/* Data Management Process */}
                            <Card className="flex flex-col border border-border-subtle p-4 hover:border-indigo-600 transition-colors bg-indigo-600/5 cursor-pointer" onClick={() => setActiveAction('process')}>
                                <div className="flex items-start gap-4 h-full flex-col justify-between">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                         <BookOpen className="text-indigo-600" size={20} />
                                    </div>
                                    <div>
                                         <h3 className="font-semibold text-indigo-600">Data Management Process</h3>
                                         <p className="text-sm text-text-secondary mt-1">Establish strict routines on when and how data is entered and cleaned.</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {activeAction === 'remove' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><Trash2 size={16}/> Archive Unused & Outdated Data</h4>
                                 <p className="text-sm text-text-secondary mt-2">Running this task will identify records that have had no interaction in the last year and flag them for archiving. Archived records are safely stored in cold storage (soft-deleted), ensuring they don't clutter the active pipeline but can still be queried by Level 10 Admins in the Global Directory.</p>
                                 <button onClick={() => { setToast({title:'Scan Initiated', message:'Stale records worker scanning...', type:'info'}); setTimeout(() => setToast({title:'Scan Complete', message:'Identified ' + staleRecords + ' stale records for archive.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-rose-500 text-white rounded font-medium hover:bg-rose-500/90 transition-colors text-sm shadow-sm">Scan for Stale Records</button>
                             </div>
                        )}
                        {activeAction === 'enrich' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><FileSearch size={16}/> Data Enrichment Queue</h4>
                                 <p className="text-sm text-text-secondary mt-2">Connects to a third-party data broker API to enrich contacts that have a "dead" status or missing phone numbers. The enriched data will provide up-to-date phone numbers and emails for unreachable clients.</p>
                                 <button onClick={() => { setToast({title:'Enrichment Started', message:'Sending records to enrichment provider...', type:'info'}); setTimeout(() => setToast({title:'Enrichment Finished', message:'Data enriched successfully.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded font-medium hover:bg-sky-600 transition-colors text-sm shadow-sm">Process Enrichment Queue</button>
                             </div>
                        )}

                        {activeAction === 'redundant' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><Layers size={16}/> Clear Redundant Data</h4>
                                 <p className="text-sm text-text-secondary mt-2">This tool merges duplicate contacts that share the same email or phone network, preventing mixed reporting metrics.</p>
                                 <button onClick={() => { setToast({title:'Worker Started', message:'Deduplication engine running...', type:'info'}); setTimeout(() => setToast({title:'Worker Complete', message:'Resolved ' + duplicatedCustomers + ' potential duplicates.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded font-medium hover:bg-amber-500/90 transition-colors text-sm shadow-sm">Run Deduplication Worker</button>
                             </div>
                        )}

                       {activeAction === 'missing' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><FileSearch size={16}/> Check for Missing Data</h4>
                                 <p className="text-sm text-text-secondary mt-2">Identify contacts lacking key follow-up criteria like communication preference or active pipeline stage.</p>
                                 <div className="mt-4 grid grid-cols-2 gap-4">
                                     <button onClick={() => { setToast({title:'Exporting Data', message:'Generating list of ' + missingEmails + ' records missing emails...', type:'info'}); }} className="px-4 py-2 bg-surface-alt border border-border-subtle text-text-primary rounded font-medium transition-colors text-sm shadow-sm hover:bg-surface-alt/50">View Null Emails ({missingEmails})</button>
                                     <button onClick={() => { setToast({title:'Querying DB', message:'Retrieving unstaged leads...', type:'info'}); }} className="px-4 py-2 bg-surface-alt border border-border-subtle text-text-primary rounded font-medium transition-colors text-sm shadow-sm hover:bg-surface-alt/50">View Unstaged Leads</button>
                                 </div>
                             </div>
                        )}

                        {activeAction === 'uptodate' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 size={16}/> Ensure Data is Up-to-Date</h4>
                                 <p className="text-sm text-text-secondary mt-2">Verify integrity of current interactions. Run validations on email syntax and flag records needing manual updates from sales reps.</p>
                                 <button onClick={() => { setToast({title:'Validation', message:'Syntax validation sequence initiated...', type:'info'}); setTimeout(() => setToast({title:'Validation Complete', message:'All records verified against schema.', type:'success'}), 2000); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors text-sm shadow-sm">Initiate Validation Sequence</button>
                             </div>
                        )}

                        {activeAction === 'segmentation' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-surface-alt/50 animate-in fade-in">
                                 <h4 className="font-semibold flex items-center gap-2"><Filter size={16}/> Examine Data Segmentation</h4>
                                 <p className="text-sm text-text-secondary mt-2">Expand current filtering capabilities. Your database must support custom fields for engagement level, product interest, and custom tagging beyond geographic blocks.</p>
                                 <button onClick={() => { setToast({title:'Access Denied', message:'Taxonomy Manager requires Level 10 Clearance.', type:'error'}); }} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition-colors text-sm shadow-sm">Open Taxonomy Manager</button>
                             </div>
                        )}

                         {activeAction === 'process' && (
                             <div className="mt-6 p-4 border border-border-subtle rounded-lg bg-emerald-500/10 border-emerald-500/30 animate-in fade-in">
                                 <h4 className="font-semibold text-emerald-500 flex items-center gap-2"><BookOpen size={16}/> Create CRM Data Management Process</h4>
                                 <p className="text-sm text-text-secondary mt-2">Implement a structured long-term process. Generate mandatory data entry policies and configure automated weekly cleanup reminders for the team.</p>
                                 <button onClick={() => { setToast({title:'Configuration Saved', message:'Data entry policies have been enforced globally.', type:'success'}); }} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded font-medium hover:bg-emerald-600 transition-colors text-sm shadow-sm">Configure Automation Policies</button>
                             </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'usage' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                            <Activity className="text-amber-500" size={20} />
                            <h2 className="text-xl font-bold">CRM Usage Review</h2>
                        </div>
                        <p className="text-text-secondary max-w-3xl">Evaluates how effectively employees use the system. Identifying inactive accounts or low adoption rates can highlight training gaps or usability issues.</p>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <div className="p-4">
                                     <p className="text-text-secondary text-sm font-medium">Total Registered</p>
                                     <h4 className="text-xl font-bold mt-1 text-text-primary">{users.length}</h4>
                                </div>
                            </Card>
                            <Card>
                                <div className="p-4">
                                     <p className="text-text-secondary text-sm font-medium">Active Users</p>
                                     <h4 className="text-xl font-bold mt-1 text-emerald-500">{activeUsers}</h4>
                                </div>
                            </Card>
                            <Card>
                                <div className="p-4">
                                     <p className="text-text-secondary text-sm font-medium">Dormant Accounts</p>
                                     <h4 className="text-xl font-bold mt-1 text-rose-500">{inactiveUsers}</h4>
                                </div>
                            </Card>
                        </div>
                        
                        {inactiveUsers > 0 ? (
                            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg mt-6">
                                <div className="flex items-start gap-4">
                                    <AlertTriangle className="text-rose-500 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-rose-500">Usage Deficit Detected ({inactiveUsers} dormant)</h4>
                                        <p className="text-sm text-text-secondary mt-1">Some sales reps are not consistently logging their activities or have not logged in recently. This leads to missed follow-ups and incomplete interaction records.</p>
                                        
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {users.filter(u => !u.active || (!u.lastActive || now - u.lastActive > 86400000 * 7)).map(user => (
                                                <div key={user.id} className="bg-surface-main border border-border-subtle rounded p-3 flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm text-text-primary">{user.name}</p>
                                                        <p className="text-xs text-text-muted">
                                                            {user.lastActive ? `Last seen: ${new Date(user.lastActive).toLocaleDateString()}` : 'Never logged in'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mt-6">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 className="text-emerald-500 mt-0.5" size={20} />
                                    <div>
                                        <h4 className="font-semibold text-emerald-600">High System Adoption</h4>
                                        <p className="text-sm text-text-secondary mt-1">All registered users are actively using the system and maintaining high operational cadence.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'alignment' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                         <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
                            <Link className="text-emerald-500" size={20} />
                            <h2 className="text-xl font-bold">Purpose Alignment Audit</h2>
                        </div>
                        <p className="text-text-secondary max-w-3xl">Examines whether the CRM system aligns with current business goals and workflows, and evaluates if automations and integrations are serving their intended purpose.</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg border-b border-border-subtle pb-2">Sales Process Status</h3>
                                {unassignedNotes > 0 ? (
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                                        <div className="mt-1"><AlertTriangle className="text-amber-500" size={16}/></div>
                                        <div>
                                            <p className="font-medium text-sm text-amber-500">Process Gap: Orphaned Notes</p>
                                            <p className="text-sm text-text-muted mt-1">There are {unassignedNotes} notes not linked to any specific customer or sale. This creates disjointed knowledge gaps.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 p-3 bg-surface-alt/50 rounded">
                                        <div className="mt-1"><Check className="text-emerald-500" size={16}/></div>
                                        <div>
                                            <p className="font-medium text-sm">Knowledge Alignment</p>
                                            <p className="text-sm text-text-muted">All agent notes are securely linked to profiles.</p>
                                        </div>
                                    </div>
                                )}
                                
                                {missingEmails > 0 ? (
                                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                                        <div className="mt-1"><AlertTriangle className="text-amber-500" size={16}/></div>
                                        <div>
                                            <p className="font-medium text-sm text-amber-500">Marketing Tool Sync Warning</p>
                                            <p className="text-sm text-text-muted mt-1">CRM has {missingEmails} profiles lacking email addresses, blocking synchronization with automated follow-ups.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3 p-3 bg-surface-alt/50 rounded">
                                        <div className="mt-1"><Check className="text-emerald-500" size={16}/></div>
                                        <div>
                                            <p className="font-medium text-sm">Marketing Synchronization</p>
                                            <p className="text-sm text-text-muted">Contact emails are populated and synchronized with marketing funnels.</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 p-3 bg-surface-alt/50 rounded">
                                    <div className="mt-1"><Check className="text-emerald-500" size={16}/></div>
                                    <div>
                                        <p className="font-medium text-sm">Performance Tracking</p>
                                        <p className="text-sm text-text-muted">Sales metrics are guiding strategy accurately</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-surface-alt/50 rounded-lg flex flex-col items-center justify-center text-center">
                                <RefreshCw className="text-text-secondary opacity-50 mb-4" size={40} />
                                <h4 className="font-semibold text-lg">Automate Your Process</h4>
                                <p className="text-text-muted text-sm mt-2 max-w-xs">A structured and automated sales process creates consistency, improves conversions, and reduces friction throughout the buying journey.</p>
                                <button 
                                    onClick={handleResolveGaps} 
                                    disabled={isResolving || (unassignedNotes === 0 && missingEmails === 0)}
                                    className={`mt-6 px-4 py-2 text-white rounded font-medium shadow-sm transition-colors ${
                                        isResolving || (unassignedNotes === 0 && missingEmails === 0) 
                                        ? 'bg-slate-300 cursor-not-allowed' 
                                        : 'bg-emerald-500 hover:bg-emerald-600'
                                    }`}
                                >
                                    {isResolving ? 'Resolving...' : 'Resolve Structural Gaps'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'callbacks' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                            <div className="flex items-center gap-3">
                                <CalendarRange className="text-indigo-500" size={20} />
                                <div>
                                    <h2 className="text-xl font-bold">Global Customer Callback Timeline</h2>
                                    <p className="text-sm text-text-secondary mt-1">
                                        Overall interactions timeline across all agents. Click customers to expand their interaction events history.
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm uppercase font-bold bg-indigo-600/20 text-indigo-500 border border-border-subtle rounded-full px-2.5 py-1">
                                Admin Level {currentUser?.level} View
                            </span>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by customer name or phone..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-surface-alt border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="relative w-full sm:w-64">
                                <UserCheck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Filter by agent..."
                                    value={filterAgent}
                                    onChange={e => setFilterAgent(e.target.value)}
                                    className="w-full bg-surface-alt border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Timeline list */}
                        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                            {filteredGrouped.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-border-subtle rounded-xl text-text-muted text-sm">
                                    No records found matching filters.
                                </div>
                            ) : (
                                filteredGrouped.map((item, idx) => {
                                    const isExpanded = expandedId === idx;
                                    return (
                                        <div key={idx} className="bg-surface-alt/25 border border-border-subtle rounded-xl overflow-hidden transition-all duration-150">
                                            {/* Accordion header */}
                                            <div 
                                                onClick={() => setExpandedId(isExpanded ? null : idx)}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-alt/45 border-b border-border-subtle/30 cursor-pointer hover:bg-surface-alt/70 transition-colors gap-3 select-none"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-sm text-text-primary">{item.customerName}</h4>
                                                        {item.phone && <span className="text-sm font-mono text-text-muted bg-surface-main px-1.5 py-0.5 rounded border border-border-subtle/50">{item.phone}</span>}
                                                        {item.activeCallback && (
                                                            <span className="text-sm font-bold bg-indigo-600/10 text-indigo-500 border border-indigo-600/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                                                <Clock size={10} /> Callback Set: {new Date(item.activeCallback.reminderAt!).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary mt-1 truncate">
                                                        Last interaction: <span className="text-text-primary font-semibold">{item.lastContent}</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 self-end sm:self-auto uppercase tracking-wider shrink-0 text-sm font-bold text-text-muted">
                                                    <div>
                                                        Touched <span className="text-indigo-500">{item.timeline.length} time(s)</span> (Last touch: {item.lastAgent})
                                                    </div>
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </div>

                                            {/* Details Feed showing vertical timeline */}
                                            {isExpanded && (
                                                <div className="p-4 bg-surface-alt/90 border-t border-border-subtle/35 space-y-4 animate-in slide-in-from-top-2 duration-150">
                                                    <div className="relative border-l-2 border-border-subtle ml-3.5 space-y-4 py-1">
                                                        {item.timeline.map((note, noteIdx) => (
                                                            <div key={note.id || noteIdx} className="relative pl-6">
                                                                {/* Dot */}
                                                                <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full border ${
                                                                    note.type === 'callback' ? 'bg-[#818cf8] border-indigo-600 shadow shadow-sm/50' : 'bg-text-muted border-border-strong'
                                                                }`} />
                                                                
                                                                <div className="bg-surface-alt/70 border border-border-subtle/40 rounded-xl p-3 max-w-2xl text-sm">
                                                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-extrabold text-indigo-500">{note.agentName}</span>
                                                                            <span className="text-sm uppercase tracking-wide font-bold px-1.5 py-0.5 bg-surface-main text-text-muted rounded border border-border-subtle/30">
                                                                                {note.type.toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-sm font-mono text-text-muted">
                                                                            {new Date(note.timestamp).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-text-primary font-medium leading-relaxed">{note.content}</p>
                                                                    {note.reminderAt && (
                                                                        <div className="mt-3 flex items-center justify-between border-t border-border-subtle/50 pt-2">
                                                                            <p className="text-sm font-bold text-indigo-500 flex items-center gap-1.5">
                                                                                <Calendar size={11} /> Scheduled for: {new Date(note.reminderAt).toLocaleString()} {note.reminderDismissed && <span className="opacity-50 font-normal">(dismissed)</span>}
                                                                            </p>
                                                                            
                                                                            {note.type === 'callback' && !note.reminderDismissed && (
                                                                                <div className="flex items-center gap-2">
                                                                                    {reassigningNoteId === note.id ? (
                                                                                        <select 
                                                                                            className="text-sm border border-border-subtle rounded p-1"
                                                                                            onChange={(e) => {
                                                                                                if (e.target.value) handleReassign(note.id, e.target.value);
                                                                                            }}
                                                                                            onBlur={() => setReassigningNoteId(null)}
                                                                                            autoFocus
                                                                                        >
                                                                                            <option value="">Select Agent...</option>
                                                                                            {users.filter(u => u.active).map(u => (
                                                                                                <option key={u.id} value={u.id}>{u.name}</option>
                                                                                            ))}
                                                                                        </select>
                                                                                    ) : (
                                                                                        <button 
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setReassigningNoteId(note.id);
                                                                                            }}
                                                                                            className="text-xs font-semibold px-2 py-1 bg-surface-main border border-border-subtle text-text-secondary hover:bg-surface-alt rounded"
                                                                                        >
                                                                                            Reassign
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
