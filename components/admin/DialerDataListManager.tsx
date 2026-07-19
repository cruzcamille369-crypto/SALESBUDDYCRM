import React, { useMemo } from 'react';
import { Database, Download, Cloud, Activity, ListFilter, Users, FileSpreadsheet } from 'lucide-react';
import { PanelFrame } from '../ui/PanelFrame';
import { useCRM } from '../../hooks/useCRM';
import { DialerUploadWidget } from '../widgets/telephony/DialerUploadWidget';

export const DialerDataListManager: React.FC = () => {
    const { dialerLists } = useCRM();

    const stats = useMemo(() => {
        if (!dialerLists) return { totalLists: 0, totalRows: 0, activeLists: 0, uniqueAgents: 0 };
        return {
            totalLists: dialerLists.length,
            totalRows: dialerLists.reduce((sum, list) => sum + (list.rowCount || 0), 0),
            activeLists: dialerLists.filter(l => l.status === 'Active').length,
            uniqueAgents: new Set(dialerLists.map(l => l.uploadedBy)).size
        };
    }, [dialerLists]);
    
    return (
        <div className="w-full h-full p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Top Dashboard Metrics */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-surface-main/80 border border-border-subtle p-4 rounded-xl flex items-center justify-between group hover:border-indigo-600/30 transition-colors">
                    <div>
                        <div className="text-sm  font-bold text-text-muted mb-1 flex items-center gap-1.5">
                            <Database size={12} className="text-indigo-600" /> Total Uploads
                        </div>
                        <div className="text-lg font-bold font-mono">{stats.totalLists}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-lg group-hover:bg-indigo-600/10 transition-colors">
                        <Activity size={20} className="text-text-muted group-hover:text-indigo-600" />
                    </div>
                </div>

                <div className="bg-surface-main/80 border border-border-subtle p-4 rounded-xl flex items-center justify-between group hover:border-accent-secondary/30 transition-colors">
                    <div>
                        <div className="text-sm  font-bold text-text-muted mb-1 flex items-center gap-1.5">
                            <ListFilter size={12} className="text-sky-500" /> Total Leads (Rows)
                        </div>
                        <div className="text-lg font-bold font-mono text-white">{stats.totalRows.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-lg group-hover:bg-sky-500/10 transition-colors">
                        <Database size={20} className="text-text-muted group-hover:text-sky-500" />
                    </div>
                </div>

                <div className="bg-surface-main/80 border border-border-subtle p-4 rounded-xl flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                    <div>
                        <div className="text-sm  font-bold text-text-muted mb-1 flex items-center gap-1.5">
                            <Activity size={12} className="text-emerald-500" /> Active Tunnels
                        </div>
                        <div className="text-lg font-bold font-mono text-white">{stats.activeLists}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                        <Cloud size={20} className="text-text-muted group-hover:text-emerald-500" />
                    </div>
                </div>

                <div className="bg-surface-main/80 border border-border-subtle p-4 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-colors">
                    <div>
                        <div className="text-sm  font-bold text-text-muted mb-1 flex items-center gap-1.5">
                            <Users size={12} className="text-amber-500" /> Contributing Agents
                        </div>
                        <div className="text-lg font-bold font-mono text-white">{stats.uniqueAgents}</div>
                    </div>
                    <div className="p-3 bg-surface-alt rounded-lg group-hover:bg-amber-500/10 transition-colors">
                        <Users size={20} className="text-text-muted group-hover:text-amber-500" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                    <PanelFrame title="Central Intelligence: Dialer Data Warehouse">
                        <div className="w-full text-left overflow-auto max-h-[500px]">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b border-border-subtle  tracking-wide text-text-muted bg-surface-alt/80  sticky top-0 z-10">
                                        <th className="p-4 text-left font-bold">List Name / Content</th>
                                        <th className="p-4 text-left font-bold">Rows</th>
                                        <th className="p-4 text-center font-bold">Status</th>
                                        <th className="p-4 text-right font-bold w-24">Extract</th>
                                    </tr>
                                </thead>
                                <tbody className="text-text-primary">
                                    {!dialerLists || dialerLists.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-16 text-center text-text-muted">
                                                <div className="flex flex-col items-center justify-center p-5 border border-border-subtle rounded-xl bg-surface-alt/30 max-w-sm mx-auto">
                                                    <Cloud size={48} className="mb-4 opacity-20" />
                                                    <div className="text-sm font-bold text-white mb-2  tracking-wider">No Data Lists Found</div>
                                                    <div className="text-sm opacity-60 leading-relaxed max-w-xs px-4">
                                                        Dialer warehouse is empty. Upload CSV targets using the module to the right.
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        dialerLists.sort((a, b) => b.uploadedAt - a.uploadedAt).map((list) => (
                                            <tr key={list.id} className="border-b border-border-subtle hover:bg-surface-main/[0.02] transition-colors group">
                                                <td className="p-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded bg-surface-alt flex items-center justify-center border border-border-subtle">
                                                            <FileSpreadsheet size={14} className="text-sky-500" />
                                                        </div>
                                                        <div className="font-mono text-sm group-hover:text-sky-500 transition-colors truncate max-w-[150px]" title={list.name}>
                                                            {list.name}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono font-bold text-indigo-600 bg-indigo-600/10 px-2 py-1 rounded text-sm border border-indigo-600/20">
                                                        {list.rowCount?.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-sm  tracking-wider font-bold border ${        
                                                        list.status === 'Active' 
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                        : 'bg-surface-alt text-text-muted border-border-subtle'
                                                    }`}>
                                                        {list.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                                                        {list.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {list.dataUrl ? (
                                                        <button 
                                                            className="p-2 hover:bg-indigo-600 hover:text-white bg-surface-alt rounded border border-border-subtle transition-all text-text-muted group/btn relative overflow-hidden" 
                                                            title="Extract Payload"
                                                            onClick={() => {
                                                                const blob = new Blob([decodeURIComponent(escape(atob(list.dataUrl!)))], { type: 'text/csv' });
                                                                const url = URL.createObjectURL(blob);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = list.name;
                                                                a.click();
                                                                URL.revokeObjectURL(url);
                                                            }}
                                                        >
                                                            <Download size={14} className="relative z-10" />
                                                            <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-sm  opacity-40 font-bold block w-full text-center">No Data</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </PanelFrame>
                </div>
                
                <div>
                    <DialerUploadWidget />
                </div>
            </div>
        </div>
    );
};
