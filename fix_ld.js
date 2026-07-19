import fs from 'fs';
const file = '/app/applet/components/leads/LeadDetail.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    // Lock lease mechanism (Collision Prevention - Flaw #4)
    useEffect(() => {
        if (!activeLead || !currentUser) return;

        const leadId = activeLead.id;
        const agentId = currentUser.id;
        const agentName = currentUser.name || 'Agent';

        // Acquire lock lease on entry
        realtimeClient.send('LEAD_LOCK_ENGAGE', {
            leadId,
            agentId,
            agentName
        });

        // Setup lease renewal heartbeat tick
        const renewalInterval = setInterval(() => {
            realtimeClient.send('LEAD_LOCK_ENGAGE', {
                leadId,
                agentId,
                agentName
            });
        }, 15000); // Renew every 15 seconds

        return () => {
            clearInterval(renewalInterval);
            realtimeClient.send('LEAD_LOCK_RELEASE', {
                leadId,
                agentId
            });
        };
    }, [activeLead, currentUser]);

    // Listen to lock broadcasts from peers via the realtime socket
    useEffect(() => {
        const handleSocketEvent = (event: any) => {
            if (event.type === 'LEAD_LOCK_UPDATE') {
                setActiveLocks(prev => ({
                    ...prev,
                    [event.payload.leadId]: {
                        agentId: event.payload.agentId,
                        agentName: event.payload.agentName,
                        expiresAt: event.payload.expiresAt
                    }
                }));
            } else if (event.type === 'LEAD_LOCK_RELEASEED') {
                setActiveLocks(prev => {
                    const copy = { ...prev };
                    delete copy[event.payload.leadId];
                    return copy;
                });
            }
        };
        const unsub = realtimeClient.subscribe(handleSocketEvent);
        return () => unsub();
    }, []);`;

// Replace lines 30 to 95 approx. Let's just find the start and end of the effects.
content = content.replace(/    \/\/ Lock lease mechanism \(Collision Prevention - Flaw #4\)[\s\S]*?    \}, \[\]\);/m, replacement);

fs.writeFileSync(file, content);
