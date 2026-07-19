import React, { useState, useEffect, useMemo } from 'react';
import { NexusEventBus } from '../../nexus/services/NexusEventBus';
import { useCRM } from '../../hooks/useCRM';
import { calculatePayout } from '../../lib/IncentiveEngine';
import { AgentPerformanceContext, AgentPerformanceData } from '../AgentPerformanceContext';


export const AgentPerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { sales, attendance, users, systemConfig } = useCRM();
    const [realtimeUpdates, setRealtimeUpdates] = useState<number>(Date.now());
    const [liveStatuses, setLiveStatuses] = useState<Record<string, 'Active' | 'AFK' | 'Break' | 'Offline'>>({});

    useEffect(() => {
        const unsubSaleSub = NexusEventBus.subscribe('SALE_SUBMITTED', () => setRealtimeUpdates(Date.now()));
        const unsubSaleApp = NexusEventBus.subscribe('SALE_APPROVED', () => setRealtimeUpdates(Date.now()));
        const unsubShiftStart = NexusEventBus.subscribe('SHIFT_STARTED', (data: any) => {
            setLiveStatuses(prev => ({ ...prev, [data.agentId]: 'Active' }));
            setRealtimeUpdates(Date.now());
        });
        const unsubAfk = NexusEventBus.subscribe('AFK_DETECTED', (data: any) => {
            setLiveStatuses(prev => ({ ...prev, [data.agentId]: 'AFK' }));
            setRealtimeUpdates(Date.now());
        });
        const unsubStatus = NexusEventBus.subscribe('AGENT_STATUS_UPDATE', (data: any) => {
            setLiveStatuses(prev => ({ ...prev, [data.agentId]: data.status }));
            setRealtimeUpdates(Date.now());
        });

        return () => {
            unsubSaleSub();
            unsubSaleApp();
            unsubShiftStart();
            unsubAfk();
            unsubStatus();
        };
    }, []);

    const agentPerformances = useMemo(() => {
        const dataMap: Record<string, AgentPerformanceData> = {};
        
        users.filter(u => u.role === 'agent').forEach(agent => {
            const agentSales = sales.filter(s => s.agentId === agent.id);
            const pendingSales = agentSales.filter(s => s.status === 'Pending');
            
            const payoutData = calculatePayout(sales, attendance, systemConfig, agent.id);
            
            // Calculate active hours for today
            const todayStart = new Date().setHours(0,0,0,0);
            const todayAttendance = attendance.filter(a => a.agentId === agent.id && a.timestamp >= todayStart);
            let hoursLogged = 0;
            todayAttendance.forEach(a => {
                if (a.type === 'CLOCK_OUT' && a.duration) {
                    hoursLogged += a.duration / 3600;
                }
            });

            // Disqualification flags
            const lateFlag = false; // Add logic if you want
            
            dataMap[agent.id] = {
                agentId: agent.id,
                liveStatus: liveStatuses[agent.id] || (agent.currentStatus === 'online' ? 'Active' : 'Offline'),
                pendingQueueCount: pendingSales.length,
                incentiveProjection: payoutData.totalPayout,
                salesCount: agentSales.filter(s => s.status === 'Approved').length,
                hoursLogged: Math.round(hoursLogged * 100) / 100,
                isDisqualified: lateFlag
            };
        });
        
        return dataMap;
    }, [sales, attendance, users, systemConfig, realtimeUpdates, liveStatuses]);

    const contextValue = useMemo(() => ({ agentPerformances, getAgentData: (id: string) => agentPerformances[id] }), [agentPerformances]);

    return (
        <AgentPerformanceContext.Provider value={contextValue}>
            {children}
        </AgentPerformanceContext.Provider>
    );
};
