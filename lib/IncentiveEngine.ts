export const calculatePayout = (
    sales: any[],
    attendanceRecords: any[],
    sysConfig: any,
    agentId: string,
    agentOverrides?: { commissionRate?: number; shippingDeduction?: number }
) => {
    // 1. Calculate Daily Hours
    // Temporal Locking: Eligibility is based strictly on submission time to prevent midnight transition errors.
    const getDailyHours = (agentId: string, timestamp: number, records: any[]) => {
        if (!records || records.length === 0) return 0;
        const d = new Date(timestamp);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const historicalSeconds = records
            .filter((a: any) => a.agentId === agentId && a.type === 'CLOCK_OUT' && a.timestamp >= dayStart && a.timestamp < dayEnd)
            .reduce((acc: number, curr: any) => acc + (Number(curr.duration) || 0), 0);
        return Math.round((historicalSeconds / 3600) * 100) / 100;
    };

    // 2. Calculate Payout for a single sale
    const calculateSalePayout = (sale: any, dailyHours: number) => {
        const amount = Math.round((Number(sale.amount) || 0) * 100) / 100;
        const shippingDeduction = agentOverrides?.shippingDeduction !== undefined 
            ? Number(agentOverrides.shippingDeduction) 
            : (Number(sysConfig.shippingDeduction) || 0);
        
        const commissionableBasis = Math.max(0, amount - shippingDeduction);
        const rateToUse = agentOverrides?.commissionRate || Number(sysConfig.baseCommission) || 15;
        const baseCommission = Math.round(commissionableBasis * (rateToUse / 100) * 100) / 100;
        
        let maxEligibleSpiff = 0;
        let activeSpiff = null;
        
        if (sysConfig.spiffRules && sysConfig.spiffRules.length > 0) {
            for (const rule of [...sysConfig.spiffRules].sort((a,b) => b.threshold - a.threshold)) {
                if (amount >= rule.threshold && dailyHours >= rule.minHours) {
                    if (rule.amount > maxEligibleSpiff) {
                        maxEligibleSpiff = rule.amount;
                        activeSpiff = rule;
                    }
                }
            }
        }
        const net = Math.max(0, baseCommission + maxEligibleSpiff);
        return { 
            net: Math.round(net * 100) / 100, 
            commission: Math.round(baseCommission * 100) / 100, 
            commissionableBasis: Math.round(commissionableBasis * 100) / 100, 
            spiff: maxEligibleSpiff, 
            activeSpiffRule: activeSpiff,
            shippingDeduction
        };
    };

    let totalPayout = 0;
    const payouts = sales.filter(s => s.agentId === agentId && s.status === 'Approved').map(sale => {
        const submissionTime = sale.Submission_Timestamp || sale.timestamp;
        const dailyHours = getDailyHours(agentId, submissionTime, attendanceRecords);
        const payout = calculateSalePayout(sale, dailyHours);
        totalPayout += payout.net;
        return { saleId: sale.id, ...payout };
    });

    return { totalPayout, payouts };
};
