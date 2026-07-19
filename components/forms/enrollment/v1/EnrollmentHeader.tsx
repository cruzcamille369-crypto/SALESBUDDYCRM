import React from 'react';
import { ShoppingCart, Lock, Clock, RefreshCw } from 'lucide-react';

interface EnrollmentHeaderProps {
  manualAmount: string;
  customerTime: string | null;
  onClear: () => void;
}

export const EnrollmentHeader: React.FC<EnrollmentHeaderProps> = ({
  manualAmount,
  customerTime,
  onClear,
}) => {
  return (
    <div className="bg-surface-main border-b border-border-subtle px-3 py-2 shadow-sm flex items-center justify-between shrink-0 h-12 relative z-20">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-indigo-600/10 rounded-lg text-indigo-600 border border-indigo-600/20 shadow-neon">
          <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-primary tracking-tight">Sales Entry</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-semibold text-indigo-600 tracking-wide bg-indigo-600/5 px-3 py-1.5 rounded border border-indigo-600/10 flex items-center gap-1">
              <Lock size={16} /> Data Entry V1
            </span>
            {customerTime && (
              <span className="text-sm font-mono text-text-muted bg-surface-alt px-3 py-1.5 rounded border border-border-subtle flex items-center gap-1 animate-in fade-in">
                <Clock size={16} /> {customerTime}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-surface-alt/50 p-1 rounded-lg border border-border-subtle shadow-inner">
          <div className="px-2 border-r border-border-subtle">
            <p className="text-sm font-bold text-text-muted tracking-wider">Order Total</p>
            <p className="text-sm font-bold text-emerald-500 num-font">
              ${parseFloat(manualAmount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="h-8 w-8 p-0 flex items-center justify-center bg-surface-alt border border-border-subtle rounded-lg text-text-muted hover:text-rose-500 hover:border-rose-500/30 transition-all"
          title="Clear form"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
};
