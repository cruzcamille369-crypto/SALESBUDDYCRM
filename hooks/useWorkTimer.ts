/**
 * Module: Attendance_Engine | File: /hooks/useWorkTimer.ts
 * 
 * Enterprise-grade active work time tracking with shift boundary anchoring,
 * configurable break limits (max 2 hours/day), and automatic inactivity (AFK) detection.
 */
import { NexusEventBus } from '../nexus/services/NexusEventBus';
import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { getStorageItem, setStorageItem, removeStorageItem } from '../lib/storage';
import { useGlobalStore } from '../nexus/store/GlobalStore';
import { getAnchoredDurationSeconds } from '../views/utils/crmLogic';

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes (configurable default)
const MAX_BREAK_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 hours hard cap

export const useWorkTimer = (currentUser: User | null, sessionStartTime: number | null) => {
    const systemConfig = useGlobalStore(state => state.systemConfig);

    const [isOnBreak, setIsOnBreak] = useState(false);
    const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
    const [totalBreakTime, setTotalBreakTime] = useState(0);
    const [breakReason, setBreakReason] = useState<string | null>(null);
    const [workTimeSeconds, setWorkTimeSeconds] = useState(0);
    const [currentBreakDuration, setCurrentBreakDuration] = useState(0);

    // Inactivity / AFK States
    
    // Network Resilience (Offline Sync)
    const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const [isAfk, setIsAfk] = useState(() => getStorageItem('isAfk') === 'true');
    const [afkStartTime, setAfkStartTime] = useState<number | null>(() => {
        const saved = getStorageItem('afkStartTime');
        return saved ? parseInt(saved) : null;
    });
    const [totalAfkTime, setTotalAfkTime] = useState(() => {
        const saved = getStorageItem('totalAfkTime');
        return saved ? parseInt(saved) : 0;
    });

    // Refs for tracking activity without re-triggering effects
    const lastActivityTimeRef = useRef<number>(Date.now());
    const inactivityTimeoutRef = useRef<any>(null);
    const isClockedInRef = useRef<boolean>(false);

    // Update clocked in status ref
    useEffect(() => {
        const checkClockedIn = () => {
            isClockedInRef.current = getStorageItem('isClockedIn') === 'true';
        };
        checkClockedIn();
        const interval = setInterval(checkClockedIn, 1000);
        return () => clearInterval(interval);
    }, []);

    // Load initial work states from the server
    useEffect(() => {
        if (!currentUser) return;
        const tenantId = getStorageItem('nexus_server_id') || currentUser?.serverId || 'srv-001';
        fetch('/api/collections/agent_work_states', {
            headers: { 'X-Tenant-ID': tenantId, 'X-User-ID': currentUser.id }
        })
        .then(r => r.ok ? r.json() : null)
        .then((data: any) => {
            if (data && data.data) {
                const s = data.data;
                setIsOnBreak(s.is_on_break || false);
                setBreakStartTime(s.break_start_time ? new Date(s.break_start_time).getTime() : null);
                setTotalBreakTime(s.total_break_time || 0);
                setBreakReason(s.break_reason || null);
            }
        })
        .catch(console.error);
    }, [currentUser]);

    const syncState = useCallback((state: any) => {
        if (!currentUser) return;
        const tenantId = getStorageItem('nexus_server_id') || currentUser?.serverId || 'srv-001';
        fetch('/api/collections/agent_work_states', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Tenant-ID': tenantId, 'X-User-ID': currentUser.id },
            body: JSON.stringify(state)
        }).catch(console.error);
    }, [currentUser]);

    // Handle Break Toggle
    const toggleBreak = useCallback((reason?: string) => {
        if (isOnBreak) {
            // End Break
            let newTotal = totalBreakTime;
            if (breakStartTime) {
                const duration = Date.now() - breakStartTime;
                newTotal = totalBreakTime + duration;
                setTotalBreakTime(newTotal);
            }
            
            setBreakStartTime(null);
            setIsOnBreak(false);
            setBreakReason(null);
            setCurrentBreakDuration(0);
            
            syncState({
                is_on_break: false,
                break_start_time: null,
                total_break_time: newTotal,
                break_reason: null
            });
        } else {
            // Start Break (Enforce limit checks)
            const now = Date.now();
            setBreakStartTime(now);
            setIsOnBreak(true);
            
            if (reason) {
                setBreakReason(reason);
            }
            
            syncState({
                is_on_break: true,
                break_start_time: now,
                total_break_time: totalBreakTime,
                break_reason: reason || null
            });
        }
    }, [isOnBreak, breakStartTime, totalBreakTime, syncState]);

    // Reset Timer State (e.g. on Clock In / Clock Out)
    const resetTimerState = useCallback(() => {
        setIsOnBreak(false);
        setBreakStartTime(null);
        setTotalBreakTime(0);
        setBreakReason(null);
        setWorkTimeSeconds(0);
        setCurrentBreakDuration(0);
        
        setIsAfk(false);
        setAfkStartTime(null);
        setTotalAfkTime(0);
        removeStorageItem('isAfk');
        removeStorageItem('afkStartTime');
        removeStorageItem('totalAfkTime');
        
        syncState({
            is_on_break: false,
            break_start_time: null,
            total_break_time: 0,
            break_reason: null
        });
    }, [syncState]);

    // Track user activity for AFK detection
    const handleUserActivity = useCallback(() => {
        lastActivityTimeRef.current = Date.now();

        // If the user was marked as AFK, transition them back to active and log duration
        if (isAfk) {
            setIsAfk(false);
            setStorageItem('isAfk', 'false');
            
            if (afkStartTime) {
                const afkDuration = Date.now() - afkStartTime;
                const newTotalAfk = totalAfkTime + afkDuration;
                setTotalAfkTime(newTotalAfk);
                setStorageItem('totalAfkTime', newTotalAfk.toString());
            }
            setAfkStartTime(null);
            removeStorageItem('afkStartTime');
        }

        // Reset the inactivity timeout timer
        if (inactivityTimeoutRef.current) {
            clearTimeout(inactivityTimeoutRef.current);
        }

        // Only start inactivity timer if the agent is clocked in and NOT on break
        if (isClockedInRef.current && !isOnBreak) {
            inactivityTimeoutRef.current = setTimeout(() => {
                
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    console.log("[Network Resilience] Skipping AFK flag due to Offline status. Marked as Pending Connection Restoration.");
                    return;
                }
                // Enter AFK state

                setIsAfk(true);
                setStorageItem('isAfk', 'true');
                const now = Date.now();
                setAfkStartTime(now);
                setStorageItem('afkStartTime', now.toString());
                
                // Unified Nexus: Fire AFK_DETECTED event
                NexusEventBus.publish('AFK_DETECTED', { agentId: currentUser?.id, timestamp: now });
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [isAfk, afkStartTime, totalAfkTime, isOnBreak]);

    // Set up activity event listeners
    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Initialize first timeout check
        if (isClockedInRef.current && !isOnBreak) {
            inactivityTimeoutRef.current = setTimeout(() => {
                setIsAfk(true);
                setStorageItem('isAfk', 'true');
                const now = Date.now();
                setAfkStartTime(now);
                setStorageItem('afkStartTime', now.toString());
            }, INACTIVITY_TIMEOUT_MS);
        }

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current);
            }
        };
    }, [handleUserActivity, isOnBreak]);

    // Master Clock Tick - Runs every second
    useEffect(() => {
        if (!currentUser) return;

        let worker: Worker | null = null;
        let workerUrl: string | null = null;
        let fallbackInterval: any = null;

        const updateClock = () => {
            const isClockedIn = getStorageItem('isClockedIn') === 'true';
            const clockInTimeStr = getStorageItem('sessionStart');
            const clockInTime = clockInTimeStr ? parseInt(clockInTimeStr) : null;

            if (!isClockedIn || !clockInTime) {
                setWorkTimeSeconds(0);
                return;
            }

            const now = Date.now();

            // 1. Calculate Shift Boundaries (anchoring)
            const durationSeconds = getAnchoredDurationSeconds(
                clockInTime,
                now,
                systemConfig?.shiftStart,
                systemConfig?.shiftEnd,
                systemConfig?.timezone
            );

            // 2. Calculate current active break and active AFK durations
            const activeBreakDuration = isOnBreak && breakStartTime ? (now - breakStartTime) : 0;
            const activeAfkDuration = isAfk && afkStartTime ? (now - afkStartTime) : 0;

            // 3. Subtract break and AFK seconds
            const breakSeconds = Math.floor((totalBreakTime + activeBreakDuration) / 1000);
            const afkSeconds = Math.floor((totalAfkTime + activeAfkDuration) / 1000);

            // Formula: Working_Hours = (Duration_Between_Shift_Bounds) - (Break_Time) - (AFK_Time)
            const netWorkSeconds = Math.max(0, durationSeconds - breakSeconds - afkSeconds);

            setWorkTimeSeconds(netWorkSeconds);

            // Proactive warning/enforcement: If break time exceeds 2 hours, automatically end break
            if (isOnBreak && (totalBreakTime + activeBreakDuration) >= MAX_BREAK_LIMIT_MS) {
                console.warn("[Attendance:BreakManager] Daily Break limit (2 hours) reached. Resuming shift.");
                toggleBreak();
            }
        };

        try {
            const workerCode = `
                let intervalId = null;
                self.onmessage = (e) => {
                    if (e.data === 'start') {
                        if (intervalId) clearInterval(intervalId);
                        intervalId = setInterval(() => {
                            self.postMessage('tick');
                        }, 1000);
                    } else if (e.data === 'stop') {
                        if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                        }
                    }
                };
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
            worker = new Worker(workerUrl);

            worker.onmessage = () => {
                updateClock();
            };

            worker.postMessage('start');
        } catch (err) {
            console.warn('[WebWorker Timer] Fallback activated due to sandbox bounds:', err);
            fallbackInterval = setInterval(updateClock, 1000);
        }

        return () => {
            if (worker) {
                worker.postMessage('stop');
                worker.terminate();
            }
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
            if (fallbackInterval) {
                clearInterval(fallbackInterval);
            }
        };
    }, [
        currentUser,
        isOnBreak,
        breakStartTime,
        totalBreakTime,
        isAfk,
        afkStartTime,
        totalAfkTime,
        systemConfig,
        toggleBreak
    ]);

    // Break Timer Tick (Separate helper to display the current ongoing break duration in overlay)
    useEffect(() => {
        if (!isOnBreak || !breakStartTime) return;

        let worker: Worker | null = null;
        let workerUrl: string | null = null;
        let fallbackInterval: any = null;

        const updateBreakClock = () => {
            const nextDuration = Date.now() - breakStartTime;
            setCurrentBreakDuration(prev => Math.abs(prev - nextDuration) < 500 ? prev : nextDuration);
        };

        try {
            const workerCode = `
                let intervalId = null;
                self.onmessage = (e) => {
                    if (e.data === 'start') {
                        if (intervalId) clearInterval(intervalId);
                        intervalId = setInterval(() => {
                            self.postMessage('tick');
                        }, 1000);
                    } else if (e.data === 'stop') {
                        if (intervalId) {
                            clearInterval(intervalId);
                            intervalId = null;
                        }
                    }
                };
            `;
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            workerUrl = URL.createObjectURL(blob);
            worker = new Worker(workerUrl);

            worker.onmessage = () => {
                updateBreakClock();
            };

            worker.postMessage('start');
        } catch (err) {
            console.warn('[WebWorker Break Timer] Fallback activated:', err);
            fallbackInterval = setInterval(updateBreakClock, 1000);
        }

        return () => {
            if (worker) {
                worker.postMessage('stop');
                worker.terminate();
            }
            if (workerUrl) {
                URL.revokeObjectURL(workerUrl);
            }
            if (fallbackInterval) {
                clearInterval(fallbackInterval);
            }
        };
    }, [isOnBreak, breakStartTime]);

    return {
        isOnBreak,
        breakReason,
        toggleBreak,
        currentBreakDuration,
        workTimeSeconds,
        resetTimerState,
        setTotalBreakTime,
        setBreakStartTime,
        setIsOnBreak,
        isAfk,
        isOffline
    };
};
