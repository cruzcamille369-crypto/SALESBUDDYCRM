import React, { useState } from 'react';
import { User as UserIcon, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { LoginInput } from './LoginInput';

interface CredentialsStageProps {
    onSubmit: (u: string, p: string) => void;
    isProcessing: boolean;
}

export const CredentialsStage: React.FC<CredentialsStageProps> = ({ onSubmit, isProcessing }) => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [activeField, setActiveField] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userId && password) onSubmit(userId, password);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
                <LoginInput 
                    icon={UserIcon} 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)} 
                    onFocus={() => setActiveField('user')}
                    onBlur={() => setActiveField(null)}
                    isActive={activeField === 'user'}
                    placeholder="Username" 
                    autoFocus
                    disabled={isProcessing}
                />
                <LoginInput 
                    icon={Lock} 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setActiveField('pass')}
                    onBlur={() => setActiveField(null)}
                    isActive={activeField === 'pass'}
                    placeholder="Password" 
                    disabled={isProcessing}
                />
            </div>

            <button 
                type="submit" 
                disabled={isProcessing || !userId || !password}
                className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-[14px] transition-all shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.25)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
                {isProcessing ? (
                    <><Loader2 size={16} className="animate-spin" /> Authenticating...</>
                ) : (
                    <>Sign In <ArrowRight size={16} strokeWidth={2.5} /></>
                )}
            </button>
        </form>
    );
};
