
import React from 'react';
import { Sale, PipelineStage } from '../../types';
import { Badge } from '../../components/ui/Base';
import { PipelineCard } from './PipelineCard';
import { User, Calendar, Clock, AlertCircle, DollarSign, Layers, ArrowDown } from 'lucide-react';

interface PipelineColumnProps {
    index?: number;
    totalColumns?: number;
    stage: string;
    sales: Sale[];
    totalValue: number;
    focusMode: boolean;
    isDragOver: boolean;
    onDrop: (e: React.DragEvent, stage: PipelineStage) => void;
    onDragOver: (e: React.DragEvent, stage: string) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onProcessSale?: (sale: Sale) => void;
}

const STAGE_CONFIG: Record<string, { color: string, bg: string, label: string, icon: any, strategy: string, accent: string }> = {
    'Cold Lead': { color: 'text-blue-500', bg: 'bg-blue-500/10', accent: 'border-blue-500/20', label: 'Inbound / Queue', icon: User, strategy: 'Speed: Dial immediately.' },
    'Pitching': { color: 'text-purple-500', bg: 'bg-purple-500/10', accent: 'border-purple-500/20', label: 'On The Phone', icon: Clock, strategy: 'Execution: 1-Call Close focus.' },
    'Rebuttal': { color: 'text-rose-500', bg: 'bg-rose-500/10', accent: 'border-rose-500/20', label: 'Overcoming Objections', icon: AlertCircle, strategy: 'Persistence: Loop until yes or firm no.' },
    'Closed Won': { color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: 'border-emerald-500/20', label: 'Payment Collected', icon: DollarSign, strategy: 'Growth: Cross-sell & Retention.' },
    'Closed Lost': { color: 'text-text-muted', bg: 'bg-surface-alt', accent: 'border-border-subtle', label: 'Archived Lead', icon: Calendar, strategy: 'Archived / Ghosted.' },
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

export const PipelineColumn = React.memo<PipelineColumnProps>(({ 
    stage, sales, totalValue, focusMode, isDragOver, index = 0, totalColumns = 1, 
    onDrop, onDragOver, onDragLeave, onDragStart, onProcessSale 
}) => {
    
    if (focusMode && sales.length === 0 && !isDragOver) return null;

    const config = STAGE_CONFIG[stage] || STAGE_CONFIG['Cold Lead'];
    const StageIcon = config.icon;
    const volumeIntensity = Math.min(100, (totalValue / 10000) * 100);

    return (
        <div 
            className={`
                flex-shrink-0 w-72 flex flex-col h-full snap-center rounded-[1.25rem] transform-gpu transition-all duration-200
                ${isDragOver 
                    ? `bg-indigo-600/10 ring-2 ring-accent-primary/50 scale-[1.01] shadow-xl z-20` 
                    : 'bg-surface-main/40 border border-border-subtle hover:bg-surface-main/60'
                }
            `}
            onDrop={(e) => onDrop(e, stage as PipelineStage)}
            onDragOver={(e) => onDragOver(e, stage)}
            onDragLeave={onDragLeave}
        >
            <div className="mb-1.5 p-0 sticky top-0 z-20 bg-inherit">
                <div 
                    className={`p-3 pb-4 border-b-2 ${config.bg} ${config.accent} relative overflow-hidden transition-all group`}
                    style={{
                        clipPath: `polygon(${index === 0 ? '0 0' : '12px 50%, 0 0'}, ${index === totalColumns - 1 ? '100% 0, 100% 100%' : 'calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%'}, ${index === 0 ? '0 100%' : '0 100%, 12px 50%'})`,
                        paddingLeft: index === 0 ? '12px' : '24px',
                        paddingRight: '20px'
                    }}
                >
                    <div className="flex justify-between items-center mb-1.5 relative z-10">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-lg bg-surface-main/80  ${config.color} shadow-sm`}>
                                <StageIcon size={16} strokeWidth={3} />
                            </div>
                            <h3 className={`text-sm font-medium  tracking-tight ${config.color} truncate max-w-[110px]`}>
                                {stage}
                            </h3>
                        </div>
                        <Badge status="Mid" className="shadow-none bg-surface-main/50 border-transparent text-xs font-medium px-1.5 py-0 h-auto min-w-[20px] justify-center">
                            {sales.length}
                        </Badge>
                    </div>

                    <div className="flex justify-between items-end relative z-10 pl-0.5">
                        <p className="text-xs font-bold text-text-muted truncate max-w-[130px] opacity-80">
                            {config.strategy}
                        </p>
                        <div className="text-xs font-medium text-text-primary bg-surface-main/40 px-3 py-1.5 rounded border border-border-subtle num-font">
                            {formatCurrency(totalValue)}
                        </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20 w-full">
                        <div 
                            className="h-full bg-current opacity-60 transition-all duration-1000 ease-out" 
                            style={{ width: `${volumeIntensity}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2.5 custom-scrollbar min-h-[100px]">
                {sales.map(sale => (
                    <PipelineCard 
                        key={sale.id} 
                        sale={sale} 
                        onOpen={onProcessSale} 
                        onDragStart={onDragStart}
                    />
                ))}
                
                {(sales.length === 0 || isDragOver) && (
                    <div className={`
                        h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-text-muted transition-all duration-300
                        ${isDragOver 
                            ? 'border-indigo-600/50 bg-indigo-600/5 opacity-100 scale-100' 
                            : 'border-border-subtle/40 opacity-40 scale-95'
                        }
                    `}>
                        {isDragOver ? (
                            <div className="flex flex-col items-center animate-bounce">
                                <ArrowDown size={24} className="mb-2 text-indigo-600"/>
                                <span className="text-xs font-medium  tracking-wide text-indigo-600">Release to Move</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Layers size={24} className="mb-2 opacity-50"/>
                                <span className="text-xs font-medium  tracking-wide">No Active Deals</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
