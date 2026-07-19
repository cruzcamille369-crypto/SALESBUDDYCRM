import React, { useState, useEffect } from 'react';
import { 
    GitMerge, RefreshCw, Search, Users, Database, Percent, 
    ArrowRight, ShieldCheck, Mail, Phone, Landmark
} from 'lucide-react';
import { getStorageItem } from '../../../lib/storage';
import { sfx } from '../../../lib/soundService';

interface ProfileDetail {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
    ltv?: number;
    orderCount?: number;
    lastOrderDate?: number;
}

interface CrossTenantMatch {
    identityId: string;
    phoneHash: string;
    emailHash: string;
    createdAt: number;
    matchCount: number;
    tenants: string[];
    profilesByTenant: Record<string, ProfileDetail[]>;
}

interface AnalysisResponse {
    success: boolean;
    totalIdentitiesTracked: number;
    crossTenantOverlapCount: number;
    report: CrossTenantMatch[];
}

export const CrossTenantAnalysis: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState<AnalysisResponse | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<CrossTenantMatch | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalysis = async (playSfx = false) => {
        setLoading(true);
        setError(null);
        if (playSfx) sfx.playHover();
        try {
            const localUserStr = getStorageItem('nexus_session_user');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (localUserStr) {
                const u = JSON.parse(localUserStr);
                headers['x-user-level'] = String(u.level || '10');
                headers['x-user-id'] = String(u.id || 'sys_root');
                headers['x-user-name'] = String(u.name || 'Root Admin');
            }
            
            const res = await fetch('/api/collections/analytics/cross-sell-analysis', {
                method: 'GET',
                headers
            });

            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error('Access Denied: Level 10 Clearance Required.');
                }
                throw new Error(`Server returned status code ${res.status}`);
            }

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Received HTML response. The development server may be restarting or initializing. Please refresh in a moment.');
            }

            const json: AnalysisResponse = await res.json();
            if (json.success) {
                setData(json);
                if (json.report && json.report.length > 0) {
                    setSelectedMatch(json.report[0]);
                }
                if (playSfx) sfx.playSuccess();
            } else {
                throw new Error('Server reported success: false');
            }
        } catch (err: any) {
            console.error('Failed to fetch cross-tenant analysis:', err);
            setError(err.message || 'Failed to complete analysis request');
            if (playSfx) sfx.playError();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalysis();
    }, []);

    const filteredReport = React.useMemo(() => {
        if (!data?.report) return [];
        if (!searchQuery) return data.report;
        const query = searchQuery.toLowerCase();
        return data.report.filter(item => {
            const matchesId = item.identityId.toLowerCase().includes(query);
            const matchesTenants = item.tenants.some(t => t.toLowerCase().includes(query));
            const matchesProfiles = Object.values(item.profilesByTenant).some(profiles => 
                profiles.some(p => p.name?.toLowerCase().includes(query) || p.email?.toLowerCase().includes(query))
            );
            return matchesId || matchesTenants || matchesProfiles;
        });
    }, [data, searchQuery]);

    const overlapRate = React.useMemo(() => {
        if (!data || data.totalIdentitiesTracked === 0) return 0;
        return ((data.crossTenantOverlapCount / data.totalIdentitiesTracked) * 100).toFixed(1);
    }, [data]);

    return (
        <div className="w-full h-full flex flex-col gap-6 p-6 overflow-y-auto" id="cross_tenant_analysis_container">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600/10 text-indigo-600 p-2 rounded-xl">
                            <GitMerge size={22} />
                        </div>
                        <h1 className="text-xl font-bold text-text-primary tracking-tight">Master Identity Index & Cross-Tenant Links</h1>
                    </div>
                    <p className="text-sm text-text-muted mt-1">
                        Secure Root analysis engine detecting shared identity clusters across decoupled enterprise tenants using multi-stage hashed verification loops.
                    </p>
                </div>
                <button
                    onClick={() => fetchAnalysis(true)}
                    disabled={loading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-600-hover active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Analyzing...' : 'Re-Run Verification'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm">
                    <span>⚠️ {error}</span>
                </div>
            )}

            {/* Bento KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm flex items-center gap-4">
                    <div className="bg-indigo-50 text-indigo-600 p-4 rounded-xl">
                        <Database size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Tracked Identities</span>
                        <h3 className="text-2xl font-bold text-text-primary font-mono mt-0.5">
                            {loading ? '...' : data?.totalIdentitiesTracked ?? 0}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">Hashed multi-tenant identity registry size</p>
                    </div>
                </div>

                <div className="bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm flex items-center gap-4">
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Cross-Tenant Overlaps</span>
                        <h3 className="text-2xl font-bold text-text-primary font-mono mt-0.5">
                            {loading ? '...' : data?.crossTenantOverlapCount ?? 0}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">Identities shared in two or more workspaces</p>
                    </div>
                </div>

                <div className="bg-surface-main border border-border-subtle rounded-2xl p-6 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl">
                        <Percent size={24} />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Cross-Sell Affinity</span>
                        <h3 className="text-2xl font-bold text-text-primary font-mono mt-0.5">
                            {loading ? '...' : `${overlapRate}%`}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">Overlapping density across environments</p>
                    </div>
                </div>
            </div>

            {/* Main Interactive Workspace Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 flex-1">
                {/* Left Panel: Hashed Matches */}
                <div className="lg:col-span-5 bg-surface-main border border-border-subtle rounded-2xl flex flex-col shadow-sm min-h-[400px]">
                    <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-text-primary">Overlap Cluster Queue</span>
                            <span className="bg-surface-alt/50 text-text-secondary text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono">
                                {filteredReport.length} found
                            </span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search hashes, tenants, profiles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-alt border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-600 transition-all"
                            />
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
                        {loading && (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
                                <RefreshCw className="animate-spin text-indigo-600" size={24} />
                                <span className="text-xs">Analyzing system logs...</span>
                            </div>
                        )}

                        {!loading && filteredReport.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center">
                                <GitMerge size={32} className="opacity-30 mb-2" />
                                <span className="text-sm font-semibold">No Overlapping Identities Found</span>
                                <span className="text-xs mt-1 max-w-[250px]">Each customer profile resides completely within isolated tenants.</span>
                            </div>
                        )}

                        {!loading && filteredReport.map((match) => (
                            <button
                                key={match.identityId}
                                onClick={() => {
                                    setSelectedMatch(match);
                                    sfx.playHover();
                                }}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all hover:bg-surface-alt border ${selectedMatch?.identityId === match.identityId ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'border-transparent'}`}
                            >
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-text-primary font-mono truncate max-w-[200px]">
                                            {match.identityId}
                                        </span>
                                        <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                            {match.matchCount} Tenants
                                        </span>
                                    </div>
                                    <div className="flex gap-2 text-[10px] text-slate-400 font-mono truncate">
                                        <span>P: {match.phoneHash ? match.phoneHash.substring(0, 10) + '...' : 'none'}</span>
                                        <span>•</span>
                                        <span>E: {match.emailHash ? match.emailHash.substring(0, 10) + '...' : 'none'}</span>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-slate-400 shrink-0 ml-3" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Detail Breakdown */}
                <div className="lg:col-span-7 bg-surface-main border border-border-subtle rounded-2xl flex flex-col shadow-sm min-h-[400px]">
                    {selectedMatch ? (
                        <div className="flex flex-col h-full overflow-y-auto p-6">
                            {/* Profile Header */}
                            <div className="border-b border-slate-100 pb-5 mb-5 shrink-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-text-primary">Master Identity Cluster</h3>
                                            <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase tracking-wider block mt-0.5">
                                                ID: {selectedMatch.identityId}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                                            Active Alignment
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 bg-surface-alt border border-slate-100 rounded-xl p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Hash (SHA-256)</span>
                                        <span className="text-xs font-mono text-text-secondary truncate bg-surface-main border border-slate-100 rounded px-2 py-1 select-all" title={selectedMatch.phoneHash || 'Not Provided'}>
                                            {selectedMatch.phoneHash || 'Not Provided'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Hash (SHA-256)</span>
                                        <span className="text-xs font-mono text-text-secondary truncate bg-surface-main border border-slate-100 rounded px-2 py-1 select-all" title={selectedMatch.emailHash || 'Not Provided'}>
                                            {selectedMatch.emailHash || 'Not Provided'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Connection HUD Mapping Diagram */}
                            <div className="mb-6">
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Workspace Connection Mapping</span>
                                <div className="bg-surface-alt/50 border border-dashed border-border-subtle rounded-2xl p-6 mt-2 flex flex-col items-center justify-center relative min-h-[140px] overflow-hidden">
                                    {/* Central identity node */}
                                    <div className="relative z-10 w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                                        <GitMerge size={18} />
                                    </div>
                                    
                                    {/* Connected workspace nodes */}
                                    <div className="absolute inset-0 flex items-center justify-between px-10 pointer-events-none">
                                        {selectedMatch.tenants.map((tenant, idx) => {
                                            const isLeft = idx % 2 === 0;
                                            return (
                                                <div 
                                                    key={tenant} 
                                                    className={`flex flex-col items-center gap-1.5 relative z-10 ${isLeft ? '-translate-y-2' : 'translate-y-2'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-surface-main border border-border-subtle shadow-sm flex items-center justify-center font-mono text-xs font-bold text-text-secondary">
                                                        {tenant}
                                                    </div>
                                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tenant</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Connecting lines via CSS background lines */}
                                    <div className="absolute w-3/4 h-[2px] bg-slate-200 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"></div>
                                </div>
                            </div>

                            {/* Tenant Specific Profile Listings */}
                            <div className="flex-1 flex flex-col gap-4">
                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Decoupled Cross-Tenant Customer Profiles</span>
                                <div className="flex flex-col gap-4">
                                    {selectedMatch.tenants.map((tenantId) => {
                                        const profiles = selectedMatch.profilesByTenant[tenantId] || [];
                                        return (
                                            <div key={tenantId} className="border border-border-subtle rounded-xl p-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-surface-alt/50 text-text-secondary font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                                                            {tenantId}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-400">Environment</span>
                                                    </div>
                                                    <span className="text-[10px] text-text-muted font-semibold font-mono">
                                                        {profiles.length} linked record{profiles.length > 1 ? 's' : ''}
                                                    </span>
                                                </div>

                                                {profiles.map((profile) => (
                                                    <div key={profile.id} className="flex flex-col gap-2">
                                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-text-primary">{profile.name}</span>
                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${profile.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-surface-alt/50 text-text-muted'}`}>
                                                                    {profile.status || 'Active'}
                                                                </span>
                                                            </div>
                                                            <span className="text-[11px] font-mono text-slate-400 bg-surface-alt border border-slate-100 rounded px-1.5 py-0.5">
                                                                ID: {profile.id}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mt-1">
                                                            <div className="bg-surface-alt/50 rounded-lg p-2 flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Phone</span>
                                                                <span className="text-text-secondary font-medium font-mono mt-0.5 truncate flex items-center gap-1">
                                                                    <Phone size={10} className="text-slate-400" />
                                                                    {profile.phone || 'none'}
                                                                </span>
                                                            </div>
                                                            <div className="bg-surface-alt/50 rounded-lg p-2 flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Email</span>
                                                                <span className="text-text-secondary font-medium font-mono mt-0.5 truncate flex items-center gap-1" title={profile.email}>
                                                                    <Mail size={10} className="text-slate-400" />
                                                                    {profile.email || 'none'}
                                                                </span>
                                                            </div>
                                                            <div className="bg-surface-alt/50 rounded-lg p-2 flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total LTV</span>
                                                                <span className="text-text-secondary font-bold font-mono mt-0.5 flex items-center gap-0.5">
                                                                    <Landmark size={10} className="text-slate-400" />
                                                                    ${(profile.ltv || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="bg-surface-alt/50 rounded-lg p-2 flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Orders</span>
                                                                <span className="text-text-secondary font-medium font-mono mt-0.5">
                                                                    {profile.orderCount || 0} purchase{ (profile.orderCount || 0) !== 1 ? 's' : '' }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-center flex-1">
                            <GitMerge size={48} className="opacity-20 mb-2 animate-pulse" />
                            <span className="text-sm font-semibold">Select a Cluster</span>
                            <span className="text-xs mt-1">Pick an overlap cluster from the sidebar queue to inspect cross-tenant customer profiles.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
