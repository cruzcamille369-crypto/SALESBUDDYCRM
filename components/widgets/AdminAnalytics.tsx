
import React from 'react';
import { Sale } from '../../types';
import { 
    DollarSign, Zap, Target, BarChart3, TrendingUp, Filter, Calendar
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { KineticNumber } from '../ui/KineticNumber';
import { StatCard } from './analytics/StatCard';
import { TemporalHeatmap } from './analytics/TemporalHeatmap';
import { ProductMixChart } from './analytics/ProductMixChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '../ui/Base';

interface AdminAnalyticsProps {
  sales: Sale[];
}

const FUNNEL_COLORS = ['#cbd5e1', '#60a5fa', '#10b981', '#f43f5e'];

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ sales = [] }) => {
  const { timeRange, setTimeRange, metrics } = useAnalytics(sales);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 w-full overflow-visible pb-12">
        
        {/* Header Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-surface-main p-4 rounded-xl border border-border-subtle shadow-sm gap-4 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 border border-blue-500/20">
                    <BarChart3 size={24} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-xl font-bold tracking-tight text-text-primary">Data Analytics & Forecasting</h3>
                    <p className="text-sm font-medium text-text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Pipeline Intelligence • {timeRange} View
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                <div className="flex bg-surface-alt/50 p-1 rounded-xl border border-border-subtle">
                    {(['Today', 'Week', 'Month', 'All'] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                timeRange === range 
                                 ? 'bg-surface-main text-blue-600 shadow-sm ring-1 ring-slate-200' 
                                 : 'text-text-muted hover:text-text-secondary hover:bg-slate-200/50'
                            }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Total Revenue (Won)" 
                value={<KineticNumber value={metrics.totalRevenue} prefix="$" />}
                sub="Closed Deals Value" 
                icon={DollarSign} 
                color="text-emerald-500" 
                trend="+12.5%"
                sparklineData={metrics.trends.revenue}
            />
            <StatCard 
                title="Forecasted Revenue" 
                value={<KineticNumber value={metrics.forecastedRevenue} prefix="$" />}
                sub="Weighted Active Pipeline" 
                icon={TrendingUp} 
                color="text-blue-500" 
            />
            <StatCard 
                title="Win Rate" 
                value={`${metrics.conversionRate.toFixed(1)}%`} 
                sub="Lead to Closed Won" 
                icon={Zap} 
                color="text-amber-500" 
            />
            <StatCard 
                title="Average Deal Size" 
                value={<KineticNumber value={metrics.closedDealCount > 0 ? Math.round(metrics.totalRevenue / metrics.closedDealCount) : 0} prefix="$" />}
                sub="Value Per Transaction" 
                icon={Target} 
                color="text-purple-500" 
            />
        </div>

        {/* Analytics Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Funnel Conversion */}
            <Card variant="panel" className="bg-surface-main border-border-subtle shadow-sm p-0 flex flex-col min-h-[350px]">
                <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-alt/50">
                    <div>
                        <h4 className="text-base font-bold text-text-primary">Pipeline Conversion Funnel</h4>
                        <p className="text-sm text-text-muted mt-0.5">Deal progression across all stages</p>
                    </div>
                    <Filter className="text-slate-400" size={18} />
                </div>
                <div className="flex-1 p-6 relative flex items-center justify-center">
                    {metrics.funnelData && metrics.funnelData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="stage" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} width={120} />
                                <Tooltip 
                                    cursor={{fill: '#f1f5f9'}}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {metrics.funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-slate-400 text-sm font-medium">No pipeline data available</div>
                    )}
                </div>
            </Card>

            {/* Revenue Forecast */}
            <Card variant="panel" className="bg-surface-main border-border-subtle shadow-sm p-0 flex flex-col min-h-[350px]">
                <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-alt/50">
                    <div>
                        <h4 className="text-base font-bold text-text-primary">Revenue Forecast by Stage</h4>
                        <p className="text-sm text-text-muted mt-0.5">Expected value based on win probabilities</p>
                    </div>
                    <Calendar className="text-slate-400" size={18} />
                </div>
                <div className="flex-1 p-6 relative">
                    {metrics.forecastData && metrics.forecastData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.forecastData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                                    dx={-10}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, 'Expected Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="expectedRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                            No active deals to forecast
                        </div>
                    )}
                </div>
            </Card>
        </div>

        {/* Lower Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <TemporalHeatmap data={metrics.heatMap} />
            <ProductMixChart data={metrics.pieData} />
        </div>
    </div>
  );
};

