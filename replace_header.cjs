const fs = require('fs');
let code = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

const target = `                <header 
                    className="h-[48px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-500"
                    style={currentThemeStyle}
                >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">`;

const replacement = `                <header 
                    className="h-[56px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-500"
                    style={currentThemeStyle}
                >
                    {/* LEFT: TITLE & SERVER */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink w-1/4">`;

code = code.replace(target, replacement);

const target2 = `                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {headerContent}
                        
                        <div className="flex items-center gap-3 shrink-0 min-w-0">`;

const replacement2 = `                    </div>
                    
                    {/* CENTER: SEARCH PILL */}
                    <div className="hidden md:flex items-center justify-center w-2/4 px-4">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-header-text/40 group-focus-within:text-header-accent transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search..."
                                className="w-full h-9 pl-9 pr-4 bg-header-text/5 hover:bg-header-text/10 focus:bg-surface-main focus:text-text-primary text-header-text border border-header-border rounded-full text-sm outline-none transition-all placeholder:text-header-text/40"
                            />
                        </div>
                    </div>

                    {/* RIGHT: UTILITIES & AVATAR */}
                    <div className="flex items-center justify-end gap-2 sm:gap-4 w-1/4">
                        {headerContent}
                        
                        <div className="flex items-center gap-3 shrink-0 min-w-0 ml-2">`;

code = code.replace(target2, replacement2);

fs.writeFileSync('components/layout/PortalShell.tsx', code);
