// Module: Gateway | File: components/auth/ServerCardTelemetry.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Globe, Server, Lock, Settings, Trash2, Key, Database as DbIcon, Activity } from 'lucide-react';

interface ServerCardTelemetryProps {
    server: any;
    isActive: boolean;
    onEnter: (id: string) => void;
    onEdit: (server: any, e: React.MouseEvent) => void;
    onDelete: (server: any, e: React.MouseEvent) => void;
    getRegionColor: (region: string) => string;
}

interface ServerStats {
    healthScore: number;
    apiUsage: number;
    apiLimit: number;
    storageUsed: number;
    storageLimit: number;
}

export const ServerCardTelemetry: React.FC<ServerCardTelemetryProps> = React.memo(({ 
    server, isActive, onEnter, onEdit, onDelete, getRegionColor 
}) => {
    // Determine Environment Type
    const envType = useMemo(() => {
        const name = server.name.toLowerCase();
        if (name.includes('sandbox') || name.includes('test')) return 'Sandbox';
        if (name.includes('dev')) return 'Development';
        return 'Production';
    }, [server.name]);

    const initialStats = useMemo(() => {
        // Generate stable fake stats based on server ID to prevent jumping
        const seed = server.id.charCodeAt(0) + server.id.charCodeAt(server.id.length - 1);
        const rand = (seed % 100) / 100;
        
        return { 
            healthScore: 92 + Math.floor(rand * 8), 
            apiUsage: Math.floor(rand * 8000) + 1200, 
            apiLimit: envType === 'Production' ? 100000 : 10000, 
            storageUsed: Math.floor(rand * 600) + 120, // GB
            storageLimit: envType === 'Production' ? 1000 : 200 // GB
        };
    }, [server.id, envType]);

    const [stats, setStats] = useState<ServerStats>(initialStats);

    // Isolated Heartbeat
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => {
                const newHealth = Math.min(100, Math.max(90, prev.healthScore + (Math.random() * 2 - 1)));
                return {
                    ...prev,
                    healthScore: newHealth,
                    apiUsage: prev.apiUsage + Math.floor(Math.random() * 3) // Simulate mild active usage ticking
                };
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [server.id]);

    const envColors = {
        'Production': 'bg-emerald-50 border border-emerald-100 text-emerald-600',
        'Sandbox': 'bg-amber-50 border border-amber-100 text-amber-600',
        'Development': 'bg-purple-50 border border-purple-100 text-purple-600'
    };

    return (
        <div 
            onClick={() => isActive && onEnter(server.id)}
            className={`
                bg-surface-main/95 border border-border-subtle/80 rounded-[32px] p-6 group cursor-pointer 
                transition-all duration-300 relative flex flex-col h-[290px] shadow-[0_4px_12px_rgba(15,23,42,0.01)]
                ${isActive 
                    ? 'hover:border-indigo-500/40 hover:shadow-[0_12px_36px_rgba(79,70,229,0.06)] hover:translate-y-[-2px]' 
                    : 'opacity-55 grayscale cursor-not-allowed'
                }
            `}
        >
            {/* Elegant visual indicator band inside card */}
            {isActive && (
                <div className="absolute top-0 left-12 right-12 h-[3px] bg-gradient-to-r from-indigo-500/40 to-violet-500/40 rounded-full"></div>
            )}

            {/* Top Action & Badge Row */}
            <div className="flex justify-between items-start mb-5">
                <div className={`p-3 rounded-2xl border transition-all ${
                    isActive 
                        ? 'bg-indigo-50/80 border-indigo-100 text-indigo-600 shadow-sm' 
                        : 'bg-rose-50 border-rose-100 text-rose-500'
                }`}>
                    {isActive ? <Server size={20} strokeWidth={2.5}/> : <Lock size={20} strokeWidth={2.5}/>}
                </div>

                <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full ${envColors[envType as keyof typeof envColors]}`}>
                        {envType}
                    </span>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                        <button 
                            onClick={(e) => onEdit(server, e)} 
                            className="p-1.5 hover:bg-surface-alt border border-transparent hover:border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
                            title="Edit Workspace"
                        >
                            <Settings size={16}/>
                        </button>
                        <button 
                            onClick={(e) => onDelete(server, e)} 
                            className="p-1.5 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all"
                            title="Delete Workspace"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                </div>
            </div>

            {/* Middle Workspace Details */}
            <div className="flex-1">
                <h3 className="text-lg font-black text-text-primary group-hover:text-indigo-600 transition-colors mb-1 truncate">
                    {server.name}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mb-5">
                    <span className={`flex items-center gap-1 font-semibold ${getRegionColor(server.region)}`}>
                        <Globe size={14}/> {server.region}
                    </span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1">
                        <Key size={14} className="text-slate-300"/> ID: {server.id.split('-').pop()}
                    </span>
                </div>

                {isActive && (
                    <div className="grid grid-cols-2 gap-3.5">
                        {/* Storage Capacity */}
                        <div className="bg-surface-alt/50 rounded-2xl p-3 border border-slate-100 hover:border-indigo-500/20 transition-all">
                            <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1">
                                <DbIcon size={11} className="text-indigo-500" />
                                Storage Used
                            </p>
                            <p className="text-sm font-black text-text-primary">
                                {stats.storageUsed} <span className="text-[11px] font-semibold text-slate-400">/ {stats.storageLimit} GB</span>
                            </p>
                            <div className="h-1 w-full bg-slate-200/60 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}></div>
                            </div>
                        </div>

                        {/* Traffic Quota */}
                        <div className="bg-surface-alt/50 rounded-2xl p-3 border border-slate-100 hover:border-indigo-500/20 transition-all">
                            <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mb-1 flex items-center gap-1">
                                <Activity size={11} className="text-emerald-500" />
                                API Quota
                            </p>
                            <p className="text-sm font-black text-text-primary">
                                {(stats.apiUsage / 1000).toFixed(1)}k <span className="text-[11px] font-semibold text-slate-400">/ {(stats.apiLimit / 1000).toFixed(0)}k</span>
                            </p>
                            <div className="h-1 w-full bg-slate-200/60 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: `${(stats.apiUsage / stats.apiLimit) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Status Row */}
            <div className="pt-4 border-t border-slate-100/80 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] text-text-muted font-bold">
                        {isActive ? 'Workspace Healthy' : 'Locked Workspace'}
                    </span>
                </div>
                
                <div className="flex items-center gap-1 text-xs font-extrabold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    {isActive ? (
                        <>
                            <span>Enter</span>
                            <ArrowRight size={14} strokeWidth={2.5}/>
                        </>
                    ) : (
                        <span className="text-slate-400">Restricted</span>
                    )}
                </div>
            </div>
        </div>
    );
});
