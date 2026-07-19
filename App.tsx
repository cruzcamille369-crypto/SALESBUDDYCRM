import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CRMProvider } from './context/CRMContext';
import { CRMPerformanceProvider } from './context/CRMPerformanceContext';
import { AuthProvider } from './context/AuthContext';
import { SystemProvider } from './context/SystemContext';
import { MainContent } from './components/app/MainContent';
import { CustomWebDialerIframe } from './components/widgets/telephony/CustomWebDialerIframe';
import { GlobalErrorBoundary } from './components/ui/GlobalErrorBoundary';
import { AutoScaler } from './components/layout/AutoScaler';
import { DLPWatermark } from './components/security/DLPWatermark';
import { AgentPerformanceProvider } from './context/providers/AgentPerformanceProvider';
import { StandaloneDialerPortal } from './views/StandaloneDialerPortal';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
        },
    },
});




const App: React.FC = () => {
    React.useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            (window as any).deferredPrompt = e;
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // Check if path or query indicates Standalone Dialer mode
    const isDialerMode = window.location.pathname === '/dialer' || window.location.search.includes('mode=dialer');

    const content = (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <SystemProvider>
                    <CRMProvider>
                        <CRMPerformanceProvider>
                            <AgentPerformanceProvider>
                                <AutoScaler>
                                    <DLPWatermark />
                                    {isDialerMode ? (
                                        <StandaloneDialerPortal />
                                    ) : (
                                        <>
                                            <MainContent />
                                            <CustomWebDialerIframe />
                                        </>
                                    )}
                                </AutoScaler>
                            </AgentPerformanceProvider>
                        </CRMPerformanceProvider>
                    </CRMProvider>
                </SystemProvider>
            </AuthProvider>
        </QueryClientProvider>
    );

    return (
        <GlobalErrorBoundary>
            {content}
        </GlobalErrorBoundary>
    );
};

export default App;
