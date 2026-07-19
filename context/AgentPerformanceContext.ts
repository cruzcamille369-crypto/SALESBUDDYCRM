import { createContext } from 'react';

export interface AgentPerformanceData {
    agentId: string;
    liveStatus: 'Active' | 'AFK' | 'Break' | 'Offline';
    pendingQueueCount: number;
    incentiveProjection: number;
    salesCount: number;
    hoursLogged: number;
    isDisqualified: boolean;
}

interface AgentPerformanceContextType {
    agentPerformances: Record<string, AgentPerformanceData>;
    getAgentData: (agentId: string) => AgentPerformanceData | undefined;
}

export const AgentPerformanceContext = createContext<AgentPerformanceContextType | undefined>(undefined);

import { useContext } from 'react';

export const useAgentPerformance = () => {
    const context = useContext(AgentPerformanceContext);
    if (!context) {
        throw new Error('useAgentPerformance must be used within an AgentPerformanceProvider');
    }
    return context;
};
