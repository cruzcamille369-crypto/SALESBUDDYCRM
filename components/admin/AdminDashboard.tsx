import React, { useState, useMemo } from 'react';
import { useCRM } from '../../hooks/useCRM';
import { SystemHealth, SystemConfig, Sale, User } from '../../types';
import { useAgentPerformance } from '../../context/AgentPerformanceContext';
import { ShieldAlert, Server, Radio, CheckCircle2, XCircle, History, Wrench, AlertTriangle, Activity } from 'lucide-react';
import { AuditExplorer } from './tools/AuditExplorer';
import { ScenarioPlanner } from './tools/ScenarioPlanner';

interface AdminDashboardProps {
  onToggleControls?: () => void;
  areControlsOpen?: boolean;
  onBroadcast?: (msg: string, urgency: 'Routine' | 'Immediate' | 'Flash') => Promise<void>;
  health?: SystemHealth;
  onRunDiagnostics?: () => void;
  onTestUplink?: () => Promise<boolean>;
  onGhostLogin?: (userId: string) => void;
  systemConfig?: SystemConfig;
  onApproveSale?: (saleId: string) => void;
  onDeclineSale?: (saleId: string) => void;
  onSendMessage?: (agentId: string, message: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onBroadcast,
  health
}) => {
  const { sales, users, auditLogs, systemConfig, updateSaleStatus, currentUser } = useCRM();
  const { agentPerformances } = useAgentPerformance();
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'audit' | 'scenario'>('none');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'Routine' | 'Immediate' | 'Flash'>('Routine');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const handleSendBroadcast = async () => {
    if (!broadcastText.trim() || !onBroadcast) return;
    setIsSendingBroadcast(true);
    try {
      await onBroadcast(broadcastText, broadcastUrgency);
      setBroadcastText('');
      setBroadcastUrgency('Routine');
      setBroadcastActive(false);
    } catch (err) {
      console.error('Failed to send broadcast', err);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Optimistic UI state for sales processing
  const [processingSales, setProcessingSales] = useState<Set<string>>(new Set());
  const [declineContext, setDeclineContext] = useState<{ id: string, show: boolean }>({ id: '', show: false });
  const [declineReason, setDeclineReason] = useState('');

  const QUICK_REJECTION_REASONS = [
    "Payment Info Invalid",
    "Missing Documentation",
    "Compliance/Risk Flag",
    "Duplicate Record"
  ];

  const handleApprove = async (saleId: string) => {
    setProcessingSales(prev => new Set(prev).add(saleId));
    try {
        await updateSaleStatus(saleId, 'Approved', {});
    } finally {
        setProcessingSales(prev => {
        const next = new Set(prev);
        next.delete(saleId);
        return next;
        });
        setDeclineContext({ id: '', show: false });
        setDeclineReason('');
    }
  };

  const handleDecline = async (saleId: string) => {
    if (!declineReason) return;
    setProcessingSales(prev => new Set(prev).add(saleId));
    try {
        await updateSaleStatus(saleId, 'Declined', { systemNotes: declineReason });
    } finally {
        setProcessingSales(prev => {
        const next = new Set(prev);
        next.delete(saleId);
        return next;
        });
        setDeclineContext({ id: '', show: false });
        setDeclineReason('');
    }
  };

  // Derive Zones Data
  const pendingSales = useMemo(() => sales.filter((s: Sale) => s.status === 'Pending').sort((a: Sale, b: Sale) => b.timestamp - a.timestamp), [sales]);
  const agents = useMemo(() => users.filter((u: User) => u.role === 'agent'), [users]);
  
  // Predictive UX: High-Value Untouched
  const highValueWarnings = useMemo(() => {
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    return pendingSales.filter((s: Sale) => s.amount >= 1000 && s.timestamp < twoHoursAgo);
  }, [pendingSales]);

  // Revenue Metrics
  const todayRevenue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter((s: Sale) => s.status === 'Approved' && s.timestamp >= today.getTime()).reduce((sum: number, s: Sale) => sum + s.amount, 0);
  }, [sales]);

  return (
    <div className="h-full flex flex-col bg-surface-canvas text-text-secondary font-sans overflow-hidden relative">
      {/* GHL / Zoho Style Sub-header */}
      <div className="flex-none bg-surface-main border-b border-border-subtle px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">Oversight Console</h1>
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
            <Server size={12} className="text-emerald-500 animate-pulse" />
            <span>Tenant Active: <span className="font-semibold text-text-secondary">{systemConfig?.serverId || 'srv-001'}</span></span>
            <span className="text-border-subtle">•</span>
            <span>Uplink Node: <span className="text-emerald-600 font-semibold uppercase">{health?.cloudSync === 'STABLE' ? 'Nominal' : 'Operational'}</span></span>
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setBroadcastActive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <Radio size={14} className="animate-pulse" />
            <span>Broadcast Directive</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Predictive Warning Injection */}
        {highValueWarnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-4">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-amber-500 font-bold text-sm uppercase tracking-wider">Action Required</h4>
              <p className="text-text-secondary text-sm mt-1">{highValueWarnings.length} high-value deals (&gt;$1k) have been pending for over 2 hours. Immediate review recommended.</p>
            </div>
          </div>
        )}

        {/* Operational Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          
          {/* Left Column: Approvals */}
          <div className="lg:col-span-2 bg-surface-main border border-border-subtle rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-subtle flex items-center justify-between bg-surface-alt/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-blue-500" size={20} />
                <h2 className="text-text-primary font-bold text-sm uppercase tracking-widest">Pending Approvals</h2>
              </div>
              <div className="text-xs font-bold px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg">
                {pendingSales.length} PENDING
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {pendingSales.map((sale: Sale) => {
                const agent = users.find((u: User) => u.id === sale.agentId);
                const isProcessing = processingSales.has(sale.id);
                return (
                  <div key={sale.id} className="group relative bg-surface-main hover:bg-surface-alt border border-transparent hover:border-border-strong/50 rounded-xl p-4 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-alt/50 flex items-center justify-center text-text-muted font-bold text-sm">
                        {sale.customer.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-text-primary font-bold">{sale.customer}</div>
                        <div className="text-xs text-text-muted mt-0.5">Rep: <span className="text-text-muted">{agent?.name}</span> • {new Date(sale.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-emerald-600 font-bold text-lg">${sale.amount.toLocaleString()}</div>
                        <div className="text-xs text-text-muted">{sale.product}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="relative">
                          {declineContext.show && declineContext.id === sale.id && (
                            <div className="absolute right-0 top-12 w-64 bg-surface-main border border-border-subtle shadow-xl rounded-xl p-3 z-50 animate-in fade-in zoom-in-95">
                              <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Quick Reject Reason</h4>
                              <div className="space-y-1">
                                {QUICK_REJECTION_REASONS.map(reason => (
                                  <button
                                    key={reason}
                                    onClick={() => { setDeclineReason(reason); handleDecline(sale.id); }}
                                    className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                                  >
                                    {reason}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          <button 
                            disabled={isProcessing}
                            onClick={() => setDeclineContext({ id: sale.id, show: true })}
                            className="p-2 bg-surface-alt/50 hover:bg-rose-50 text-text-muted hover:text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                        <button 
                          disabled={isProcessing}
                          onClick={() => handleApprove(sale.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Approve
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {pendingSales.length === 0 && (
                <div className="h-full flex items-center justify-center text-text-muted text-sm">
                  No pending approvals. Queue is clear.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Agent Pulse */}
          <div className="bg-surface-main border border-border-subtle rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-subtle flex items-center gap-2 bg-surface-alt/80">
              <Activity className="text-emerald-600" size={20} />
              <h2 className="text-text-primary font-bold text-sm uppercase tracking-widest">Agent Availability</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {agents.map((agent: User) => {
                const perf = agentPerformances[agent.id];
                const status = perf?.liveStatus || 'Offline';
                const isWarning = status === 'AFK' || status === 'Break';
                
                return (
                  <div key={agent.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-surface-main border-border-subtle hover:bg-surface-alt'}`}>
                    <div>
                      <div className={`font-bold text-sm ${isWarning ? 'text-amber-500' : 'text-text-primary'}`}>{agent.name}</div>
                      <div className="text-xs text-text-muted mt-1 flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-400' : status === 'Offline' ? 'bg-slate-600' : 'bg-amber-500'}`}></div>
                        {status}
                      </div>
                    </div>
                    {status === 'Active' && (
                      <div className="text-xs font-bold text-emerald-600/70 bg-emerald-400/10 px-2 py-1 rounded">
                        In-Queue
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Performance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-surface-main backdrop-blur-md border border-border-subtle rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Today's Revenue</h3>
              <div className="text-3xl font-black text-emerald-600">${todayRevenue.toLocaleString()}</div>
            </div>
            <div className="h-12 w-48 flex items-end justify-between gap-1 opacity-80">
               
               <div className="flex w-full items-center justify-end">
                  <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">+ Active Pipeline</div>
               </div>
            </div>
          </div>
          
          <div className="bg-surface-main backdrop-blur-md border border-border-subtle rounded-2xl p-4 shadow-sm flex flex-col justify-center gap-3">
            <button 
              onClick={() => setActiveDrawer(activeDrawer === 'audit' ? 'none' : 'audit')}
              className={`w-full p-3 rounded-xl flex items-center justify-between text-sm font-bold transition-colors ${activeDrawer === 'audit' ? 'bg-blue-600 text-white' : 'bg-surface-alt/50 text-text-secondary hover:bg-surface-alt'}`}
            >
              <span className="flex items-center gap-2"><History size={16} /> Audit Explorer</span>
            </button>
            <button 
              onClick={() => setActiveDrawer(activeDrawer === 'scenario' ? 'none' : 'scenario')}
              className={`w-full p-3 rounded-xl flex items-center justify-between text-sm font-bold transition-colors ${activeDrawer === 'scenario' ? 'bg-blue-600 text-white' : 'bg-surface-alt/50 text-text-secondary hover:bg-surface-alt'}`}
            >
              <span className="flex items-center gap-2"><Wrench size={16} /> Scenario Planner</span>
            </button>
          </div>
        </div>

        {/* Pro Tools Drawer */}
        {activeDrawer !== 'none' && (
          <div className="bg-surface-alt/80 backdrop-blur-xl border border-border-subtle rounded-2xl p-6 shadow-sm min-h-[400px]">
            {activeDrawer === 'audit' && <AuditExplorer auditLogs={auditLogs || []} />}
            {activeDrawer === 'scenario' && systemConfig && <ScenarioPlanner sales={sales} users={users} systemConfig={systemConfig} />}
          </div>
        )}

      </div>

      {/* Broadcast Message Modal */}
      {broadcastActive && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface-main border border-border-subtle rounded-2xl w-full max-w-lg p-6 shadow-modal animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Radio size={18} className="animate-pulse" />
                <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">Broadcast Team Directive</h3>
              </div>
              <button 
                onClick={() => setBroadcastActive(false)} 
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-surface-alt transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1.5">Directive Urgency</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastUrgency('Routine')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${broadcastUrgency === 'Routine' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' : 'bg-surface-main border-border-subtle text-text-secondary hover:bg-surface-alt'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Routine</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastUrgency('Immediate')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${broadcastUrgency === 'Immediate' ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'bg-surface-main border-border-subtle text-text-secondary hover:bg-surface-alt'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Immediate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastUrgency('Flash')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${broadcastUrgency === 'Flash' ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-surface-main border-border-subtle text-text-secondary hover:bg-surface-alt'}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Flash Directive</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1.5">Directive Message</label>
                <textarea
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Enter the critical instruction or alert message to be pushed immediately to all live agent terminals..."
                  rows={4}
                  className="w-full bg-surface-alt border border-border-subtle rounded-xl p-3 text-xs text-text-primary focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary placeholder-text-muted transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setBroadcastActive(false)}
                className="px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt border border-transparent rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingBroadcast || !broadcastText.trim()}
                onClick={handleSendBroadcast}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center gap-2"
              >
                {isSendingBroadcast ? 'Pulsing...' : 'Publish Directive'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
