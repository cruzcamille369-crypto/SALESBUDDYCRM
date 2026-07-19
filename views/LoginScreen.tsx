import * as React from 'react';
import { useState, useEffect } from 'react';
import { ShieldAlert, Clock, Sparkles, TrendingUp, ChevronRight, Star, Zap, DollarSign, ArrowUpRight } from 'lucide-react';
import { User } from '../types';
import { sfx } from '../lib/soundService';
import { useAuth } from '../hooks/useAuth';
import { SYSTEM_ADMIN_ID } from '../constants';
import { CredentialsStage } from '../components/auth/login/CredentialsStage';
import { UplinkStage } from '../components/auth/login/UplinkStage';

interface LoginScreenProps {
    onLogin: (user: User) => void;
    isDbConnected: boolean;
    users: User[]; 
}

type LoginStep = 'credentials' | 'server';

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { authenticate, authenticateRoot, login } = useAuth();
  
  const [step, setStep] = useState<LoginStep>('credentials');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [tempUserId, setTempUserId] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  
  const [time, setTime] = useState(new Date());

  useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  const triggerMagicHandoff = (user: User) => {
      try {
          const payloadObj = {
              userId: user.id,
              username: user.name,
              role: user.role,
              companyId: user.companyId || 'NEXUS-CORP',
              expires: Date.now() + 1000 * 60 * 60 * 24 
          };
          const encryptedToken = btoa(JSON.stringify(payloadObj));
          console.log('[CRM:MagicHandOff] Directing deep link to shadowcrm://auth');
          
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = `shadowcrm://auth?token=${encryptedToken}`;
          document.body.appendChild(iframe);
          
          localStorage.setItem('shadowcrm_handoff_token', encryptedToken);
          
          setTimeout(() => {
              if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
              }
          }, 2000);
      } catch (e) {
          console.error('[CRM:MagicHandOff] Hand-off generation failed:', e);
      }
  };

  const handleCredentialsSubmit = async (u: string, p: string) => {
      const userId = u.trim();
      const password = p.trim();
      
      setError('');
      setIsProcessing(true);
      sfx.playSubmit();
      
      setTempUserId(userId);
      setTempPassword(password);
 
      try {
          await new Promise(r => setTimeout(r, 600));
          
          const rootResult = await authenticateRoot(userId, password);
          if (rootResult && 'user' in rootResult) {
              sfx.playSuccess();
              await login(rootResult.user, rootResult.sig);
              triggerMagicHandoff(rootResult.user);
              onLogin(rootResult.user);
          } else if (rootResult && 'error' in rootResult && userId === SYSTEM_ADMIN_ID) {
              setError(rootResult.error);
              sfx.playError();
              setIsProcessing(false);
          } else {
              setStep('server');
              setIsProcessing(false);
          }
      } catch {
          setStep('server');
          setIsProcessing(false);
      }
  };
 
  const handleServerConnect = async (companyId: string) => {
      setError('');
      setIsProcessing(true);
      sfx.playSubmit();
 
      try {
          await new Promise(r => setTimeout(r, 800)); 
          const result = await authenticate(tempUserId, tempPassword, companyId, "");
          if (result && 'user' in result) {
              const { user, sig } = result;
              sfx.playSuccess();
              await login(user, sig);
              triggerMagicHandoff(user);
              onLogin(user);
          } else {
              throw new Error(result && 'error' in result ? result.error : 'Invalid Credentials');
          }
      } catch (err: any) {
          sfx.playError();
          setError(err.message || "Login Failed");
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="h-screen w-screen flex flex-row bg-surface-canvas text-slate-800 font-sans select-none overflow-hidden relative">
        
        {/* LEFT PANEL: The Primary Standard Full-Height Login Experience */}
        <div className="w-full lg:w-[45%] xl:w-[40%] h-full flex flex-col justify-between p-6 md:p-12 xl:p-16 bg-white relative z-10 shadow-[8px_0_40px_rgba(15,23,42,0.02)] shrink-0 overflow-y-auto">
            
            {/* Header / Brand */}
            <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                    <TrendingUp size={18} strokeWidth={2.5} />
                </div>
                <span className="text-slate-900 font-black tracking-tight text-lg">My Pipe</span>
            </div>

            {/* Main Full-Size Centered Form Content */}
            <div className="my-auto py-8 w-full max-w-[360px] mx-auto flex flex-col">
                
                {/* Motivation Pill */}
                <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/60 text-indigo-600 text-xs font-bold shadow-sm mb-6 animate-bounce-subtle">
                    <Sparkles size={13} className="text-indigo-500" />
                    <span>Let's crush the day! 🚀</span>
                </div>

                {/* Welcoming Wording Focused entirely on the user & their success */}
                <div className="space-y-2 mb-8">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        Welcome back, Sales Star! ✨
                    </h1>
                    <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                        Ready to connect with your pipeline, close those warm leads, and drive massive sales numbers? We are fired up and ready!
                    </p>
                </div>

                {/* Standard Full-Size Login Container */}
                <div className="w-full relative">
                    {error && (
                        <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                            <ShieldAlert size={18} className="text-rose-500 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-rose-800">Authentication Failure</p>
                                <p className="text-xs text-rose-600 font-medium leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="w-full">
                        {step === 'credentials' ? (
                            <CredentialsStage 
                                onSubmit={handleCredentialsSubmit} 
                                isProcessing={isProcessing} 
                            />
                        ) : (
                            <UplinkStage 
                                userId={tempUserId}
                                onBack={() => { setStep('credentials'); setTempPassword(''); }}
                                onSubmit={handleServerConnect}
                                isProcessing={isProcessing}
                            />
                        )}
                    </div>
                </div>

                {/* Need Access */}
                <div className="mt-6 flex justify-start text-xs text-slate-400 font-semibold">
                    <a href="#help" onClick={(e) => { e.preventDefault(); sfx.playClick(); setError("For security, lower-level agents and admins do not self-register. Please contact your Level 10 System Administrator to provision or reset your credentials."); }} className="hover:text-indigo-600 transition-colors inline-flex items-center gap-1 group">
                        Need an access code? <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </a>
                </div>

            </div>

            {/* Bottom Clock Status */}
            <div className="flex items-center justify-between text-slate-400 font-semibold text-xs border-t border-slate-100 pt-5 mt-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={13} className="text-indigo-500 animate-pulse" />
                    <span className="font-bold">
                        {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
                <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">My Pipe CRM</span>
            </div>
        </div>

        {/* RIGHT PANEL: Large, Modern, Inspiring Sales Visualization Canvas (Hidden on mobile/tablet) */}
        <div className="hidden lg:flex lg:flex-1 h-full bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 p-12 xl:p-16 relative flex-col justify-between overflow-hidden">
            
            {/* Ambient Animated Lights and Gradients */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[140px] opacity-30"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500 rounded-full blur-[120px] opacity-40"></div>
                
                {/* Sleek dotted sales-matrix design pattern */}
                <div 
                    className="absolute inset-0" 
                    style={{ 
                        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
                        backgroundSize: '32px 32px' 
                    }}
                ></div>
            </div>

            {/* Decorative Top Accent Tag */}
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80 font-bold text-xs uppercase tracking-wider bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Sales Engine Fired Up
                </div>
            </div>

            {/* Central High-Energy Sales Desire Boost Area */}
            <div className="relative z-10 my-auto max-w-xl space-y-10">
                
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 text-indigo-300 font-black text-sm uppercase tracking-widest">
                        <Star size={16} className="text-amber-400 fill-amber-400 animate-spin-slow" />
                        <span>High-Performance Mode</span>
                    </div>
                    <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-tight">
                        Your tool to overachieve, double your conversions, and crush every target.
                    </h2>
                    <p className="text-lg text-slate-300 font-medium">
                        Pipeline CRM works seamlessly in the background so you can spend your energy doing what you do best: winning deals.
                    </p>
                </div>

                {/* Friendly Floating Milestone Badges (Simulating massive CRM success to increase motivation) */}
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* Badge 1: High commission / closed deals vibe */}
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-all duration-300 group hover:translate-y-[-2px]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <DollarSign size={16} />
                            </div>
                            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Closed!</span>
                        </div>
                        <h4 className="font-bold text-white text-base">$14,250 Deal Win</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">Commission tracked and instantly credited to agent wallet.</p>
                    </div>

                    {/* Badge 2: Rapid growth vibe */}
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-all duration-300 group hover:translate-y-[-2px]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                                <Zap size={16} />
                            </div>
                            <div className="flex items-center gap-0.5 text-xs text-indigo-300 font-bold">
                                <span>+185%</span>
                                <ArrowUpRight size={12} />
                            </div>
                        </div>
                        <h4 className="font-bold text-white text-base">Pipeline Speed booster</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-normal">Instant high-value lead matching & pipeline routing activated.</p>
                    </div>

                </div>

            </div>

            {/* Bottom Professional Statement */}
            <div className="relative z-10 flex items-center justify-between text-slate-400 text-xs font-semibold pt-6 border-t border-white/5">
                <span>Every click is a step closer to your next milestone. Let's make today legendary! 🌟</span>
            </div>

        </div>

    </div>
  );
};
