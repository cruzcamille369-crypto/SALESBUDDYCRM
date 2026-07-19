const fs = require('fs');

let code = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

code = code.replace(
    'w-[200px] z-20',
    'w-[72px] items-center z-20'
);

code = code.replace(
    '<span className="font-bold text-sm tracking-wide text-sidebar-text truncate">Braveheart</span>',
    '{/* <span className="font-bold text-sm tracking-wide text-sidebar-text truncate">Braveheart</span> */}'
);

code = code.replace(
    '<div className="h-[48px] px-4 flex items-center justify-start gap-3 border-b border-sidebar-border shrink-0 bg-transparent">',
    '<div className="h-[56px] w-full flex items-center justify-center border-b border-sidebar-border shrink-0 bg-transparent">'
);

code = code.replace(
    '<nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">',
    '<nav className="flex-1 w-full px-2 py-4 space-y-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent flex flex-col items-center">'
);

const oldFooter = `<div className="p-4 border-t border-sidebar-border bg-transparent flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div 
                            className="w-8 h-8 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-sidebar-accent font-bold shrink-0"
                        >
                            {(user.name || user.id || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-sidebar-text truncate leading-tight">{user.name || user.id}</span>
                            <span className="text-[10px] text-sidebar-text-muted uppercase tracking-wider truncate">{user.role}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout} 
                        className="p-1.5 flex items-center justify-center text-sidebar-text-muted hover:text-sidebar-text hover:bg-sidebar-accent/10 transition-all rounded-lg group shrink-0"
                        title="Log Out"
                    >
                        <LogOut size={16} className="group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>`;

const newFooter = `<div className="py-4 border-t border-sidebar-border bg-transparent w-full flex flex-col items-center justify-center gap-3">
                    {/* User initial only */}
                    <div 
                        className="w-10 h-10 rounded-full bg-sidebar-accent/20 flex items-center justify-center text-sidebar-accent font-bold shrink-0 shadow-sm"
                        title={user.name || user.id}
                    >
                        {(user.name || user.id || 'U').charAt(0).toUpperCase()}
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="w-10 h-10 flex items-center justify-center text-sidebar-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-all rounded-xl group shrink-0"
                        title="Log Out"
                    >
                        <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>`;

code = code.replace(oldFooter, newFooter);

fs.writeFileSync('components/layout/PortalShell.tsx', code);

let agentSb = fs.readFileSync('components/agent/AgentSidebar.tsx', 'utf8');
agentSb = agentSb.replace('<TabList className="flex flex-col gap-1 border-none mt-2 pb-2 px-2">', '<TabList isCollapsed={true} className="flex flex-col gap-2 w-full border-none mt-2 pb-2 px-0 items-center">');
fs.writeFileSync('components/agent/AgentSidebar.tsx', agentSb);

let adminSb = fs.readFileSync('components/admin/AdminSidebarContent.tsx', 'utf8');
adminSb = adminSb.replace('<TabList className="flex flex-col gap-1 border-none mb-3 px-2">', '<TabList isCollapsed={true} className="flex flex-col gap-2 w-full border-none mb-3 px-0 items-center">');
fs.writeFileSync('components/admin/AdminSidebarContent.tsx', adminSb);

