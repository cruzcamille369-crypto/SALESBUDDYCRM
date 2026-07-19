
import { Bell, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { Note } from '../../types';
import { Badge } from '../ui/Base';

interface LeadListItemProps {
    lead: Note;
    isSelected: boolean;
    isOverdue: boolean;
    now: number;
    onSelect: (id: string) => void;
}

export const LeadListItem: React.FC<LeadListItemProps> = ({ lead, isSelected, isOverdue, now, onSelect }) => {
    const hasReminder = lead.reminderAt && !lead.reminderDismissed;
    const isReminderOverdue = hasReminder && lead.reminderAt! < now;

    return (
        <div 
            onClick={() => onSelect(lead.id)}
            className={`p-3 rounded-xl cursor-pointer border transition-all group relative overflow-hidden ${isSelected ? 'bg-surface-main border-indigo-600 shadow-md' : 'bg-transparent border-transparent hover:bg-surface-alt hover:border-border-subtle'}`}
        >
            {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>}
            {hasReminder && (
                <div className={`absolute right-0 top-0 p-1.5 ${isReminderOverdue ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`}>
                    <Bell size={16} fill="currentColor" />
                </div>
            )}
            
            <div className="flex justify-between items-start mb-1 pl-2">
                <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>{lead.customerName}</h4>
                <span className={`text-xs font-mono font-bold ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-text-muted'}`}>
                    {new Date(lead.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </span>
            </div>
            
            <div className="flex flex-col gap-1.5 pl-2 mt-1">
                <div className="flex items-center gap-2">
                <Badge status={lead.priority} className="scale-75 origin-left shadow-none" />
                <span className="text-xs text-text-muted truncate max-w-[120px]">{lead.reason}</span>
            </div>
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mt-1 pt-2 border-t border-border-subtle/30">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Quick Actions</span>
                    <div className="flex gap-1">
                        <button className="p-1 rounded bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="Call">
                            <Phone size={14} />
                        </button>
                        <button className="p-1 rounded bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors" title="SMS">
                            <MessageSquare size={14} />
                        </button>
                        <button className="p-1 rounded bg-surface-alt text-text-muted hover:bg-text-primary hover:text-surface-main transition-colors" title="Mark Resolved">
                            <CheckCircle size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
