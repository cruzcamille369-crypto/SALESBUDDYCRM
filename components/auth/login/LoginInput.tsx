import React from 'react';

interface LoginInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: any;
    isActive?: boolean;
    rightElement?: React.ReactNode;
}

export const LoginInput: React.FC<LoginInputProps> = ({ 
    icon: Icon, isActive, rightElement, className = "", ...props 
}) => (
    <div className={`relative group w-full transition-all duration-300 ${isActive ? 'scale-[1.01]' : 'hover:scale-[1.005]'}`}>
        {Icon && (
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 pointer-events-none ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
            </div>
        )}
        <input 
            autoComplete="off" data-lpignore="true" data-prevent-autofill="true" spellCheck={false} 
            {...props}
            className={`
                w-full bg-surface-alt border border-border-subtle rounded-[14px] 
                ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3.5 
                text-sm font-medium text-text-primary outline-none 
                focus:bg-surface-main focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
                transition-all placeholder:text-slate-400 shadow-sm ${className}
            `}
        />
        {rightElement && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {rightElement}
            </div>
        )}
    </div>
);
