import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HealthScore, Forecast } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldAlert, Brain, Coins, AlertCircle
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [health, setHealth] = useState<HealthScore | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [leaks, setLeaks] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [healthRes, forecastRes, leakRes] = await Promise.all([
        axios.get('/api/analytics/health-score'),
        axios.get('/api/analytics/forecast'),
        axios.get('/api/analytics/cost-leaks')
      ]);
      setHealth(healthRes.data);
      setForecasts(forecastRes.data);
      setLeaks(leakRes.data);
    } catch (err) {
      console.error("Failed fetching SaaS intelligence details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading || !health || !leaks) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Running SaaS intelligence scans...</p>
      </div>
    );
  }

  // Format forecast data for Recharts comparison
  const barChartData = forecasts.map(f => ({
    period: f.period,
    'Current Spend': f.currentSpend,
    'Projected Spend': f.projectedSpend
  }));

  const getMeterColor = (score: number) => {
    if (score >= 80) return 'stroke-emerald-500';
    if (score >= 60) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const getMeterTextBg = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-500';
    return 'text-red-500 dark:text-red-400';
  };

  // Recharts theme variables
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  const barColors = isDark 
    ? { current: '#6366F1', projected: '#38BDF8' } 
    : { current: '#4F46E5', projected: '#0284C7' };

  return (
    <div className="space-y-8 font-sans transition-colors duration-200 text-left">
      {/* SaaS Health Score Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Maturity Wheel */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white w-full text-left">SaaS Maturity Index</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* SVG Circle Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={gridColor} strokeWidth="8" opacity="0.3" />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="transparent" 
                className={getMeterColor(health.overallScore)}
                strokeWidth="8" 
                strokeDasharray={`${health.overallScore * 2.51} 251`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{health.overallScore}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">Health Rating</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[220px] leading-relaxed">
            Your score indicates high license coverage and low vendor risk, but department budgets need trimming.
          </p>
        </div>

        {/* Breakdown Meters */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Health Core Pillars</h3>
          
          <div className="space-y-4">
            {/* Budget Health */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-450">Budget Health (Spend vs Limits)</span>
                <span className={getMeterTextBg(health.budgetHealth)}>{health.budgetHealth}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/80">
                <div 
                  className={`h-full rounded-full ${health.budgetHealth >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${health.budgetHealth}%` }} 
                />
              </div>
            </div>

            {/* License Health */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-450">License Allocation & Seat Usage</span>
                <span className={getMeterTextBg(health.licenseHealth)}>{health.licenseHealth}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/80">
                <div 
                  className={`h-full rounded-full ${health.licenseHealth >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${health.licenseHealth}%` }} 
                />
              </div>
            </div>

            {/* Vendor Health */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-450">Vendor Diversity & Concentration</span>
                <span className={getMeterTextBg(health.vendorHealth)}>{health.vendorHealth}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/80">
                <div 
                  className={`h-full rounded-full ${health.vendorHealth >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                  style={{ width: `${health.vendorHealth}%` }} 
                />
              </div>
            </div>

            {/* Renewal Health */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500 dark:text-slate-450">Renewal Readiness (No Overdue Items)</span>
                <span className={getMeterTextBg(health.renewalHealth)}>{health.renewalHealth}/100</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-800/80">
                <div 
                  className={`h-full rounded-full ${health.renewalHealth >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                  style={{ width: `${health.renewalHealth}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Leak Scan Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaks summary list */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" /> Cost Leaks Detected
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              -${leaks.potentialMonthlySavings}/mo
            </span>
          </div>

          <div className="space-y-3">
            {leaks.recommendations.map((rec: string, index: number) => (
              <div key={index} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-850 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{rec}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Unused Seats List */}
          {leaks.unusedLicenses && leaks.unusedLicenses.length > 0 && (
            <div className="space-y-3 mt-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Unused Seat Assets</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-500 font-semibold uppercase">
                      <th className="py-2">Seat Name</th>
                      <th className="py-2">Subscription</th>
                      <th className="py-2 text-right">Seat Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-350">
                    {leaks.unusedLicenses.map((lic: any) => (
                      <tr key={lic.licenseId}>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{lic.name}</td>
                        <td className="py-2.5">{lic.subscriptionName}</td>
                        <td className="py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">${lic.monthlyCost}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Savings Dial */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Optimization</h3>
          
          <div className="space-y-6 my-auto text-center py-4">
            <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30">
              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Projected Annual Savings</span>
              <h4 className="text-3xl font-black text-slate-900 dark:text-white mt-2">${leaks.potentialAnnualSavings}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium">By de-provisioning available software seats</p>
            </div>

            <div className="space-y-3 text-xs text-slate-500 dark:text-slate-400 text-left">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <span>Overspent Departments</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{leaks.overspentDepartments.length} depts</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <span>Duplicate Categories</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{leaks.duplicates.length} instances</span>
              </div>
              <div className="flex justify-between pb-2">
                <span>Unallocated License Seats</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{leaks.unusedLicenses.length} seats</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spend Forecasting Block */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-float" /> Dynamic Cash Flow Projections
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">6.0% linear expansion trend</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recharts Bar Chart */}
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="period" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Current Spend" fill={barColors.current} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Projected Spend" fill={barColors.projected} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards */}
          <div className="space-y-4 flex flex-col justify-center">
            {forecasts.map((f) => (
              <div key={f.period} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/45 border border-slate-150 dark:border-slate-850 flex justify-between items-center transition-colors">
                <div>
                  <h4 className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{f.period} PROJECTION</h4>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">${f.projectedSpend}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-500">+{f.growthPercentage}% growth</span>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">from ${f.currentSpend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
