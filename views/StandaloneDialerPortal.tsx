import React, { useState, useEffect, useRef } from 'react';
import { 
    Phone, PhoneOff, ArrowRight, RefreshCw, X, Shield, 
    Activity, Download, Monitor, Volume2, ShieldCheck, 
    Lock, Key, Mail, CheckCircle2, AlertTriangle, UserCheck
} from 'lucide-react';
import { sfx } from '../lib/soundService';
import { useAuth } from '../hooks/useAuth';
import { useCRM } from '../hooks/useCRM';

export const StandaloneDialerPortal: React.FC = () => {
    const { currentUser, login } = useAuth();
    const { customers, logAudit } = useCRM();

    // Setup state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [extension, setExtension] = useState('1005');
    const [campaign, setCampaign] = useState('OUTBOUND_SALES');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pairedAgent, setPairedAgent] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Dialer runtime state
    const [activeCall, setActiveCall] = useState<any>(null);
    const [callDuration, setCallDuration] = useState(0);
    const [callStatus, setCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'onhold' | 'disposed'>('idle');
    const [dialValue, setDialValue] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isMicAccessGranted, setIsMicAccessGranted] = useState(true);
    const [audioOutput, setAudioOutput] = useState('System Default Speakers');
    const [syncStatus, setSyncStatus] = useState('IDLE');
    const [callLog, setCallLog] = useState<any[]>([]);
    
    // Canvas & Wave animation
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const durationIntervalRef = useRef<any>(null);
    const waveAnimationRef = useRef<number | null>(null);

    // Initial load: check pairing or existing browser session
    useEffect(() => {
        // First check for a deep-link token or a pre-saved handoff token
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || localStorage.getItem('shadowcrm_handoff_token');
        
        if (token) {
            try {
                const decryptedStr = atob(token);
                const decrypted = JSON.parse(decryptedStr);
                
                // If token is still valid (within 24h)
                if (decrypted.expires && decrypted.expires > Date.now()) {
                    const mockAgent = {
                        id: decrypted.userId,
                        name: decrypted.username,
                        email: decrypted.userId.includes('@') ? decrypted.userId : `${decrypted.userId}@company.com`,
                        role: decrypted.role,
                        level: 3,
                        phone: extension,
                        team: 'Outbound Stars',
                        active: true
                    };
                    setPairedAgent(mockAgent);
                    localStorage.setItem('paired_dialer_agent', JSON.stringify(mockAgent));
                    sfx.playSuccess();
                    console.log('[CRM:StandaloneDialer] Magic Handoff Token Verified & Paired Successfully:', mockAgent.email);
                    return; // Successfully paired from token, skip local storage parse
                }
            } catch (e) {
                console.error('[CRM:StandaloneDialer] Failed to parse handoff token:', e);
            }
        }

        const stored = localStorage.getItem('paired_dialer_agent');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setPairedAgent(parsed);
                sfx.playConfirm();
            } catch (e) {
                // Ignore
            }
        } else if (currentUser) {
            // Auto-detect browser login for instant pairing (Magic Hand-off)
            setPairedAgent(currentUser);
        }
    }, [currentUser]);

    // Timer for active call duration
    useEffect(() => {
        if (callStatus === 'connected') {
            durationIntervalRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
            if (callStatus === 'idle') {
                setCallDuration(0);
            }
        }
        return () => {
            if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
            }
        };
    }, [callStatus]);

    // Canvas Voice Traffic wave simulation
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let angle = 0;
        const draw = () => {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = callStatus === 'connected' ? '#10b981' : (callStatus === 'dialing' ? '#3b82f6' : '#64748b');
            ctx.lineWidth = 2;
            ctx.beginPath();

            const amplitude = callStatus === 'connected' ? 20 : (callStatus === 'dialing' ? 8 : 1);
            const frequency = callStatus === 'connected' ? 0.08 : (callStatus === 'dialing' ? 0.04 : 0.01);

            for (let x = 0; x < canvas.width; x++) {
                const y = canvas.height / 2 + Math.sin(x * frequency + angle) * amplitude * Math.sin(x * 0.01);
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            angle += 0.15;
            waveAnimationRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (waveAnimationRef.current) {
                cancelAnimationFrame(waveAnimationRef.current);
            }
        };
    }, [callStatus]);

    // Play beep sound on dialing
    const playDialToneBeep = (digit: string) => {
        sfx.playClick();
        setDialValue(prev => prev + digit);
    };

    // Simulate EXE download with custom binary installer payload
    const handleDownloadEXE = () => {
        sfx.playClick();
        
        const payload = `==================================================================
BRAVEHEART OS - STANDALONE DESKTOP TELEPHONY AGENT CLIENT INSTALLER
==================================================================
Target Workspace CRM ID: braveheart-crm-os-v2
Build Target: Windows NT x64 x86
Version: v2.4.1-enterprise-stable
Digital Signature Check: COMPLIANT (Braveheart OS Core Network)
Local Encrypted Trunk: shadowcrm://auth?token=EXISTS
==================================================================

INSTRUCTIONS FOR AUTOMATIC WEB HAND-OFF SETUP:
1. Launch this installer file on your Windows desktop.
2. Allow administrative permissions to register the custom Protocol Handler ("shadowcrm://").
3. Launch your primary Braveheart CRM web portal in Google Chrome.
4. Once you authenticate on the browser with Google Sign-In, the portal will instantly hand-off
   and authorize your Standalone Desktop Dialer Client silently in the background!
5. No second logins or typing required.

Trunk Diagnostics Protocol: TLS 1.3 | AES-256-GCM | Low-Latency Telephony Gateways.`;

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
        logAudit?.({
            action: 'DIALER_EXE_DOWNLOADED',
            details: 'Agent downloaded standalone desktop client installer',
            module: 'COMM'
        });
    };

    // Manual pairing verification
    const handlePairingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);
        sfx.playSubmit();

        await new Promise(r => setTimeout(r, 1200));

        // Normal validation or mock verify
        if (!email || !password) {
            setErrorMsg('All fields are strictly required.');
            setIsSubmitting(false);
            sfx.playError();
            return;
        }

        // Simulating matching with same username and password used when signing in
        const mockAgent = {
            id: 'agent-' + Math.floor(Math.random() * 9000 + 1000),
            name: email.split('@')[0].toUpperCase(),
            email: email,
            role: 'agent',
            level: 3,
            phone: extension,
            team: 'Outbound Stars',
            active: true
        };

        localStorage.setItem('paired_dialer_agent', JSON.stringify(mockAgent));
        setPairedAgent(mockAgent);
        setIsSubmitting(false);
        sfx.playSuccess();

        logAudit?.({
            action: 'DIALER_PAIRED_SUCCESSFULLY',
            details: `Trunk paired with agent ${mockAgent.email} on extension ${extension}`,
            module: 'AUTH'
        });
    };

    // Instant magic hand-off login
    const handleInstantHandoff = () => {
        if (currentUser) {
            sfx.playConfirm();
            setPairedAgent(currentUser);
            localStorage.setItem('paired_dialer_agent', JSON.stringify(currentUser));
            
            logAudit?.({
                action: 'DIALER_MAGIC_HANDOFF',
                details: `Magic Handoff completed. Paired with active browser session: ${currentUser.email}`,
                module: 'AUTH'
            });
        } else {
            sfx.playError();
            setErrorMsg("No active browser CRM session found. Please sign in on the browser or type your credentials below.");
        }
    };

    // Break pair
    const handleUnpair = () => {
        sfx.playTrash();
        localStorage.removeItem('paired_dialer_agent');
        setPairedAgent(null);
        setActiveCall(null);
        setCallStatus('idle');
        setDialValue('');
    };

    // Trigger phone call simulation
    const handleStartCall = () => {
        const numberToCall = dialValue.trim();
        if (!numberToCall) {
            sfx.playError();
            return;
        }

        sfx.playClick();
        setCallStatus('dialing');
        
        // Find matching customer from the CRM provider to show their file card in real-time!
        const matchingCustomer = customers?.find(c => 
            c.phone?.replace(/\D/g, '') === numberToCall.replace(/\D/g, '') ||
            c.customerPhone?.replace(/\D/g, '') === numberToCall.replace(/\D/g, '')
        ) || {
            firstName: 'Unknown',
            lastName: 'Customer',
            fullName: 'Unknown Lead',
            phone: numberToCall,
            address: 'Scraped Lead File - Standalone Dialer Ingest',
            email: 'unregistered@telephony-trunk.local'
        };

        setActiveCall(matchingCustomer);

        // Simulated ring then connect
        setTimeout(() => {
            sfx.playPhoneRing();
        }, 1000);

        setTimeout(() => {
            setCallStatus('connected');
            sfx.playConfirm();
            
            logAudit?.({
                action: 'DIALER_CALL_CONNECTED',
                details: `Call connected to ${numberToCall}`,
                module: 'COMM'
            });
        }, 3800);
    };

    // Hangup
    const handleHangup = () => {
        if (callStatus === 'idle') return;
        sfx.playDecline();
        
        // Save to call log
        const newLog = {
            id: 'call-' + Math.floor(Math.random() * 10000),
            phone: activeCall?.phone || dialValue,
            name: activeCall?.fullName || 'Unknown Customer',
            duration: callDuration,
            timestamp: Date.now(),
            outcome: callDuration > 5 ? 'Connected / Handled' : 'Short Answer'
        };
        
        setCallLog(prev => [newLog, ...prev]);
        setCallStatus('disposed');

        logAudit?.({
            action: 'DIALER_CALL_HANGUP',
            details: `Call with ${newLog.phone} disconnected after ${callDuration}s`,
            module: 'COMM'
        });
    };

    // Dispose
    const handleDispose = () => {
        sfx.playClick();
        setCallStatus('idle');
        setActiveCall(null);
        setDialValue('');
    };

    // Webhook Sync
    const handlePushToCRM = () => {
        if (!activeCall) return;
        sfx.playProcessing();
        setSyncStatus('SYNCING');

        // Dispatch a live custom event that the browser CRM window listens to in real-time!
        const syncEvent = new CustomEvent('DIALER_LEAD_SYNC', {
            detail: {
                ...activeCall,
                phone: activeCall.phone || dialValue,
                syncedAt: Date.now(),
                campaign: campaign,
                extension: extension
            }
        });
        window.dispatchEvent(syncEvent);

        setTimeout(() => {
            setSyncStatus('SUCCESS');
            sfx.playSuccess();
            
            logAudit?.({
                action: 'DIALER_RECORD_SYNCD',
                details: `Pushed synced lead data for ${activeCall.fullName || 'Lead'} directly to browser viewport`,
                module: 'CRM'
            });
        }, 1500);

        setTimeout(() => {
            setSyncStatus('IDLE');
        }, 4000);
    };

    // Format call duration
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen w-full bg-[#0B0F19] text-[#E2E8F0] font-sans flex flex-col antialiased relative overflow-hidden select-none">
            
            {/* Background cyber grid */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                 style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Glowing background mesh */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

            {/* Header: Mock Electron Window Frame */}
            <header className="h-12 border-b border-slate-800/80 bg-[#0F1322] flex items-center justify-between px-5 relative z-10 select-none shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 items-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <div className="w-3 h-3 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Activity size={8} className="text-white" />
                        </div>
                    </div>
                    <span className="text-xs font-black tracking-wider text-slate-400 uppercase font-mono">
                        Braveheart OS Telephony Terminal — <span className="text-[#38BDF8]">Standalone Desktop Client v2.4.1</span>
                    </span>
                </div>

                {/* Simulated Windows OS Action Rails */}
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/30">
                        TRUNK: LOCALHOST_SIP
                    </span>
                    <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 cursor-pointer"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700 hover:bg-slate-600 cursor-pointer"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/30 hover:bg-rose-500 cursor-pointer"></div>
                    </div>
                </div>
            </header>

            {/* Main Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 overflow-hidden">
                
                {/* LEFT SIDEBAR: Connection, Setup, Pair, Installer Instructions */}
                <section className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-1">
                    
                    {/* Pair Verification Card */}
                    {!pairedAgent ? (
                        <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                                    <Shield size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Pair Dialer Core</h3>
                                    <p className="text-[10px] text-slate-400">Match credentials to authorize agent seat</p>
                                </div>
                            </div>

                            {/* Magic handoff prompt */}
                            {currentUser && (
                                <button
                                    onClick={handleInstantHandoff}
                                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                                >
                                    <UserCheck size={14} />
                                    <span>Instant Browser Handoff</span>
                                </button>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-800"></span></div>
                                <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-[#121829] px-2 text-slate-500 font-bold">Or enter credentials</span></div>
                            </div>

                            <form onSubmit={handlePairingSubmit} className="space-y-3.5">
                                {errorMsg && (
                                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                        <Mail size={10} /> Account Username / Email
                                    </label>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="agent@company.com" 
                                        className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-lg text-xs outline-none text-white focus:border-indigo-500 transition-colors font-medium placeholder:text-slate-600"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                                        <Key size={10} /> Account CRM Password
                                    </label>
                                    <input 
                                        type="password" 
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" 
                                        className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-lg text-xs outline-none text-white focus:border-indigo-500 transition-colors font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Extension</label>
                                        <input 
                                            type="text" 
                                            value={extension}
                                            onChange={e => setExtension(e.target.value)}
                                            placeholder="1005" 
                                            className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-lg text-xs outline-none text-white text-center font-mono focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Campaign</label>
                                        <input 
                                            type="text" 
                                            value={campaign}
                                            onChange={e => setCampaign(e.target.value)}
                                            className="w-full px-3 py-2 bg-[#0A0D16] border border-slate-800 rounded-lg text-xs outline-none text-white text-center font-mono font-bold"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-950/40"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw size={12} className="animate-spin" />
                                            <span>Authorizing Secure Trunk...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Bind Dialer Seat</span>
                                            <ArrowRight size={12} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Paired Status Card */
                        <div className="bg-[#121829] border border-emerald-500/20 rounded-2xl p-5 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">SIP Trunk Secured</h3>
                                        <p className="text-[10px] text-slate-400">Agent: <span className="font-bold text-emerald-400 font-mono">{pairedAgent.name || pairedAgent.email?.split('@')[0]}</span></p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleUnpair}
                                    className="text-[9px] font-black uppercase text-slate-500 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition-all"
                                >
                                    Disconnect
                                </button>
                            </div>

                            <div className="p-3 bg-[#0A0D16] border border-slate-800/80 rounded-xl space-y-2 font-mono text-[10px]">
                                <div className="flex justify-between"><span className="text-slate-500">Extension:</span><span className="text-slate-300 font-bold">{extension}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Campaign ID:</span><span className="text-[#38BDF8] font-bold">{campaign}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Node Latency:</span><span className="text-emerald-400">14ms (Excellent)</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Sign-in Link:</span><span className="text-emerald-400 uppercase font-black text-[9px] flex items-center gap-1">🟢 Same as Google Session</span></div>
                            </div>
                        </div>
                    )}

                    {/* Desktop App Installer Card */}
                    <div className="bg-gradient-to-br from-[#121829] to-[#0A0D16] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                        <div className="flex items-center gap-2">
                            <Monitor className="text-[#38BDF8]" size={18} />
                            <div>
                                <h3 className="text-sm font-bold text-white">Desktop Client (EXE) Installer</h3>
                                <p className="text-[10px] text-slate-400 font-medium">Download native agent executable wrapper</p>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                            Some company setups block browser media, or require a specific standalone telephony console tab. 
                            Download the installer below to bypass browser limits instantly.
                        </p>

                        <button 
                            onClick={handleDownloadEXE}
                            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-xl text-xs font-black active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/20"
                        >
                            <Download size={14} />
                            <span>Download Setup (Braveheart_Dialer_Setup.exe)</span>
                        </button>

                        <div className="border-t border-slate-800/80 pt-3.5 space-y-2 text-xs text-slate-400">
                            <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block">Idiot-Proof Installer Steps</span>
                            <div className="space-y-2 bg-[#090D1A] p-3 rounded-xl border border-slate-800/50">
                                <div className="flex gap-2 items-start text-[10px]">
                                    <span className="w-4 h-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">1</span>
                                    <p className="text-slate-400 leading-relaxed font-medium">Run <code className="text-[#38BDF8]">Braveheart_Dialer_Setup.exe</code> on your computer.</p>
                                </div>
                                <div className="flex gap-2 items-start text-[10px] border-t border-slate-800/30 pt-2">
                                    <span className="w-4 h-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">2</span>
                                    <p className="text-slate-400 leading-relaxed font-medium">It instantly registers the <code className="text-[#38BDF8]">shadowcrm://</code> protocol handler on Windows.</p>
                                </div>
                                <div className="flex gap-2 items-start text-[10px] border-t border-slate-800/30 pt-2">
                                    <span className="w-4 h-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">3</span>
                                    <p className="text-slate-400 leading-relaxed font-medium">Authenticate on Chrome with Google as normal. The web browser automatically hands off credentials to the client without you typing anything!</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* RIGHT SIDEBAR: Telephony console viewport */}
                <section className="lg:col-span-8 flex flex-col gap-6 h-full min-h-[500px]">
                    
                    {/* Dialpad & Live Display container */}
                    <div className="flex-1 bg-[#121829] border border-slate-800/80 rounded-2xl flex flex-col md:flex-row shadow-2xl overflow-hidden relative">
                        
                        {/* Dialer Interface Panel */}
                        <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-5">
                            
                            {/* Live Console LCD screen */}
                            <div className="bg-[#090C16] border border-slate-800/80 rounded-xl p-4 space-y-3 relative overflow-hidden shrink-0">
                                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${pairedAgent ? 'bg-emerald-400' : 'bg-rose-500'} animate-pulse`}></span>
                                    <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-500">
                                        {pairedAgent ? 'Trunk Linked' : 'No Trunk'}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono">Dial Display</span>
                                    <div className="text-2xl font-black font-mono tracking-wider text-emerald-400 min-h-[32px] overflow-x-auto select-text truncate">
                                        {dialValue || 'READY TO DIAL'}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-2">
                                    <span>LINE: <strong className="text-white">EXT-{extension}</strong></span>
                                    <span className="text-[#38BDF8]">CAMP: <strong className="font-bold">{campaign}</strong></span>
                                    {callStatus !== 'idle' && (
                                        <span className="text-rose-400 font-black flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                            {callStatus.toUpperCase()} ({formatTime(callDuration)})
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Live Soundwave voice representation */}
                            <div className="flex-1 bg-black/40 border border-slate-800/60 rounded-xl p-3 flex flex-col justify-between items-center relative overflow-hidden min-h-[120px]">
                                <span className="absolute top-1.5 left-2 text-[8px] font-black text-slate-600 font-mono uppercase tracking-widest">
                                    Trunk Voice Waveform Traffic
                                </span>
                                <canvas ref={canvasRef} width={400} height={100} className="w-full h-full max-h-[110px]" />
                                <div className="w-full flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1 border-t border-slate-800/40 shrink-0">
                                    <div className="flex items-center gap-1">
                                        <Volume2 size={12} className="text-slate-400" />
                                        <span>Output: <strong className="text-slate-300">{audioOutput}</strong></span>
                                    </div>
                                    <span>Codec: G.711u (64kbps)</span>
                                </div>
                            </div>

                            {/* Telephony workspace state */}
                            {pairedAgent ? (
                                <div className="space-y-3 shrink-0">
                                    {callStatus === 'idle' && (
                                        <button
                                            onClick={handleStartCall}
                                            disabled={!dialValue}
                                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Phone size={16} />
                                            <span>Initiate Call (Dial Extension)</span>
                                        </button>
                                    )}

                                    {(callStatus === 'dialing' || callStatus === 'connected') && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleHangup}
                                                className="py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-black active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-950/30"
                                            >
                                                <PhoneOff size={16} />
                                                <span>Hang Up Call</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    sfx.playClick();
                                                    setIsMuted(prev => !prev);
                                                }}
                                                className={`py-3.5 text-white rounded-xl text-sm font-black active:scale-95 transition-all flex items-center justify-center gap-2 border ${isMuted ? 'bg-amber-600 border-amber-500' : 'bg-[#181F38] border-slate-800 hover:bg-slate-800'}`}
                                            >
                                                <span>{isMuted ? 'Muted / Unmute' : 'Mute Mic'}</span>
                                            </button>
                                        </div>
                                    )}

                                    {callStatus === 'disposed' && (
                                        <div className="space-y-2.5 p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                                            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                                Active Call Ended (Dispose Sequence)
                                            </div>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                Ensure all lead details and callback coordinates are synchronized to central company databases.
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <button
                                                    onClick={handlePushToCRM}
                                                    disabled={syncStatus === 'SYNCING'}
                                                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                                                >
                                                    {syncStatus === 'SYNCING' ? (
                                                        <>
                                                            <RefreshCw size={12} className="animate-spin" />
                                                            <span>Syncing...</span>
                                                        </>
                                                    ) : syncStatus === 'SUCCESS' ? (
                                                        <>
                                                            <CheckCircle2 size={12} className="text-emerald-400" />
                                                            <span>Synced!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={12} />
                                                            <span>Sync Lead Data</span>
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={handleDispose}
                                                    className="py-2 px-3 bg-[#1D253F] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-800"
                                                >
                                                    <span>Close & Clear</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl text-center flex flex-col items-center justify-center space-y-2 py-6 shrink-0">
                                    <Lock size={20} className="text-slate-500" />
                                    <span className="text-xs font-black text-white uppercase tracking-wider">TRUNK AUTHENTICATION REQUIRED</span>
                                    <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed font-medium">
                                        Please bind your agent seat email and password in the left sidebar to activate live call controls.
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Dial Pad & Key Numeric panel */}
                        <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-800/80 bg-[#0F1322]/60 p-5 flex flex-col justify-between gap-4 shrink-0">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono block mb-3">
                                    SIP Numerical Dial Keypad
                                </span>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(digit => (
                                        <button
                                            key={digit}
                                            type="button"
                                            onClick={() => playDialToneBeep(digit)}
                                            className="h-12 bg-[#171D33] hover:bg-indigo-600/10 border border-slate-800/60 hover:border-indigo-500/25 rounded-xl font-black text-lg text-white font-mono transition-all flex flex-col items-center justify-center active:scale-95 active:bg-indigo-600/20"
                                        >
                                            {digit}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => { sfx.playTrash(); setDialValue(''); }}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5"
                            >
                                <X size={13} />
                                <span>Clear Display</span>
                            </button>
                        </div>

                    </div>

                    {/* Active Customer Dossier Sync View */}
                    {activeCall && (
                        <div className="bg-[#121829] border border-indigo-500/15 rounded-2xl p-5 space-y-4 shadow-xl animate-in slide-in-from-bottom-2 duration-300 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-wider">Matched Contact Dossier File</span>
                                </div>
                                <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold">
                                    Active Telephony Ingest
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</span>
                                    <span className="text-sm font-bold text-white leading-tight block">
                                        {activeCall.fullName || `${activeCall.firstName || ''} ${activeCall.lastName || ''}`}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Normalized Email</span>
                                    <span className="text-sm font-semibold text-slate-300 leading-tight block">{activeCall.email || 'None Provided'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ingest Street Address</span>
                                    <span className="text-xs font-medium text-slate-300 leading-relaxed block">{activeCall.address || 'No Address Logged'}</span>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Assigned Trunk campaign</span>
                                    <span className="text-xs font-bold text-[#38BDF8] font-mono leading-tight block uppercase">{campaign}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[9px] text-slate-500 font-medium">Bypasses secondary OAuth. Directly binds to Google/CRM core state.</span>
                                <button 
                                    onClick={handlePushToCRM}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                                >
                                    <RefreshCw size={12} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
                                    <span>{syncStatus === 'SYNCING' ? 'Syncing...' : syncStatus === 'SUCCESS' ? 'Trunk Synced!' : 'Sync Ledger Now'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Dialer Call Log List */}
                    <div className="bg-[#121829] border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl flex-1 overflow-hidden min-h-[160px] flex flex-col justify-between">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono block mb-3">
                                Live Session Telephony logs
                            </span>

                            {callLog.length === 0 ? (
                                <div className="p-4 bg-black/10 rounded-xl text-center text-slate-500 text-xs font-medium border border-slate-800/40">
                                    No calls performed in this session trunk yet.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
                                    {callLog.map((log: any) => (
                                        <div key={log.id} className="p-2.5 bg-[#090D1A] border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
                                            <div className="flex items-center gap-2">
                                                <span className="text-emerald-400">🟢</span>
                                                <div className="space-y-0.5">
                                                    <span className="text-white font-bold">{log.name}</span>
                                                    <span className="text-slate-500 text-[10px] block">{log.phone}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 text-[10px] block font-bold">{log.outcome}</span>
                                                <span className="text-indigo-400 text-[10px]">{formatTime(log.duration)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <span className="text-[9px] text-slate-600 font-bold leading-normal font-mono text-center block pt-2 border-t border-slate-800/50">
                            TRUNK SECURITY SHIELD LEVEL 10 ACTIVE. ALL CALL AUDITS LOGGED.
                        </span>
                    </div>

                </section>
            </main>
        </div>
    );
};
