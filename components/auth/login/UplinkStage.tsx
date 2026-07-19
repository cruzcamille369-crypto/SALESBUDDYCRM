import React, { useState } from 'react';
import { Globe, ArrowRight, ArrowLeft, Loader2, User as UserIcon } from 'lucide-react';
import { LoginInput } from './LoginInput';

interface UplinkStageProps {
    userId: string;
    onBack: () => void;
    onSubmit: (cid: string) => void;
    isProcessing: boolean;
}

export const UplinkStage: React.FC<UplinkStageProps> = ({ userId, onBack, onSubmit, isProcessing }) => {
    const [companyId, setCompanyId] = useState('srv-001'); // Provide helpful default
    const [activeField, setActiveField] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (companyId) onSubmit(companyId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            
            <div className="p-4 rounded-[14px] bg-indigo-50/40 border border-indigo-100/60 flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100/50 rounded-lg shadow-sm border border-indigo-200/50 text-indigo-600">
                        <UserIcon size={16} strokeWidth={2} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-text-primary tracking-wide">{userId}</p>
                        <p className="text-[11px] text-indigo-600 font-semibold uppercase tracking-wider mt-0.5">Verified Account</p>
                    </div>
                </div>
                <button type="button" onClick={onBack} className="text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold px-3 py-1.5 hover:bg-indigo-50 rounded-lg">
                    Change
                </button>
            </div>

            <div className="space-y-4">
                <LoginInput 
                    icon={Globe} 
                    value={companyId} 
                    onChange={(e) => setCompanyId(e.target.value)} 
                    onFocus={() => setActiveField('cid')}
                    onBlur={() => setActiveField(null)}
                    isActive={activeField === 'cid'}
                    placeholder="Organization ID (e.g., srv-001)" 
                    autoFocus
                    disabled={isProcessing}
                />
            </div>

            <div className="flex gap-3 pt-2">
                <button 
                    type="button" 
                    onClick={onBack}
                    className="h-12 w-14 p-0 flex items-center justify-center rounded-[14px] bg-surface-alt text-text-secondary hover:bg-surface-alt/50 hover:text-text-primary transition-colors border border-border-subtle hover:border-border-strong"
                    disabled={isProcessing}
                >
                    <ArrowLeft size={18} />
                </button>
                <button 
                    type="submit" 
                    disabled={isProcessing || !companyId}
                    className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[14px] transition-all shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <><Loader2 size={16} className="animate-spin" /> Accessing...</>
                    ) : (
                        <>Access Workspace <ArrowRight size={16} strokeWidth={2.5} /></>
                    )}
                </button>
            </div>
        </form>
    );
};
