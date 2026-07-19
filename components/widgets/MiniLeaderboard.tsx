import React from 'react';
import { Trophy, Activity } from 'lucide-react';
import { useCRM } from '../../hooks/useCRM';
import { useLeaderboard } from './leaderboard/useLeaderboard';
import { Card } from '../ui/Base';

export const MiniLeaderboard = () => {
    const { sales, users, attendance, systemConfig } = useCRM();
    const { leaderData, monthName } = useLeaderboard(
        sales, users, attendance, systemConfig, new Date(), 'All', '', false
    );

    const topLeaders = leaderData.slice(0, 5);

    return (
        <Card className="flex flex-col h-full bg-surface-main border-border-subtle shadow-sm rounded-lg p-0 overflow-hidden group hover:border-indigo-600/30 transition-all">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-semibold text-text-primary tracking-tight">Team Rankings</h3>
                </div>
                <div className="text-[10px] font-medium text-text-muted bg-surface-alt px-2 py-1 rounded">
                    {monthName}
                </div>
            </div>
            
            <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar">
                {topLeaders.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-xs text-text-muted">
                        No ranking data available.
                    </div>
                ) : (
                    topLeaders.map((user, idx) => (
                        <div key={user.agentId} className="relative overflow-hidden flex items-center justify-between p-3 rounded-md border border-transparent hover:border-border-subtle bg-surface-main hover:bg-surface-alt transition-all duration-300 group/row">
                            {/* Proportional visual telemetry backing bar */}
                            <div 
                                className="absolute left-0 bottom-0 top-0 bg-indigo-600/[0.04] pointer-events-none transition-all duration-500 rounded-l-md" 
                                style={{ width: `${topLeaders[0].totalRevenue > 0 ? (user.totalRevenue / topLeaders[0].totalRevenue) * 100 : 0}%` }}
                            />
                            
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold
                                    ${idx === 0 ? 'bg-amber-500/10 text-amber-500' : 
                                    idx === 1 ? 'bg-slate-300/10 text-text-muted' :
                                    idx === 2 ? 'bg-amber-700/10 text-amber-600' : 
                                    'bg-surface-alt text-text-muted'}
                                `}>
                                    {idx + 1}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-text-primary truncate max-w-[120px]">{user.agentName}</span>
                                    <span className="text-[10px] text-text-muted">{user.team} Unit</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end relative z-10">
                                <span className="text-sm font-bold text-emerald-500 mb-0.5">
                                    ${user.totalRevenue.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-text-muted flex items-center gap-1">
                                    <Activity size={10} className="text-indigo-600" /> {user.dealCount} deals
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};
