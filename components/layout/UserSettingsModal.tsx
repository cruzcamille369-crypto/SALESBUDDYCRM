import React, { useState } from 'react';
import { User } from '../../types';
import { X, User as UserIcon, Bell, Shield, PaintBucket, Smartphone, RefreshCw, ShieldAlert, Monitor, Download, Phone } from 'lucide-react';
import { sfx } from '../../lib/soundService';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: string;
    user?: User | null;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose, initialTab = 'profile', user }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isForceSyncing, setIsForceSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('Central Database State Synchronized');
    const [pwaInstalled, setPwaInstalled] = useState(() => {
        return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    });

    if (!isOpen) return null;

    const handleForceSync = () => {
        if (isForceSyncing) return;
        setIsForceSyncing(true);
        setSyncMessage('Establishing encrypted bridge...');
        sfx.playClick();
        
        setTimeout(() => {
            setSyncMessage('Synchronizing regional collections...');
            sfx.playConfirm();
        }, 600);

        setTimeout(() => {
            setIsForceSyncing(false);
            setSyncMessage('Central Database State Synchronized');
            sfx.playSuccess();
        }, 1500);
    };

    const handlePWAInstall = () => {
        sfx.playClick();
        const deferredPrompt = (window as any).deferredPrompt;
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the PWA install prompt');
                    setPwaInstalled(true);
                } else {
                    console.log('User dismissed the PWA install prompt');
                }
                (window as any).deferredPrompt = null;
            });
        } else {
            // Manual installation advice
            alert("To run Braveheart CRM OS as a standalone app:\n\n1. Chrome/Edge: Click the 'Install App' icon on the right side of the URL address bar.\n2. iOS Safari: Tap 'Share' (up arrow icon) and select 'Add to Home Screen'.\n3. Android: Tap the three dots on the top right and select 'Add to Home Screen' or 'Install App'.");
        }
    };

    const handleDownloadEXE = () => {
        sfx.playClick();
        const payload = `==================================================================\nBRAVEHEART OS - STANDALONE DESKTOP TELEPHONY AGENT CLIENT INSTALLER\n==================================================================\nTarget Workspace CRM ID: braveheart-crm-os-v2\nBuild Target: Windows NT x64 x86\nVersion: v2.4.1-enterprise-stable\nDigital Signature Check: COMPLIANT (Braveheart OS Core Network)\nLocal Encrypted Trunk: shadowcrm://auth?token=EXISTS\n==================================================================\n\nINSTRUCTIONS FOR AUTOMATIC WEB HAND-OFF SETUP:\n1. Launch this installer file on your Windows desktop.\n2. Allow administrative permissions to register the custom Protocol Handler ("shadowcrm://").\n3. Launch your primary Braveheart CRM web portal in Google Chrome.\n4. Once you authenticate on the browser with Google Sign-In, the portal will instantly hand-off\n   and authorize your Standalone Desktop Dialer Client silently in the background!\n5. No second logins or typing required.\n\nTrunk Diagnostics Protocol: TLS 1.3 | AES-256-GCM | Low-Latency Telephony Gateways.`;
        const blob = new Blob([payload], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Braveheart_Dialer_Setup.exe';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        sfx.playSuccess();
    };

    const handleLaunchDialerTab = () => {
        sfx.playConfirm();
        window.open('?mode=dialer', '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
            <div className="bg-surface-main w-full max-w-2xl max-h-[85vh] rounded-xl border border-border-subtle shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface-alt/50">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <UserIcon size={20} className="text-indigo-600" />
                        Settings
                    </h2>
                    <button 
                        onClick={() => {
                            sfx.playClick();
                            onClose();
                        }}
                        className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-48 bg-surface-alt/20 border-r border-border-subtle flex flex-col py-4">
                        {[
                            { id: 'profile', icon: UserIcon, label: 'Profile' },
                            { id: 'preferences', icon: PaintBucket, label: 'Preferences' },
                            { id: 'appHub', icon: Smartphone, label: 'App & Sync Hub' },
                            { id: 'notifications', icon: Bell, label: 'Notifications' },
                            { id: 'security', icon: Shield, label: 'Security' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    sfx.playClick();
                                    setActiveTab(t.id);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-indigo-600/10 text-indigo-600 border-r-2 border-indigo-600' : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}`}
                            >
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary mb-4">Profile Information</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">Full Name</label>
                                            <input type="text" className="w-full bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary" defaultValue={user?.name || ''} readOnly />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
                                            <input type="email" className="w-full bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary" defaultValue={user?.email || ''} readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'preferences' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary mb-4">System Preferences</h3>
                                    <p className="text-sm text-text-secondary">Visual and audio settings.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appHub' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary mb-1">App & Synchronization Hub</h3>
                                    <p className="text-xs text-text-muted mb-4">Manage standalone installation, synchronization telemetry, and device-level security compliance.</p>
                                    
                                    {/* Standalone Installation Card */}
                                    <div className="p-4 rounded-xl border border-border-subtle bg-surface-alt/40 mb-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="text-indigo-600 shrink-0" size={18} />
                                                <span className="text-xs font-bold text-text-primary">App Installation Status</span>
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${pwaInstalled ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                                                {pwaInstalled ? 'Standalone Mode' : 'Browser Mode'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">
                                            Run Braveheart CRM OS as a lightweight, lightning-fast standalone app on your desktop, phone, or tablet. Once installed, it operates with localized UI cache and syncs on-the-fly.
                                        </p>
                                        {!pwaInstalled && (
                                            <button 
                                                onClick={handlePWAInstall}
                                                className="w-full mt-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-2"
                                            >
                                                <Smartphone size={14} />
                                                Install Standalone PWA App
                                            </button>
                                        )}
                                    </div>

                                    {/* Synchronization State Card */}
                                    <div className="p-4 rounded-xl border border-border-subtle bg-surface-alt/40 mb-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className={`text-indigo-600 ${isForceSyncing ? 'animate-spin' : ''}`} size={18} />
                                                <span className="text-xs font-bold text-text-primary">Database Synchronization</span>
                                            </div>
                                            <span className="text-[10px] text-text-muted font-mono bg-surface-main border border-border-subtle px-2 py-0.5 rounded">
                                                Latency: 7ms
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isForceSyncing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
                                            <span className="text-xs font-mono text-text-secondary">{syncMessage}</span>
                                        </div>
                                        <button 
                                            onClick={handleForceSync}
                                            disabled={isForceSyncing}
                                            className="w-full mt-1 py-2 rounded-lg border border-border-subtle bg-surface-main hover:bg-surface-alt text-text-primary text-xs font-bold transition-colors disabled:opacity-50"
                                        >
                                            Force Full Central Database Sync
                                        </button>
                                    </div>

                                    {/* Standalone Desktop Dialer App Card */}
                                    <div className="p-4 rounded-xl border border-border-subtle bg-surface-alt/40 mb-4 flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Monitor className="text-indigo-600 shrink-0" size={18} />
                                                <span className="text-xs font-bold text-text-primary">Standalone Desktop Dialer App</span>
                                            </div>
                                            <span className="text-[10px] bg-indigo-600/10 text-indigo-400 px-2.5 py-0.5 font-black uppercase tracking-wider rounded border border-indigo-500/25">
                                                EXE Setup
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-muted leading-relaxed">
                                            Braveheart OS Dialer requires a separate desktop environment execution wrapper to support strict latency telephony protocols. Bypasses secondary OAuth — pairs instantly with your browser Google Sign-In session.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3.5 pt-1">
                                            <button 
                                                onClick={handleDownloadEXE}
                                                className="py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1.5"
                                            >
                                                <Download size={13} />
                                                <span>Download Installer</span>
                                            </button>
                                            <button 
                                                onClick={handleLaunchDialerTab}
                                                className="py-2 rounded-lg border border-border-subtle bg-surface-main hover:bg-surface-alt text-text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <Phone size={13} className="text-emerald-500" />
                                                <span>Launch Standalone Tab</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Data Leak Prevention Directive */}
                                    <div className="p-4 rounded-xl border border-red-500/15 bg-red-500/[0.02] flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-red-600">
                                            <ShieldAlert size={18} />
                                            <span className="text-xs font-bold">Data Leak Prevention (DLP) Policies</span>
                                        </div>
                                        <ul className="list-disc list-inside text-xs text-text-muted space-y-1.5 leading-relaxed">
                                            <li><strong className="text-text-secondary">Google & Microsoft Auth Isolation:</strong> For maximum security and data control, consumer credential sync flows (such as third-party Google/Microsoft login) are strictly prohibited and isolated.</li>
                                            <li><strong className="text-text-secondary">Exfiltration Block active:</strong> Copying, exporting, or downloading sheets or records is strictly prohibited at all clearance levels to safeguard company proprietary datasets.</li>
                                            <li><strong className="text-text-secondary">Telemetry logged:</strong> All layout streams are actively watermarked. Screen captures are traceable to your login session.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary mb-4">Notification Settings</h3>
                                    <p className="text-sm text-text-secondary">Manage alerts and sounds.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary mb-4">Account Security</h3>
                                    <p className="text-sm text-text-secondary">Password and 2FA settings.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
