/**
 * Module: Sales_Approval_Terminal | File: /components/admin/dashboard/DashboardApprovalPanel.tsx
 * 
 * High-performance, cloud-synced CRM approval panel for pending deals.
 * Restricts actions based on role clearance (Agent = View Only, Admin = Full Authority),
 * and enforces mandatory disposition reasons for decline/send back workflows.
 */
import React, { useMemo, useState } from 'react';
import { Sale, User } from '../../../types';
import { CheckCircle2, XCircle, Eye, Clock, AlertTriangle, PartyPopper } from 'lucide-react';
import { decryptField, ENCRYPTION_KEY } from '../../../lib/encryption';
import { useCRM } from '../../../hooks/useCRM';

interface DashboardApprovalPanelProps {
  sales: Sale[];
  users: User[];
  onApprove: (saleId: string) => void;
  onDecline: (saleId: string, reason: string, status: 'Declined' | 'Cancelled') => void;
}

const BANK_DECLINE_OPTIONS = [
  "Wrong CVV",
  "Bank Auth Failed",
  "Do Not Honor",
  "Wrong Billing/Zip"
];

const COMPANY_RULE_OPTIONS = [
  "Last Order Pending",
  "Customer Cancelled",
  "Blacklisted",
  "Order Too Soon",
  "FDNC List"
];

