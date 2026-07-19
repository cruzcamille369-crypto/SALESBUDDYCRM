// Module: Gateway | File: components/auth/ServerGateway.tsx
import { useState, useEffect } from 'react';
import { Plus, Shield, Trash2, AlertTriangle, Building, Clock } from 'lucide-react';
import { useSystem } from '../../hooks/useSystem';
import { useAuth } from '../../hooks/useAuth';
import { sfx } from '../../lib/soundService';
import { nexusGateway } from '../../nexus/adapters/DataGateway';
import { ServerCardTelemetry } from './ServerCardTelemetry';
import { ServerConfigModal } from './server-gateway/ServerConfigModal';

export const ServerGateway: React.FC = () => {
    const { serverList, switchServer, createNewServer, setView } = useSystem();
    const { currentUser } = useAuth();
    
    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    
    const [targetServer, setTargetServer] = useState<any>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    
    // Purge Sequence State
    const [isPurging, setIsPurging] = useState(false);

    // Live clock
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleEnterServer = (serverId: string) => {
        sfx.playSubmit();
        setTimeout(() => {
            switchServer(serverId);
            setView('admin_dashboard');
        }, 500);
    };

    const openCreateModal = () => {
        setIsCreateOpen(true);
        sfx.playClick();
    };

    const openEditModal = (server: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetServer(server);
        setIsEditOpen(true);
        sfx.playClick();
    };

    const openDeleteModal = (server: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetServer(server);
        setDeleteConfirmation('');
        setIsDeleteOpen(true);
        setIsPurging(false);
        sfx.playAlarm(); 
    };

    const handleConfirmDelete = async () => {
        if (!targetServer || deleteConfirmation !== targetServer.name) return;
        
        setIsPurging(true);
        sfx.playSubmit();
        
        await nexusGateway.deleteServer(targetServer.id);
        
        setIsDeleteOpen(false);
        setTargetServer(null);
        setIsPurging(false);
    };

    const handleSaveCreate = async (name: string, region: string) => {
        sfx.playSuccess();
        await createNewServer(name, region);
        setIsCreateOpen(false);
    };

    const handleSaveEdit = async (name: string, region: string) => {
        if (!targetServer) return;
        sfx.playConfirm();
        await nexusGateway.updateServer(targetServer.id, { name, region });
        setIsEditOpen(false);
        setTargetServer(null);
    };

    const getRegionColor = (region: string) => {
        if (region.includes('East')) return 'text-indigo-600';
        if (region.includes('West')) return 'text-amber-600';
        if (region.includes('EU')) return 'text-blue-500';
        return 'text-emerald-600';
    };

    return (
        <div className="h-full w-full flex flex-col justify-between bg-surface-canvas text-text-primary font-sans select-none relative overflow-y-auto">
            
            {/* Ambient colorful sales-focused glow effect that links beautifully to the login UI */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-indigo-200/20 rounded-full blur-[140px] animate-pulse duration-[10s]"></div>
                <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-emerald-200/20 rounded-full blur-[120px]"></div>
                <div className="absolute -bottom-40 right-1/3 w-[450px] h-[450px] bg-pink-100/30 rounded-full blur-[100px]"></div>
                
                {/* Clean, premium sales-grid dots pattern */}
                <div 
                    className="absolute inset-0 opacity-[0.015]" 
                    style={{ 
                        backgroundImage: 'radial-gradient(rgba(79, 70, 229, 0.15) 1px, transparent 1px)', 
                        backgroundSize: '24px 24px' 
                    }}
                ></div>
            </div>

            {/* HEADER */}
            <header className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between border-b border-border-subtle/40 bg-surface-main/40 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                        <Building size={18} strokeWidth={2.5} />
                    </div>
                    <span className="text-text-primary font-black tracking-tight text-lg">My Pipe</span>
                </div>
                
                {/* Live Clock / Status */}
                <div className="hidden sm:flex items-center gap-2 border border-border-subtle/60 bg-surface-main px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-text-secondary">
                    <Clock size={13} className="text-indigo-500 shrink-0" />
                    <span>
                        {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </header>

            {/* MAIN CONTENT CONTAINER */}
            <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-10 md:py-14 flex flex-col justify-start">
                
                {/* Hero Greeting Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-8 border-b border-border-subtle/60 gap-6 mb-10">
                    <div className="space-y-2">
                        {/* Level 10 Admin Access Tag */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/80 text-amber-700 text-[11px] font-extrabold shadow-sm">
                            <Shield size={12} className="text-amber-500 fill-amber-500/10" />
                            <span>LEVEL 10 SYSTEM ADMINISTRATOR</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-black text-text-primary tracking-tight leading-tight pt-1">
                            My Workspaces
                        </h1>
                        <p className="text-sm text-text-muted font-semibold max-w-2xl leading-relaxed">
                            Welcome back, <span className="text-text-primary font-bold">{currentUser?.name || 'System Admin'}</span>! Switch into an active organization instance below to monitor active sales funnels, manage pipelines, and configure CRM routing.
                        </p>
                    </div>

                    {/* Create New Workspace Trigger */}
                    <button 
                        onClick={openCreateModal}
                        className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-full transition-all shadow-[0_4px_14px_rgba(79,70,229,0.2)] hover:shadow-[0_6px_22px_rgba(79,70,229,0.35)] flex items-center gap-2 select-none"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Create New Workspace</span>
                    </button>
                </div>

                {/* Workspace Cards Grid */}
                {serverList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-surface-main/60 border border-border-subtle/50 rounded-[32px] p-8 text-center backdrop-blur-md">
                        <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
                            <Building size={24} />
                        </div>
                        <h3 className="text-lg font-black text-text-primary mb-1">No workspaces found</h3>
                        <p className="text-sm text-text-muted font-semibold max-w-sm mb-6 leading-relaxed">
                            Create your first sales organization instance to begin provisioning agent accounts and loading customer pools.
                        </p>
                        <button 
                            onClick={openCreateModal}
                            className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full transition-all shadow-md flex items-center gap-1.5"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Provision First Workspace</span>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {serverList.map(server => (
                            <ServerCardTelemetry 
                                key={server.id}
                                server={server}
                                isActive={server.status === 'active'}
                                onEnter={handleEnterServer}
                                onEdit={openEditModal}
                                onDelete={openDeleteModal}
                                getRegionColor={getRegionColor}
                            />
                        ))}
                    </div>
                )}

            </main>

            {/* MINIMAL FOOTER */}
            <footer className="relative z-10 px-6 py-6 md:px-12 flex items-center justify-between text-slate-400 font-bold text-xs border-t border-slate-100/50 bg-surface-main/20 backdrop-blur-sm">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400">
                    My Pipe CRM Gateway
                </span>
                <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                    Secure Administrative Session
                </span>
            </footer>

            {/* Create Modal */}
            <ServerConfigModal 
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSave={handleSaveCreate}
                title="Create Workspace Instance"
                actionLabel="Let's Go!"
            />

            {/* Edit Modal */}
            <ServerConfigModal 
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                initialName={targetServer?.name}
                initialRegion={targetServer?.region}
                onSave={handleSaveEdit}
                title="Workspace Configuration"
                actionLabel="Save Settings"
            />

            {/* GORGEOUS PRO-DESIGNED RED DELETION MODAL */}
            <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-md transition-opacity duration-300 p-4 ${isDeleteOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className={`w-full max-w-md bg-surface-main border border-border-subtle rounded-[32px] p-8 shadow-[0_24px_50px_rgba(244,63,94,0.08)] transform transition-all duration-300 ${isDeleteOpen ? 'scale-100' : 'scale-95'}`}>
                    
                    {isPurging ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 mb-5 animate-pulse">
                                <Trash2 size={32} className="text-rose-500 animate-bounce" />
                            </div>
                            <h2 className="text-lg font-black text-text-primary mb-2">Purging Workspace...</h2>
                            <p className="text-sm text-text-muted font-semibold max-w-[260px] leading-relaxed">
                                Destroying secure cluster and permanently clearing out operational records.
                            </p>
                        </div>
                    ) : (
                        // CONFIRMATION VIEW
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-500 shadow-sm shrink-0">
                                    <AlertTriangle size={24} strokeWidth={2.5} className="animate-pulse" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-lg font-black text-text-primary leading-tight">Delete Workspace?</h2>
                                    <p className="text-[10px] font-extrabold text-rose-500 uppercase tracking-widest">CRITICAL ADMIN ACTION</p>
                                </div>
                            </div>
                            
                            <p className="text-sm text-text-muted font-semibold leading-relaxed">
                                You are about to permanently delete the <span className="text-text-primary font-bold">{targetServer?.name}</span> organization instance. All configuration metrics, sales boards, and local team lists will be erased. This action is irreversible.
                            </p>

                            <div className="space-y-2">
                                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider ml-1">
                                    Type workspace name to confirm
                                </label>
                                <input 
                                    autoComplete="off" 
                                    spellCheck={false} 
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    placeholder={targetServer?.name}
                                    className="w-full bg-surface-alt border border-border-subtle rounded-2xl px-4 py-3 text-sm font-black text-text-primary outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 focus:bg-surface-main transition-all placeholder:text-slate-300"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => { setIsDeleteOpen(false); setDeleteConfirmation(''); }}
                                    className="flex-1 h-12 rounded-full border border-border-subtle hover:border-border-strong text-text-secondary hover:bg-surface-alt font-bold text-xs transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmDelete}
                                    disabled={deleteConfirmation !== targetServer?.name}
                                    className="flex-1 h-12 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Trash2 size={14} strokeWidth={2.5} />
                                    <span>Delete Workspace</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
