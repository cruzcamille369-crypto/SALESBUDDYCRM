import React from 'react';
import { Phone, Copy, MessageSquare, Ticket, FileText, Clock, Shield } from 'lucide-react';
import { executeDialer } from '../../../lib/dialer';
import { useCRM } from '../../../hooks/useCRM';

interface CustomerDossierProps {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    localTime?: string;
    tier?: string;
    onAction: (action: string) => void;
    compact?: boolean;
}

export const CustomerDossier: React.FC<CustomerDossierProps> = ({
    name, phone, email, address, localTime, tier, onAction, compact = false
}) => {
    const { systemConfig } = useCRM();

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className={`bg-surface-main border border-border-strong rounded-2xl ${compact ? 'p-4' : 'p-6'} flex flex-col gap-6 shadow-sm relative overflow-hidden group`}>
            {/* Top decorative edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-transparent opacity-50" />
            
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl shadow-inner">
                        {name.charAt(0)}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight leading-none mb-1.5">{name}</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            {tier && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                                    <Shield size={12}/> {tier}
                                </span>
                            )}
                            {localTime && (
                                <span className="text-[10px] font-bold text-text-muted bg-surface-alt px-2 py-0.5 rounded-full border border-border-subtle flex items-center gap-1">
                                    <Clock size={12}/> {localTime} Local
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Contact Quick view */}
                <div className="flex flex-col gap-1 items-end text-right">
                    <div className="flex items-center gap-2 group/item cursor-pointer hover:bg-surface-alt px-2 py-1 rounded-lg transition-colors" onClick={() => handleCopy(phone)}>
                        <span className="text-sm font-mono font-bold text-text-primary">{phone}</span>
                        <Copy size={12} className="text-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                    {email && (
                        <div className="flex items-center gap-2 group/item cursor-pointer hover:bg-surface-alt px-2 py-1 rounded-lg transition-colors" onClick={() => handleCopy(email)}>
                            <span className="text-xs font-medium text-text-secondary">{email}</span>
                            <Copy size={12} className="text-text-muted opacity-0 group-hover/item:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border-subtle overflow-x-auto custom-scrollbar pb-1">
                <button 
                    onClick={() => { executeDialer(phone, { customerName: name } as any, systemConfig); onAction('call'); }}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 py-2 px-3 rounded-lg text-xs font-bold transition-all"
                >
                    <Phone size={14} /> Call
                </button>
                <button 
                    onClick={() => onAction('sms')}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 py-2 px-3 rounded-lg text-xs font-bold transition-all"
                >
                    <MessageSquare size={14} /> SMS
                </button>
                <button 
                    onClick={() => onAction('enroll')}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 py-2 px-3 rounded-lg text-xs font-bold transition-all"
                >
                    <Ticket size={14} /> Enroll
                </button>
                <button 
                    onClick={() => onAction('note')}
                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-surface-alt hover:bg-border-subtle text-text-muted hover:text-text-primary border border-border-subtle rounded-lg transition-all"
                    title="Add Note"
                >
                    <FileText size={14} />
                </button>
            </div>
        </div>
    );
};
