import React from 'react';
import { DollarSign, BarChart3, TrendingUp, AlertCircle, Box } from 'lucide-react';

interface SupplyChainHUDProps {
    stats: {
        totalValue: number;
        avgMargin: number;
        lowStockCount: number;
    };
}

export const SupplyChainHUD: React.FC<SupplyChainHUDProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 mb-4 px-6 pt-4">
            {/* Card 1 */}
            <div className="bg-[#FFFFFF] border border-[#E1E6EF] rounded-[10px] p-[20px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between h-[108px]">
                <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wide">Asset Valuation</p>
                    <div className="w-8 h-8 rounded-full bg-[#EEF5FF] text-[#2D6AFF] flex items-center justify-center">
                        <DollarSign size={16} strokeWidth={2} />
                    </div>
                </div>
                <div>
                    <p className="text-[28px] font-bold text-[#0F1D35] leading-none mb-1">
                        ${stats.totalValue.toLocaleString()}
                    </p>
                    <div className="text-[13px] text-[#22C55E] flex items-center gap-1 font-medium">
                        <TrendingUp size={14} /> +2.4% MoM
                    </div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#FFFFFF] border border-[#E1E6EF] rounded-[10px] p-[20px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between h-[108px]">
                <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wide">Avg Portfolio Margin</p>
                    <div className="w-8 h-8 rounded-full bg-[#EEF5FF] text-[#2D6AFF] flex items-center justify-center">
                        <BarChart3 size={16} strokeWidth={2} />
                    </div>
                </div>
                <div>
                    <p className="text-[28px] font-bold text-[#0F1D35] leading-none mb-1">
                        {stats.avgMargin}%
                    </p>
                    <div className="text-[13px] text-[#22C55E] font-medium">
                        Healthy Distribution
                    </div>
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#FFFFFF] border border-[#E1E6EF] rounded-[10px] p-[20px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between h-[108px]">
                <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wide">Total Active SKUs</p>
                    <div className="w-8 h-8 rounded-full bg-[#EEF5FF] text-[#2D6AFF] flex items-center justify-center">
                        <Box size={16} strokeWidth={2} />
                    </div>
                </div>
                <div>
                    <p className="text-[28px] font-bold text-[#0F1D35] leading-none mb-1">
                        {stats.totalValue > 0 ? "70" : "0"}
                    </p>
                    <div className="text-[13px] text-[#6B7A99] font-medium">
                        Across 5 Categories
                    </div>
                </div>
            </div>
            
            {/* Card 4 (Alert) */}
            <div className="bg-[#FFFFFF] border border-[#FECACA] rounded-[10px] p-[20px_24px] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between h-[108px]">
                <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-[#6B7A99] uppercase tracking-wide">Low Stock Alerts</p>
                    <div className="w-8 h-8 rounded-full bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
                        <AlertCircle size={16} strokeWidth={2} />
                    </div>
                </div>
                <div>
                    <p className="text-[28px] font-bold text-[#EF4444] leading-none mb-1">
                        {stats.lowStockCount}
                    </p>
                    <div className="text-[13px] text-[#EF4444] font-medium">
                        Requires Attention
                    </div>
                </div>
            </div>
        </div>
    );
};