export const DashboardApprovalPanel: React.FC<DashboardApprovalPanelProps> = ({
  sales,
  users,
  onApprove,
  onDecline,
}) => {
  const { currentUser, updateSale, logAudit } = useCRM();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'disputes'>('pending');
  
  // Track selected decline reason per sale ID
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});
  // Track custom decline reason text per sale ID
  const [customReasons, setCustomReasons] = useState<Record<string, string>>({});

  const isAgent = currentUser?.role === 'agent';

  const pendingSales = useMemo(() => {
    return sales
      .filter((s) => s.status === 'Pending')
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
      .slice(0, 10);
  }, [sales]);

  const disputedSales = useMemo(() => {
    return sales
      .filter((s) => s.isDisputed === true)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [sales]);

  const getAgentName = (agentId: string) => {
    return users.find((u) => u.id === agentId)?.name || 'Unknown';
  };

  const getTimeAgo = (timestamp: number) => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (pendingSales.length === 0 && disputedSales.length === 0) {
    return (
      <div className="bg-surface-main/60 dark:bg-surface-main/40 backdrop-blur-2xl rounded-[32px] p-8 border border-border-subtle/60 dark:border-border-subtle/20 text-center shadow-sm h-full flex flex-col justify-center items-center group transition-all hover:shadow-float">
        <PartyPopper className="mx-auto text-indigo-600 mb-3 transition-transform group-hover:scale-125 duration-500" size={48} />
        <p className="text-xl font-bold text-text-primary mb-1">You're all caught up!</p>
        <p className="text-sm text-text-muted">No pending approvals or dispute audits to worry about. Go have a snack.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-main/60 dark:bg-surface-main/40 backdrop-blur-2xl rounded-[32px] border border-border-subtle/60 dark:border-border-subtle/20 overflow-hidden shadow-sm transition-all hover:shadow-float flex flex-col min-h-[400px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-5 relative overflow-hidden shrink-0">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-surface-main/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-surface-main/20 rounded-2xl">
              <Clock className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Incentives & Approvals</h3>
            <p className="text-sm text-white/80 font-medium">
              {pendingSales.length} pending deals • {disputedSales.length} payroll disputes waiting
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-border-subtle bg-surface-alt/40 shrink-0">
        <button
          onClick={() => { setActiveSubTab('pending'); setExpandedId(null); }}
          className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'pending'
              ? 'bg-surface-main text-indigo-600 border-b-2 border-indigo-600'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-alt/90'
          }`}
        >
          Pending Deals ({pendingSales.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('disputes'); setExpandedId(null); }}
          className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-widest transition-all ${
            activeSubTab === 'disputes'
              ? 'bg-surface-main text-amber-500 border-b-2 border-amber-500'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-alt/90'
          }`}
        >
          Dispute Audits ({disputedSales.length})
        </button>
      </div>

      {/* Sales List Tab */}
      {activeSubTab === 'pending' && (
        <div className="divide-y divide-border-subtle flex-1 overflow-y-auto">
          {pendingSales.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <PartyPopper className="mx-auto text-indigo-600 mb-3" size={32} />
              <p className="font-bold text-sm text-text-primary">No pending approvals</p>
              <p className="text-xs text-text-muted mt-1">All sales deals have been successfully processed.</p>
            </div>
          ) : (
            pendingSales.map((sale, idx) => {
              const selectedReason = declineReasons[sale.id] || '';
              const customReason = customReasons[sale.id] || '';
              const isDeclineValid = selectedReason !== '' && (selectedReason !== 'Other' || customReason.trim().length > 0);
              const finalDeclineReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;

              return (
                <div key={sale.id} className="p-4 hover:bg-surface-main/80 transition-colors group/item font-sans">
                  {/* Main Row */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-xs font-bold text-text-muted group-hover/item:bg-indigo-600/10 group-hover/item:text-indigo-600 transition-colors">
                            {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary truncate tracking-tight">{sale.customer}</p>
                          <p className="text-sm font-medium text-text-muted">
                            {getAgentName(sale.agentId!)} • {getTimeAgo(sale.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-500">${sale.amount}</p>
                        <p className="text-xs font-medium text-text-muted bg-surface-alt px-2 py-0.5 rounded-full inline-block mt-0.5">{sale.product}</p>
                      </div>
                      <div className={`p-2 rounded-xl transition-colors ${expandedId === sale.id ? 'bg-indigo-600/10 text-indigo-600' : 'bg-surface-alt text-text-muted group-hover/item:bg-surface-main group-hover/item:text-text-primary'}`}>
                          <Eye className="flex-shrink-0" size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === sale.id && (
                    <div className="mt-4 pt-4 border-t border-border-subtle space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      {sale.declineReason && (
                        <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20 flex gap-3">
                          <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
                          <div>
                              <p className="text-sm font-bold text-amber-500 mb-0.5">Previous Issue:</p>
                              <p className="text-sm font-medium text-amber-500/80">{sale.declineReason}</p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm bg-surface-main p-4 rounded-2xl border border-border-subtle">
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Phone</p>
                          <p className="font-medium text-text-primary">{sale.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">CC #</p>
                          <p className="font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded inline-block">{decryptField(sale.cardNumber, ENCRYPTION_KEY) || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">State</p>
                          <p className="font-medium text-text-primary">{sale.state || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">CVV / EXP</p>
                          <p className="font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded inline-block">{decryptField(sale.cardCvv, ENCRYPTION_KEY) || '***'} / {sale.cardExpiry || '—'}</p>
                        </div>
                      </div>

                      {/* Mandatory Decline Dispositions Dropdown/Input Section (Visible to Admins only) */}
                      {!isAgent && (
                        <div className="bg-rose-500/5 p-4 rounded-2xl border border-rose-500/10 space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="text-rose-500" size={16} />
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Decline Disposition Code Required</span>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-text-muted">Disposition Reason *</label>
                            <select
                              id={`decline-reason-${sale.id}`}
                              value={selectedReason}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDeclineReasons(prev => ({ ...prev, [sale.id]: val }));
                              }}
                              className="w-full h-10 px-3 bg-surface-alt border border-border-subtle text-text-primary focus:border-rose-500/50 focus:ring-1 focus:ring-status-error/30 rounded-xl font-medium text-sm outline-none"
                            >
                              <option value="">-- Choose a reason --</option>
                              <optgroup label="Bank Decline Options">
                                {BANK_DECLINE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Company Rule Options">
                                {COMPANY_RULE_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </optgroup>
                              <option value="Other">Other (Custom Reason)</option>
                            </select>
                          </div>

                          {selectedReason === 'Other' && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              <label className="text-xs font-semibold text-text-muted">Specify Custom Reason *</label>
                              <input
                                id={`decline-custom-reason-${sale.id}`}
                                type="text"
                                placeholder="Type custom reason here..."
                                value={customReason}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setCustomReasons(prev => ({ ...prev, [sale.id]: val }));
                                }}
                                className="w-full h-10 px-3 bg-surface-alt border border-border-subtle text-text-primary focus:border-rose-500/50 focus:ring-1 focus:ring-status-error/30 rounded-xl font-medium text-sm outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          id={`approve-btn-${sale.id}`}
                          disabled={isAgent}
                          onClick={(e) => { e.stopPropagation(); onApprove(sale.id); }}
                          className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isAgent
                              ? 'bg-surface-alt border border-border-subtle text-text-muted cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg'
                          }`}
                        >
                          <CheckCircle2 size={18} /> {isAgent ? 'Approved (Admin Only)' : 'Approve!'}
                        </button>
                        <button
                          id={`decline-btn-${sale.id}`}
                          disabled={isAgent || !isDeclineValid}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isDeclineValid && finalDeclineReason) {
                              onDecline(sale.id, finalDeclineReason, 'Declined');
                            }
                          }}
                          className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isAgent
                              ? 'bg-surface-alt border border-border-subtle text-text-muted cursor-not-allowed'
                              : isDeclineValid
                                ? 'bg-rose-500 hover:bg-rose-500/90 text-white shadow-md hover:shadow-lg'
                                : 'bg-surface-alt border border-border-subtle text-text-muted cursor-not-allowed'
                          }`}
                        >
                          <XCircle size={18} /> {isAgent ? 'Decline (Admin Only)' : 'Send Back'}
                        </button>
                      </div>
                      
                      {!isAgent && !isDeclineValid && (
                        <p className="text-xs text-rose-500/80 font-medium text-center">
                          * Please specify a decline reason to enable sending back.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Disputes Tab */}
      {activeSubTab === 'disputes' && (
        <div className="divide-y divide-border-subtle flex-1 overflow-y-auto">
          {disputedSales.length === 0 ? (
            <div className="p-12 text-center text-text-muted">
              <PartyPopper className="mx-auto text-emerald-500 mb-3" size={32} />
              <p className="font-bold text-sm text-text-primary">No Pending Disputes</p>
              <p className="text-xs text-text-muted mt-1">All agent payout audit requests are completely resolved.</p>
            </div>
          ) : (
            disputedSales.map((sale, idx) => {
              return (
                <div key={sale.id} className="p-4 hover:bg-surface-main/80 transition-colors group/item font-sans">
                  {/* Main Dispute Row */}
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-bold">
                          <AlertTriangle size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary truncate tracking-tight">{sale.customer}</p>
                          <p className="text-sm font-medium text-text-muted">
                            {getAgentName(sale.agentId!)} • Filed {getTimeAgo(sale.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-500">${sale.amount}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full inline-block mt-0.5 animate-pulse border border-amber-500/20">Pending Audit</span>
                      </div>
                      <div className={`p-2 rounded-xl transition-colors ${expandedId === sale.id ? 'bg-amber-500/10 text-amber-500' : 'bg-surface-alt text-text-muted hover:bg-surface-main'}`}>
                        <Eye size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Dispute Details */}
                  {expandedId === sale.id && (
                    <div className="mt-4 pt-4 border-t border-border-subtle space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                      <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 space-y-1">
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Agent Dispute Reason:</p>
                        <p className="text-sm font-semibold text-text-primary italic">"{sale.disputeReason || 'No reason specified.'}"</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm bg-surface-main p-4 rounded-2xl border border-border-subtle">
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Product Name</p>
                          <p className="font-semibold text-text-primary">{sale.product || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Phone Number</p>
                          <p className="font-mono text-text-primary">{sale.phone || '—'}</p>
                        </div>
                      </div>

                      {/* Dispute Audit Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          disabled={isAgent}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!updateSale) return;
                            await updateSale(sale.id, { isDisputed: false, disputeStatus: 'Resolved' });
                            if (logAudit) {
                              await logAudit({
                                action: 'PAYROLL_DISPUTE_RESOLVED',
                                details: `Admin resolved payroll dispute for Sale ID ${sale.id}`,
                                module: 'FINANCIALS'
                              });
                            }
                            setExpandedId(null);
                          }}
                          className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isAgent
                              ? 'bg-surface-alt border border-border-subtle text-text-muted cursor-not-allowed'
                              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md'
                          }`}
                        >
                          <CheckCircle2 size={18} /> Resolve & Approve Dispute
                        </button>
                        <button
                          disabled={isAgent}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!updateSale) return;
                            await updateSale(sale.id, { isDisputed: false, disputeStatus: 'Rejected' });
                            if (logAudit) {
                              await logAudit({
                                action: 'PAYROLL_DISPUTE_REJECTED',
                                details: `Admin rejected payroll dispute for Sale ID ${sale.id}`,
                                module: 'FINANCIALS'
                              });
                            }
                            setExpandedId(null);
                          }}
                          className={`flex-1 p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            isAgent
                              ? 'bg-surface-alt border border-border-subtle text-text-muted cursor-not-allowed'
                              : 'bg-rose-500 hover:bg-rose-500/90 text-white shadow-md'
                          }`}
                        >
                          <XCircle size={18} /> Dismiss Dispute
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
