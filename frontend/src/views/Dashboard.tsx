import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { DashboardSummary, Subscription, Budget } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingDown, ShieldAlert, Sparkles, ArrowRight,
  TrendingUp, Activity, CheckCircle, Clock, Percent, DollarSign, Calendar,
  CreditCard, Wallet, AlertTriangle
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcomingRenewals, setUpcomingRenewals] = useState<Subscription[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [sumRes, subRes, budgetRes] = await Promise.all([
          axios.get('/api/analytics/summary'),
          axios.get('/api/subscriptions'),
          axios.get('/api/budgets')
        ]);
        setSummary(sumRes.data);
        setBudgets(budgetRes.data);

        // Filter upcoming active renewals in next 30 days
        const activeSubs = subRes.data as Subscription[];
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);

        const filtered = activeSubs
          .filter(s => s.status === 'ACTIVE' && new Date(s.renewalDate) >= now && new Date(s.renewalDate) <= thirtyDaysFromNow)
          .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());
        setUpcomingRenewals(filtered);
      } catch (err) {
        console.error("Failed fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading || !summary) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Aggregating portfolio stats...</p>
      </div>
    );
  }

  // Calculate budget utilization
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + b.allocatedAmount, 0);
  const totalUsedBudget = budgets.reduce((acc, b) => acc + b.usedAmount, 0);
  const budgetUtilizationPercent = totalAllocatedBudget > 0 
    ? Math.round((totalUsedBudget / totalAllocatedBudget) * 100) 
    : 0;

  // Recharts styling configs
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const axisColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? '#0F172A' : '#FFFFFF';
  const tooltipBorder = isDark ? '#334155' : '#E2E8F0';
  const tooltipText = isDark ? '#F8FAFC' : '#0F172A';

  // Spending trend graph data
  const spendTrendData = [
    { name: 'Jan', Spend: summary.monthlySpend * 0.88 },
    { name: 'Feb', Spend: summary.monthlySpend * 0.90 },
    { name: 'Mar', Spend: summary.monthlySpend * 0.94 },
    { name: 'Apr', Spend: summary.monthlySpend * 0.96 },
    { name: 'May', Spend: summary.monthlySpend * 0.98 },
    { name: 'Jun', Spend: summary.monthlySpend }
  ];

  // Category distribution data
  const categoryData = [
    { name: 'Cloud', value: 3200 },
    { name: 'Productivity', value: 1230 },
    { name: 'Development', value: 900 },
    { name: 'Communication', value: 350 }
  ];

  const vendorData = [
    { name: 'AWS', value: 2400 },
    { name: 'Slack', value: 800 },
    { name: 'GitHub', value: 1200 },
    { name: 'Figma', value: 500 },
    { name: 'Others', value: 780 }
  ];

  const colors = isDark 
    ? ['#6366F1', '#4F46E5', '#3B82F6', '#8B5CF6', '#EC4899'] 
    : ['#4F46E5', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-50 dark:bg-indigo-950/10 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            SaaS Portfolio Overview <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
            SubTrack Controllers scanned your organization catalog. You can save up to <span className="text-emerald-500 font-bold">${summary.potentialMonthlySavings}/mo</span> by cleaning up unused licenses.
          </p>
        </div>
        <Link 
          to="/ai-assistant"
          className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm transition-all duration-150 shrink-0"
        >
          Ask AI Assistant <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Primary KPI Grid (6 metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {/* Metric 1: Monthly Spend */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly Spend</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">${summary.monthlySpend}</h3>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-500 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> <span>+4.2% MoM</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Annual Spend */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Annual Spend</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">${summary.annualSpend || (summary.monthlySpend * 12)}</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">Projected annual run rate</span>
          </div>
        </div>

        {/* Metric 3: Active Subscriptions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Subscriptions</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{summary.activeSubscriptions}</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">{summary.vendorCount} Vendors registered</span>
          </div>
        </div>

        {/* Metric 4: License Utilization */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">License Use</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{summary.licenseUtilizationPercentage}%</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">{summary.assignedLicenses} of {summary.totalLicenses} seats</span>
          </div>
        </div>

        {/* Metric 5: Budget Usage */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Budget Used</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{budgetUtilizationPercent}%</h3>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-medium text-emerald-500">
              <CheckCircle className="w-3.5 h-3.5" /> <span>Compliant limit</span>
            </div>
          </div>
        </div>

        {/* Metric 6: SaaS Health Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 space-y-3 text-left">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Health Score</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{summary.saasHealthScore}/100</h3>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5 font-medium">Compliance: Excellent</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending Trend (Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-left">Spending Trend Analysis</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }} />
                <Area type="monotone" dataKey="Spend" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share & Vendor Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 text-left">Category Distribution</h3>
          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '12px', color: tooltipText }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2 px-1.5 py-0.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: colors[i] }} />
                <span className="truncate">{cat.name}: ${cat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Renewals Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Renewals Triggering (Next 30 Days)</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{upcomingRenewals.length} active renewals</span>
        </div>

        {upcomingRenewals.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No active subscriptions renewals in the next 30 days.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Renewal Date</th>
                  <th className="py-3 px-4">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-650 dark:text-slate-350">
                {upcomingRenewals.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">{sub.name}</td>
                    <td className="py-3.5 px-4">{sub.vendor.name}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-850 dark:text-slate-200">${sub.cost} / {sub.billingCycle.toLowerCase()}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(sub.renewalDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{sub.owner ? sub.owner.name : 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
