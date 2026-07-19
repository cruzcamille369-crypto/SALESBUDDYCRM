import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Zap, RefreshCcw } from 'lucide-react';
import { SystemHealth } from '../../../types';
import { sfx } from '../../../lib/soundService';

interface DashboardHeaderProps {
    health?: SystemHealth;
    onToggleControls?: () => void;
    areControlsOpen?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ health, onToggleControls, areControlsOpen }) => {
    const isOffline = health?.cloudSync === 'OFFLINE';
    const [liveMode, setLiveMode] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (liveMode && !isOffline) {
            interval = setInterval(() => {
                window.dispatchEvent(new CustomEvent('REFRESH_DATA', { detail: { source: 'live_mode' } }));
                console.log("[Live Mode] Analytics refreshed.");
            }, 60000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [liveMode, isOffline]);

    return (
        <div className="flex justify-between items-center shrink-0 bg-surface-alt/90 backdrop-blur-3xl border border-border-strong p-4 rounded-xl shadow-sm relative overflow-hidden group hover:border-indigo-600/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-surface-alt/50 border shadow-inner ${isOffline ? 'border-rose-500/30 text-rose-500 shadow-sm' : 'border-emerald-500/30 text-emerald-500 shadow-sm'}`}>
                    {isOffline ? <Activity size={22} className="animate-pulse"/> : <ShieldCheck size={24} />}
                </div>
                <div>
                    <h2 className="text-xl font-display font-medium tracking-tight text-text-primary capitalize flex items-center gap-3">
                        {isOffline ? 'Taking a nap 💤' : "How's the team doing? 🚀"}
                        <div className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-sm ${isOffline ? 'bg-rose-500 text-rose-500' : 'bg-emerald-500 text-emerald-500'}`}></div>
                    </h2>
                    <p className="text-sm font-semibold text-text-muted mt-1 flex items-center gap-2">
                        <span>{isOffline ? 'We are having trouble connecting.' : 'Everything is running smoothly.'}</span>
                    </p>
                </div>
            </div>

            <div className="flex gap-3 relative z-10">
                <button
                    onClick={() => {
                        sfx.playClick();
                        setLiveMode(!liveMode);
                    }}
                    className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-wider border transition-all active:scale-95 ${
                        liveMode 
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500 hover:text-white hover:shadow-sm ring-1 ring-transparent hover:ring-white/20' 
                            : 'bg-surface-alt/50 text-text-muted border-border-strong hover:bg-surface-alt hover:text-text-primary'
                    }`}
                    title="Toggle Live Mode (60s refresh)"
                >
                    <RefreshCcw size={16} className={liveMode ? "animate-spin" : ""} />
                    Live Data: {liveMode ? 'ON' : 'OFF'}
                </button>
                {onToggleControls && (
                    <button
                        onClick={() => {
                            sfx.playClick();
                            onToggleControls();
                        }}
                        className={`group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-wider border transition-all active:scale-95 ${
                            areControlsOpen 
                                ? 'bg-surface-alt/50 text-text-primary border-border-strong shadow-inner hover:bg-surface-alt' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white hover:shadow-sm ring-1 ring-transparent hover:ring-white/20'
                        }`}
                        title="Toggle Setup Tools"
                    >
                        <Activity size={16} className={areControlsOpen ? "opacity-50" : "animate-pulse"} />
                        {areControlsOpen ? 'Hide Controls' : 'Open Controls'}
                    </button>
                )}
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('NAVIGATE', { detail: 'enrollment' }))}
                    className="group flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold tracking-wider border transition-all bg-indigo-600/10 text-indigo-600 border-indigo-600/30 hover:bg-indigo-600 hover:text-white shadow-sm hover:shadow-sm ring-1 ring-transparent hover:ring-white/20 active:scale-95"
                >
                    <Zap size={16} className="group-hover:animate-bounce" />
                    Help a Customer
                </button>
            </div>
        </div>
    );
};
