const fs = require('fs');
let code = fs.readFileSync('components/layout/PortalShell.tsx', 'utf8');

const oldHeaderStart = `<header 
                    className="h-[48px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-500"
                    style={currentThemeStyle}
                >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">`;

const newHeaderStart = `<header 
                    className="h-[56px] px-4 sm:px-6 flex items-center justify-between bg-header-bg border-b border-header-border text-header-text shrink-0 z-[50] transition-all duration-500"
                    style={currentThemeStyle}
                >
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink w-[25%]">`;

code = code.replace(oldHeaderStart, newHeaderStart);

const oldHeaderEnd = `                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {headerContent}
                        <div className="flex items-center gap-3 shrink-0 min-w-0">`;

const newHeaderEnd = `                    </div>

                    <div className="hidden md:flex flex-1 items-center justify-center px-4">
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-header-text/40 group-focus-within:text-header-accent transition-colors" size={16} />
                            <input 
                                type="text"
                                placeholder="Search everything..."
                                className="w-full h-9 pl-9 pr-4 bg-header-text/5 hover:bg-header-text/10 focus:bg-surface-main focus:text-text-primary text-header-text border border-header-border rounded-full text-sm outline-none transition-all placeholder:text-header-text/40"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 sm:gap-4 min-w-0 w-[25%]">
                        {headerContent}
                        <div className="flex items-center gap-3 shrink-0 min-w-0 ml-2">`;

code = code.replace(oldHeaderEnd, newHeaderEnd);

const oldAvatar = `                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>`;

const newAvatar = `                                    </button>
                                </div>
                            )}

                            <button 
                                onClick={handleLogout}
                                className="w-8 h-8 ml-2 rounded-full bg-header-accent/20 flex items-center justify-center text-header-accent font-bold hover:scale-105 hover:bg-rose-500 hover:text-white transition-all shrink-0 border border-header-accent/30"
                                title="Log Out"
                            >
                                {(user.name || user.id || 'U').charAt(0).toUpperCase()}
                            </button>
                        </div>
                    </div>
                </header>`;

code = code.replace(oldAvatar, newAvatar);

fs.writeFileSync('components/layout/PortalShell.tsx', code);
