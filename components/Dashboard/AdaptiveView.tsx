import React, { useState, useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { useTodayStats } from '../../hooks/useTodayStats';
import { useAuth } from '../../hooks/useAuth';
import { 
    Activity, CircleDashed, CheckCircle2, Search, ArrowUpRight, 
    TrendingUp, DollarSign, Clock, Phone, AlertCircle, Award, Target, Flag
} from 'lucide-react';
import { CustomerProfileModal } from '../modals/CustomerProfileModal';
import { sfx } from '../../lib/soundService';
import { Sale } from '../../types';

export const AdaptiveView: React.FC = () => {
    const _stats = useTodayStats();
    const { sales, notes, customers, systemConfig, attendance, incentiveSettings, updateSale, logAudit } = useCRM();
    const { currentUser } = useAuth();

    // CRM Configuration
    const baseRate = systemConfig?.baseCommission || 15;

    // Search & History lookup state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Dispute state variables
    const [disputeSale, setDisputeSale] = useState<Sale | null>(null);
    const [disputeReason, setDisputeReason] = useState('');
    const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

    // Current Active Cutoff boundaries and goals (Agent Incentive Feed)
    const activeIncentiveFeed = useMemo(() => {
        if (!systemConfig) return null;
        
        // 1. Resolve cutoff boundaries
        const boundaries = {
            cycle1Start: new Date(new Date().getFullYear(), new Date().getMonth(), 1, 0,0,0,0).getTime(),
            cycle1End: new Date(new Date().getFullYear(), new Date().getMonth(), systemConfig.cutoffDay1 || 15, 23,59,59,999).getTime(),
            cycle2Start: new Date(new Date().getFullYear(), new Date().getMonth(), (systemConfig.cutoffDay1 || 15) + 1, 0,0,0,0).getTime(),
            cycle2End: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23,59,59,999).getTime(),
        };

        const nowTime = Date.now();
        const currentCutoff = nowTime <= boundaries.cycle1End 
            ? { start: boundaries.cycle1Start, end: boundaries.cycle1End, label: "Cycle 1" }
            : { start: boundaries.cycle2Start, end: boundaries.cycle2End, label: "Cycle 2" };

        // 2. Sum up logged hours in current cutoff
        const myAttendance = (attendance || []).filter(a => 
            a.agentId === currentUser?.id && 
            a.timestamp >= currentCutoff.start && 
            a.timestamp <= currentCutoff.end
        );

        const loggedSeconds = myAttendance
            .filter(a => a.type === 'CLOCK_OUT')
            .reduce((sum, a) => sum + (Number(a.duration) || 0), 0);
        
        const loggedHours = Math.round((loggedSeconds / 3600) * 10) / 10;
        const cutoffGoal = incentiveSettings?.requiredHoursForCutoff !== undefined 
            ? Number(incentiveSettings.requiredHoursForCutoff) 
            : 80;

        // 3. Sum up sales volume in current cutoff
        const myCutoffSales = (sales || []).filter(s => 
            s.agentId === currentUser?.id &&
            s.status === 'Approved' &&
            s.timestamp >= currentCutoff.start &&
            s.timestamp <= currentCutoff.end
        );
        const currentSalesVolume = myCutoffSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);

        // 4. Determine next spiff tiering target
        const tiers = incentiveSettings?.spiffTiering 
            ? [...incentiveSettings.spiffTiering].sort((a,b) => a.minAmount - b.minAmount)
            : [];
        const nextTier = tiers.find(t => t.minAmount > currentSalesVolume);

        return {
            label: currentCutoff.label,
            loggedHours,
            cutoffGoal,
            hoursProgress: Math.min(100, Math.round((loggedHours / (cutoffGoal || 1)) * 100)),
            currentSalesVolume,
            nextTierGoal: nextTier ? nextTier.minAmount : null,
            nextTierBonus: nextTier ? nextTier.bonusAmount : null,
            volumeProgress: nextTier 
                ? Math.min(100, Math.round((currentSalesVolume / nextTier.minAmount) * 100))
                : 100,
            hasPassedTiers: !nextTier && tiers.length > 0,
            maxTierBonus: tiers.length > 0 ? tiers[tiers.length - 1].bonusAmount : 0
        };
    }, [systemConfig, incentiveSettings, attendance, sales, currentUser]);

    // Dispute submit handler
    const handleFileDispute = async () => {
        if (!disputeSale || !disputeReason.trim()) return;
        setIsSubmittingDispute(true);
        try {
            await updateSale(disputeSale.id, {
                isDisputed: true,
                disputeReason: disputeReason,
                disputeStatus: 'Pending'
            });
            await logAudit({
                action: 'PAYROLL_DISPUTE_FILED',
                details: `Agent filed dispute on Sale ID ${disputeSale.id}: "${disputeReason}"`,
                module: 'FINANCIALS'
            });
            setDisputeSale(null);
            setDisputeReason('');
            sfx.playConfirm();
        } catch (err) {
            console.error("Failed to file dispute:", err);
        } finally {
            setIsSubmittingDispute(false);
        }
    };

    // Filtered customer profiles
    const filteredSearchCustomers = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const query = searchTerm.toLowerCase();
        
        return customers.filter(c => {
            const matchesQuery = 
                (c.name || '').toLowerCase().includes(query) ||
                (c.phone || '').includes(query) ||
                (c.email || '').toLowerCase().includes(query);

            if (!matchesQuery) return false;

            // Restrict background ViciDial leads from agent view
            if (c.isBackgroundViciLead) {
                const hasSale = sales?.some(s => s.customerPhone === c.phone && s.agentId === currentUser?.id);
                const hasNote = notes?.some(n => n.customerPhone === c.phone && n.agentId === currentUser?.id);
                return hasSale || hasNote;
            }

            return true;
        }).slice(0, 5);
    }, [customers, sales, notes, currentUser, searchTerm]);

    // Gather Agent Specific Sales
    const mySales = useMemo(() => {
        return sales.filter(s => s.agentId === currentUser?.id);
    }, [sales, currentUser]);

    // Active Pending Callbacks for quick priority highlights
    const pendingCallbacks = useMemo(() => {
        return notes
            .filter(n => n.agentId === currentUser?.id && n.reason?.includes('Callback') && n.priority === 'High')
            .slice(0, 3);
    }, [notes, currentUser]);

    // Automatic real-time commission metrics
    const totalCommissionsEarned = useMemo(() => {
        return mySales
            .filter(s => s.status === 'Approved')
            .reduce((sum, s) => sum + (s.amount * (baseRate / 100)), 0);
    }, [mySales, baseRate]);

    const estimatedPendingCommissions = useMemo(() => {
        return mySales
            .filter(s => s.status === 'Pending')
            .reduce((sum, s) => sum + (s.amount * (baseRate / 100)), 0);
    }, [mySales, baseRate]);

    // Create a feeds list combining agent stats and activities
    const activities = useMemo(() => {
        const list = [
            ...mySales.map(s => ({ 
                type: 'sale', 
                title: `Submitted Order for ${s.customer}`, 
                status: s.status,
                detail: `${s.product} - $${s.amount.toLocaleString()} (Est. Payout: $${(s.amount * (baseRate / 100)).toFixed(2)})`,
                time: s.timestamp, 
                icon: CheckCircle2, 
                color: s.status === 'Approved' ? 'text-emerald-500' : s.status === 'Declined' ? 'text-rose-500' : 'text-neutral-400' 
            })),
            ...notes.filter(n => n.agentId === currentUser?.id).map(n => ({ 
                type: 'note', 
                title: `Logged Note: ${n.reason || 'Lead Diary'}`, 
                status: 'General',
                detail: `Regarding ${n.customerName || 'Customer'}: "${n.content?.substring(0, 60)}${n.content && n.content.length > 60 ? '...' : ''}"`,
                time: n.timestamp, 
                icon: Activity, 
                color: 'text-indigo-400' 
            }))
        ];
        return list.sort((a, b) => b.time - a.time).slice(0, 8);
    }, [mySales, notes, currentUser, baseRate]);

    const handleOpenProfile = (phone: string) => {
        setSelectedPhone(phone);
        setIsProfileOpen(true);
        sfx.playClick();
    };

    return (
        <div className="min-h-full bg-surface-alt font-sans text-text-primary p-4 md:p-5 space-y-8 select-none">
            
            {/* Top Operational Status Gateway Panel */}
            <div className="bg-surface-alt/80 border border-border-strong rounded-md p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight flex flex-wrap items-center gap-3 text-text-primary">
                        Welcome, {currentUser?.name || 'Agent'} 
                        <span className="text-[11px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded tracking-widest uppercase shadow-sm">
                            Level {currentUser?.level || 1} CRM
                        </span>
                    </h1>
                    <p className="text-sm text-text-muted mt-2">
                        Central Command Console Active. All communications and dispatches are synced to the gateway.
                    </p>
                </div>
                
                {/* Health Monitoring Telemetry Lights */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-widest bg-surface-main p-3 rounded-md border border-border-strong shadow-sm shrink-0">
                    <div className="flex items-center gap-2 text-text-primary">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                        DB Linked
                    </div>
                    <div className="text-border-strong text-opacity-40">|</div>
                    <div className="flex items-center gap-2 text-text-primary">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm animate-pulse"></span>
                        Real-Time Sync
                    </div>
                    <div className="text-border-strong text-opacity-40">|</div>
                    <div className="flex items-center gap-2 text-text-primary">
                        <span className="h-2 w-2 rounded-full bg-indigo-600 shadow-sm animate-pulse"></span>
                        VOIP Ready
                    </div>
                </div>
            </div>

            {/* Non-Technical Direct Onboarding Shortcut for the ViciDial Auto Dialer */}
            <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden transition-all hover:border-indigo-600/50">
                <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-indigo-600/10 text-indigo-600 text-[11px] font-bold uppercase px-2 py-0.5 rounded tracking-widest border border-indigo-600/20">Auto Call System</span>
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold uppercase px-2 py-0.5 rounded tracking-widest border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Dialer Tunnel Active
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-text-primary tracking-tight">Need to launch ViciDial auto-comms now?</h3>
                    <p className="text-sm text-text-muted leading-relaxed max-w-4xl">
                        Setup is automated. Navigate to the <span className="text-indigo-600 font-bold cursor-pointer hover:text-indigo-600/80 transition-colors" onClick={() => window.dispatchEvent(new Event('OPEN_DIALER'))}>ViciDial Auto Dialer</span> screen to lock in your Agent credentials and sync real-time phone calls directly inside your workspace browser.
                    </p>
                </div>
                <button 
                    onClick={() => {
                        sfx.playConfirm();
                        window.dispatchEvent(new Event('OPEN_DIALER'));
                    }}
                    className="w-full lg:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-600/90 text-white text-sm font-bold rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap mt-4 lg:mt-0"
                >
                    <Phone size={14} className="animate-pulse" />
                    <span>Launch Dialer Console</span>
                </button>
            </div>

            {/* Main Stats Panel with Commissions Estimator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1 */}
                <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm transition-all hover:border-indigo-600/50 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <CheckCircle2 size={60} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none">Approved Operations</span>
                            <span className="text-indigo-600">
                                <CheckCircle2 size={16} />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary num-font tracking-tighter leading-none">
                            {mySales.filter(s => s.status === 'Approved').length} <span className="text-sm text-text-muted font-normal ml-1">/ {mySales.length}</span>
                        </p>
                    </div>
                    <div className="text-[11px] text-text-muted font-bold mt-6 pt-4 border-t border-border-strong flex justify-between relative z-10 uppercase tracking-widest">
                        <span>Verified Deck</span>
                        <span className="text-text-primary">{mySales.length} Entries</span>
                    </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm transition-all hover:border-emerald-500/50 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <DollarSign size={60} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none">Net Realized Value</span>
                            <span className="text-emerald-500">
                                <DollarSign size={16} />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-emerald-500 num-font tracking-tighter leading-none">
                            ${totalCommissionsEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-[11px] text-text-muted font-bold mt-6 pt-4 border-t border-border-strong flex justify-between relative z-10 uppercase tracking-widest">
                        <span>Calculated Comm</span>
                        <span className="text-text-primary">{baseRate}% Return</span>
                    </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm transition-all hover:border-accent-secondary/50 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                        <TrendingUp size={60} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest leading-none">Pipeline Projection</span>
                            <span className="text-sky-500">
                                <TrendingUp size={16} />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary num-font tracking-tighter leading-none">
                            ${estimatedPendingCommissions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-[11px] text-text-muted font-bold mt-6 pt-4 border-t border-border-strong flex justify-between relative z-10 uppercase tracking-widest">
                        <span>Unsettled Balance</span>
                        <span className="text-text-primary">{mySales.filter(s => s.status === 'Pending').length} Pending</span>
                    </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm transition-all hover:border-amber-500/50 relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 text-amber-500">
                        <Clock size={60} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-between items-start">
                            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest leading-none">Critical Contingencies</span>
                            <span className="text-amber-500">
                                <Clock size={16} />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-amber-500 num-font tracking-tighter leading-none">
                            {notes.filter(n => n.agentId === currentUser?.id && n.reason?.includes('Callback')).length}
                        </p>
                    </div>
                    <div className="text-[11px] text-text-muted font-bold mt-6 pt-4 border-t border-border-strong flex justify-between relative z-10 uppercase tracking-widest">
                        <span>Urgent Alarms</span>
                        <span className="text-amber-500 animate-pulse">{pendingCallbacks.length} Priority</span>
                    </div>
                </div>

            </div>

            {/* Dashboard Workspace Segment */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
                
                {/* LEFT BLOCK: Customer Search & Interactive History Lookup */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Customer Lookup and History Finder Card */}
                    <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Global Directory Hub</h3>
                                <p className="text-xs text-text-muted mt-1">Lookup full profile records and historic acquisitions.</p>
                            </div>
                            
                            {/* Fast Search input */}
                            <div className="relative group w-full sm:w-80">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-indigo-600 transition-all" />
                                <input 
                                    type="text" 
                                    className="w-full bg-surface-alt border border-border-strong rounded-md py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-accent-primary shadow-sm transition-all text-text-primary placeholder:text-text-muted/65"
                                    placeholder="Search customer matrix..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                                )}
                            </div>
                        </div>

                        {/* Search Results / Customer Previews */}
                        {searchTerm.trim() !== '' && (
                            <div className="bg-surface-alt/50 border border-border-strong rounded-md p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest pl-1">Matching Directory Profiles</span>
                                {filteredSearchCustomers.length === 0 ? (
                                    <div className="p-6 text-center text-sm text-text-muted font-bold">No registered profiles match the query parameters.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 relative z-20">
                                        {filteredSearchCustomers.map(cust => (
                                            <div 
                                                key={cust.id}
                                                onClick={() => handleOpenProfile(cust.phone)}
                                                className="bg-surface-main hover:border-indigo-600/50 border border-border-strong rounded-md p-4 flex items-center justify-between cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        {cust.name?.charAt(0) || 'C'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-text-primary group-hover:text-indigo-600 transition-colors">{cust.name}</h4>
                                                        <p className="text-xs text-text-muted font-mono mt-0.5">{cust.phone}</p>
                                                    </div>
                                                </div>
                                                <div className="flex bg-surface-alt p-2 rounded group-hover:bg-indigo-600/10 transition-colors border border-border-strong">
                                                    <ArrowUpRight size={14} className="text-text-muted group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Automatic Commission Accrual table for Personal Agents */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between pb-3 border-b border-border-strong">
                                <h4 className="text-[11px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-500" /> Live Personal Ledger
                                </h4>
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-600/10 px-2 py-0.5 rounded">Calculated Comm</span>
                            </div>

                            {mySales.length === 0 ? (
                                <div className="p-8 text-center text-[13px] text-text-muted font-medium bg-surface-alt/30 border border-dashed border-border-strong rounded-md mt-1">
                                    No logged sales yet under your profile credentials. Procure assets to begin logging.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 mt-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {mySales.map(sale => {
                                        const commAmount = sale.amount * (baseRate / 100);
                                        return (
                                            <div 
                                                key={sale.id}
                                                onClick={() => handleOpenProfile(sale.phone)}
                                                className="bg-surface-main hover:border-indigo-600/50 border border-border-strong rounded-md p-4 flex items-center justify-between transition-all cursor-pointer group shadow-sm hover:shadow-md"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className={`w-3 h-3 rounded-full ${sale.status === 'Approved' ? 'bg-emerald-500' : sale.status === 'Declined' ? 'bg-rose-500' : 'bg-amber-500'} shadow-sm`} />
                                                        <div className={`absolute inset-0 rounded-full animate-ping opacity-25 ${sale.status === 'Approved' ? 'bg-emerald-500' : sale.status === 'Declined' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-text-primary group-hover:text-indigo-600 transition-colors">{sale.customer}</span>
                                                            <span className="text-[11px] px-2 py-0.5 rounded bg-surface-alt/50 text-text-muted border border-border-strong font-mono uppercase tracking-widest">
                                                                {sale.product}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-text-muted font-medium flex items-center gap-1 mt-1">
                                                            Contract Vol: <span className="text-text-primary font-mono font-bold">${sale.amount.toLocaleString()}</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-2">
                                                        {sale.isDisputed ? (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest flex items-center gap-1 ${
                                                                sale.disputeStatus === 'Resolved' 
                                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                                    : sale.disputeStatus === 'Rejected'
                                                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                                                            }`}>
                                                                <AlertCircle size={10} /> {sale.disputeStatus || 'Pending'} Dispute
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDisputeSale(sale);
                                                                    setDisputeReason('');
                                                                    sfx.playClick();
                                                                }}
                                                                title="Flag for Review / Dispute"
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-amber-500/10 hover:text-amber-500 text-text-muted rounded border border-border-strong transition-all flex items-center gap-1"
                                                            >
                                                                <Flag size={12} />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Dispute</span>
                                                            </button>
                                                        )}
                                                        <p className="text-[13px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">+${commAmount.toFixed(2)}</p>
                                                    </div>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${sale.status === 'Approved' ? 'text-emerald-500' : sale.status === 'Declined' ? 'text-rose-500' : 'text-amber-500'}`}>
                                                        {sale.status}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Timeline Log */}
                    <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Activity size={100} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-widest flex items-center gap-2 border-b border-border-strong pb-3 relative z-10">
                            <Activity size={14} className="text-indigo-600" />
                            Synchronized Activity Stream
                        </h3>
                        
                        {activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-surface-alt/30 rounded-md border border-dashed border-border-strong relative z-10">
                                <CircleDashed className="text-text-muted animate-spin mb-4" size={32} />
                                <p className="text-text-muted font-bold text-sm">Waiting for operational sequence updates...</p>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10 before:absolute before:inset-0 before:ml-[1.15rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-strong before:to-transparent">
                                {activities.map((act, i) => (
                                    <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mt-2">
                                        <div className="flex items-center justify-center w-10 h-10 rounded border border-border-strong bg-surface-main shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 group-hover:scale-110 transition-transform duration-300">
                                            <act.icon size={14} className={act.color} />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface-main hover:bg-surface-alt border border-border-strong p-4 rounded-md shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group-hover:border-indigo-600/30">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-[13px] text-text-primary">{act.title}</span>
                                                <span className="text-xs font-mono text-text-muted font-bold bg-surface-alt/50 px-2 py-0.5 rounded border border-border-strong">{new Date(act.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <span className="text-xs text-text-muted mt-1 block font-medium leading-relaxed">{act.detail}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* RIGHT BLOCK: Dynamic Callback Alerts & System Gateway Decision Tree Rule Check */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Active Cutoff Incentives Feed */}
                    {activeIncentiveFeed && (
                        <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between border-b border-border-strong pb-3">
                                <h3 className="text-[11px] font-bold uppercase text-text-primary tracking-widest flex items-center gap-2">
                                    <Target size={14} className="text-indigo-600" /> Cutoff Incentives
                                </h3>
                                <span className="text-[10px] font-bold bg-indigo-600/10 text-indigo-600 uppercase px-2 py-0.5 rounded tracking-widest shadow-sm">{activeIncentiveFeed.label}</span>
                            </div>

                            {/* Hours Progress */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                                        <Clock size={12} /> Logged Hours
                                    </span>
                                    <span className="font-mono font-bold text-text-primary">
                                        {activeIncentiveFeed.loggedHours} / {activeIncentiveFeed.cutoffGoal} hrs
                                    </span>
                                </div>
                                <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden border border-border-strong">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            activeIncentiveFeed.loggedHours >= activeIncentiveFeed.cutoffGoal 
                                                ? 'bg-emerald-500' 
                                                : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${activeIncentiveFeed.hoursProgress}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-text-muted font-semibold">
                                    {activeIncentiveFeed.loggedHours >= activeIncentiveFeed.cutoffGoal 
                                        ? '✅ Attendance Gatekeeper: Passed' 
                                        : `⚠️ Need ${Math.max(0, activeIncentiveFeed.loggedHours === 0 ? activeIncentiveFeed.cutoffGoal : parseFloat((activeIncentiveFeed.cutoffGoal - activeIncentiveFeed.loggedHours).toFixed(1)))} more hours to qualify for cutoff payout.`}
                                </p>
                            </div>

                            {/* Spiff Tiering Progress */}
                            <div className="space-y-2 pt-2 border-t border-border-strong">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                                        <Award size={12} /> Sales Volume Target
                                    </span>
                                    <span className="font-mono font-bold text-text-primary">
                                        ${activeIncentiveFeed.currentSalesVolume.toLocaleString()}
                                    </span>
                                </div>
                                
                                {activeIncentiveFeed.nextTierGoal ? (
                                    <>
                                        <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden border border-border-strong">
                                            <div 
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${activeIncentiveFeed.volumeProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center text-[11px] text-text-muted font-semibold">
                                            <span>Progress to Next Tier: ${activeIncentiveFeed.nextTierGoal.toLocaleString()}</span>
                                            <span className="text-emerald-500 font-bold">Bonus: +${activeIncentiveFeed.nextTierBonus}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-3 rounded-md flex items-center gap-2">
                                        <Award size={16} className="shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider">Max Tier Unlocked!</p>
                                            <p className="text-[10px] opacity-95">All available spiff milestones achieved (+${activeIncentiveFeed.maxTierBonus} maximum bonus rate unlocked).</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Alarms and Callbacks */}
                    <div className="bg-surface-main border border-border-strong rounded-md p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-border-strong pb-3">
                            <h3 className="text-[11px] font-bold uppercase text-text-primary tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-amber-500 animate-spin-slow" /> Callback Alarms
                            </h3>
                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase px-2 py-0.5 rounded tracking-widest shadow-sm">Auto-Priority</span>
                        </div>

                        {pendingCallbacks.length === 0 ? (
                            <div className="p-8 bg-surface-alt/50 border border-dashed border-border-strong rounded-md text-center shadow-sm">
                                <p className="text-[13px] text-text-muted font-bold">No pending priority callbacks scheduled for this run.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingCallbacks.map(n => (
                                    <div 
                                        key={n.id} 
                                        onClick={() => handleOpenProfile(n.phone)}
                                        className="bg-surface-main border-l-2 border-border-strong border-y border-r border-y-border-strong border-r-border-strong rounded-r-md p-4 hover:border-l-status-warning cursor-pointer transition-all hover:bg-surface-alt shadow-sm group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[13px] font-bold text-text-primary tracking-tight group-hover:text-amber-500 transition-colors">{n.customerName || 'Customer'}</span>
                                            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase px-2 py-0.5 rounded tracking-widest shadow-sm">Urgent</span>
                                        </div>
                                        <p className="text-xs text-text-muted italic font-medium leading-relaxed">"{n.content?.substring(0, 60)}..."</p>
                                        <div className="mt-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-text-primary bg-surface-alt/50 p-2 rounded border border-border-strong shadow-sm group-hover:border-amber-500/30 transition-colors">
                                            <span className="text-text-muted group-hover:text-amber-500 transition-colors">Dial: {n.phone}</span>
                                            <span className="text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">Dial Card <ArrowUpRight size={12} /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Custom Interactive Profiles Inspector Modal Popup */}
            {selectedPhone && (
                <CustomerProfileModal 
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    phone={selectedPhone}
                    allSales={sales}
                    role="agent"
                />
            )}

            {/* Dispute Submission Dialog Modal */}
            {disputeSale && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-surface-main border border-border-strong rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 border-b border-border-strong pb-3">
                            <div className="p-2 bg-amber-500/10 text-amber-500 rounded">
                                <Flag size={20} />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-text-primary">Flag Deal for Review</h3>
                                <p className="text-xs text-text-muted">Submit an audit dispute for this payout to your manager.</p>
                            </div>
                        </div>

                        <div className="space-y-2 bg-surface-alt p-3 rounded border border-border-strong text-xs text-text-primary font-medium space-y-1">
                            <p><strong>Customer:</strong> {disputeSale.customer}</p>
                            <p><strong>Contract Volume:</strong> ${disputeSale.amount.toLocaleString()}</p>
                            <p><strong>Product:</strong> {disputeSale.product}</p>
                            <p><strong>Commission Estimator:</strong> ${(disputeSale.amount * (baseRate / 100)).toFixed(2)} ({baseRate}%)</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">Reason for Audit Request</label>
                            <textarea
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                placeholder="Explain your dispute reason (e.g., 'Worked 8 hours but marked late today' or 'Missing my sales tier bonus commission adjustment')."
                                className="w-full bg-surface-alt border border-border-strong rounded-md p-3 text-sm font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-accent-primary h-28 resize-none text-text-primary placeholder:text-text-muted/60"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setDisputeSale(null);
                                    setDisputeReason('');
                                    sfx.playClick();
                                }}
                                disabled={isSubmittingDispute}
                                className="px-4 py-2 bg-surface-alt hover:bg-border-strong border border-border-strong rounded-md text-xs font-bold uppercase tracking-wider text-text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFileDispute}
                                disabled={isSubmittingDispute || !disputeReason.trim()}
                                className="px-5 py-2 bg-amber-500 hover:bg-amber-500/90 disabled:opacity-50 text-black rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md"
                            >
                                {isSubmittingDispute ? 'Submitting...' : 'Submit Audit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
