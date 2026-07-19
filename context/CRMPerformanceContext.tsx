import { NexusEventBus } from '../nexus/services/NexusEventBus';
import { getStorageItem, setStorageItem, removeStorageItem } from '../lib/storage';
 

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth, useTimer } from '../hooks/useAuth';
import { useCRM } from '../hooks/useCRM';
import { generateLeaderboard } from '../views/utils/crmLogic';
import { CRMPerformanceContext } from './CRMPerformanceContextCore';

export const CRMPerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const crm = useCRM();
    const { workTimeSeconds, resetTimerState } = useTimer();

    const [isClockedIn, setIsClockedIn] = useState(() => getStorageItem('isClockedIn') === 'true');
    const [currentSessionStart, setCurrentSessionStart] = useState<number | null>(() => {
        const saved = getStorageItem('sessionStart');
        return saved ? parseInt(saved) : null;
    });

    const shiftDuration = workTimeSeconds;

    // Sync state with cross-device database records
    useEffect(() => {
        if (!currentUser) {
            if (isClockedIn) setIsClockedIn(false);
            if (currentSessionStart) setCurrentSessionStart(null);
            return;
        }

        const todayStart = new Date().setHours(0,0,0,0);
        const myAttendanceToday = crm.attendance
            .filter(a => a.agentId === currentUser.id && a.timestamp >= todayStart && (a.type === 'CLOCK_IN' || a.type === 'CLOCK_OUT'))
            .sort((a, b) => b.timestamp - a.timestamp);

        if (myAttendanceToday.length > 0) {
            const latest = myAttendanceToday[0];
            if (latest.type === 'CLOCK_IN' && !isClockedIn) {
                setIsClockedIn(true);
                setCurrentSessionStart(latest.timestamp);
                setStorageItem('isClockedIn', 'true');
                setStorageItem('sessionStart', latest.timestamp.toString());
            } else if (latest.type === 'CLOCK_OUT' && isClockedIn) {
                setIsClockedIn(false);
                setCurrentSessionStart(null);
                removeStorageItem('isClockedIn');
                removeStorageItem('sessionStart');
            }
        }
         
    }, [currentUser, crm.attendance]);

    const clockIn = useCallback(async () => {
        if (!currentUser) return;
        setIsClockedIn(true);
        const now = Date.now();
        setCurrentSessionStart(now);
        setStorageItem('isClockedIn', 'true');
        setStorageItem('sessionStart', now.toString());
        resetTimerState();
        await crm.logAttendance('CLOCK_IN');
        await crm.logAudit({ action: 'CLOCK_IN', details: 'Shift Started', module: 'AUTH' });
        
        // Unified Nexus: Fire event
        NexusEventBus.publish('SHIFT_STARTED', { agentId: currentUser.id, timestamp: now });
    }, [currentUser, crm, resetTimerState]);

    const clockOut = useCallback(async () => {
        if (!currentUser || !currentSessionStart) return;
        
        // Compute exact anchored, break-subtracted, and AFK-subtracted duration (workTimeSeconds represents this exactly)
        const finalDuration = workTimeSeconds;
        
        setIsClockedIn(false);
        await crm.logAttendance('CLOCK_OUT', 'Shift End', finalDuration);
        await crm.logAudit({ action: 'CLOCK_OUT', details: `Shift Ended. Duration: ${Math.round(finalDuration / 60)}m`, module: 'AUTH' });
        
        setCurrentSessionStart(null);
        resetTimerState();
        removeStorageItem('isClockedIn');
        removeStorageItem('sessionStart');
    }, [currentUser, crm, currentSessionStart, workTimeSeconds, resetTimerState]);

    const performance = useMemo(() => {
        if (!crm.users.length) return { leaderboard: [], topPerformers: [], wallOfShame: [], myStats: null };
        
        const activeShifts: Record<string, number> = {};
        if (currentUser && isClockedIn) {
            activeShifts[currentUser.id] = shiftDuration;
        }

        const fullList = generateLeaderboard(crm.sales, crm.users, crm.attendance, crm.systemConfig, activeShifts);
        
        return {
            leaderboard: fullList,
            topPerformers: fullList.filter(a => a.isTopPerformer),
            wallOfShame: fullList.filter(a => a.isWallOfShame),
            myStats: currentUser ? fullList.find(a => a.agentId === currentUser.id) || null : null
        };
    }, [crm.sales, crm.users, crm.attendance, currentUser, crm.systemConfig, isClockedIn, shiftDuration]);

    const value = useMemo(() => ({
        ...performance,
        shiftDuration,
        isClockedIn,
        clockIn,
        clockOut
    }), [performance, shiftDuration, isClockedIn, clockIn, clockOut]);

    return (
        <CRMPerformanceContext.Provider value={value}>
            {children}
        </CRMPerformanceContext.Provider>
    );
};
