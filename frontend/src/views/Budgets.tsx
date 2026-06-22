import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Budget } from '../types';
import { useAuth } from '../context/AuthContext';
import { Wallet, Pencil, X, AlertTriangle, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Budgets: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit budget modal state
  const [showEditBudget, setShowEditBudget] = useState<Budget | null>(null);
  const [newAllocated, setNewAllocated] = useState('');

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/budgets');
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditBudget) return;
    try {
      await axios.put(`/api/budgets/${showEditBudget.id}`, {
        allocatedAmount: parseFloat(newAllocated),
        startDate: showEditBudget.startDate,
        endDate: showEditBudget.endDate
      });
      setShowEditBudget(null);
      fetchBudgets();
      confetti({ particleCount: 40 });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading departmental budgets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Department Budgets</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Track departmental allocations against real-time subscription costs
          </p>
        </div>
      </div>

      {/* Grid of budgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((b) => {
          const percent = Math.round((b.usedAmount / b.allocatedAmount) * 100);
          const isOver = b.usedAmount > b.allocatedAmount;
          const isWarning = percent >= 90 && !isOver;

          return (
            <div 
              key={b.id} 
              className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border transition-all shadow-sm hover:shadow-md ${
                isOver 
                  ? 'border-red-200 dark:border-red-900/50 shadow-[0_4px_20px_rgba(239,68,68,0.05)]' 
                  : isWarning 
                    ? 'border-amber-200 dark:border-amber-900/50 shadow-[0_4px_20px_rgba(245,158,11,0.05)]' 
                    : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    isOver 
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400' 
                      : isWarning 
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-450' 
                        : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400'
                  }`}>
                    <Wallet className="w-5 h-5 animate-float" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.department}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">
                      Active cycle: {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {user?.role === 'ORG_ADMIN' && (
                  <button
                    onClick={() => {
                      setShowEditBudget(b);
                      setNewAllocated(b.allocatedAmount.toString());
                    }}
                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-sm"
                    title="Edit Allocation"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Budget limit metrics */}
              <div className="flex justify-between text-xs mb-3 border-b border-slate-100 dark:border-slate-800/40 pb-3 mt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Allocated Limit</span>
                  <p className="text-base font-extrabold text-slate-850 dark:text-slate-200 mt-1">${b.allocatedAmount}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Real-Time Burn</span>
                  <p className="text-base font-extrabold text-slate-850 dark:text-slate-200 mt-1">${b.usedAmount}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800/80">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                    }`} 
                    style={{ width: `${Math.min(100, percent)}%` }} 
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 dark:text-slate-500">{percent}% consumed</span>
                  {isOver ? (
                    <span className="text-red-500 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" /> Overrun: +${(b.usedAmount - b.allocatedAmount).toFixed(2)}
                    </span>
                  ) : isWarning ? (
                    <span className="text-amber-500 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Approaching threshold limit
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1.5 font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Compliant
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Budget Modal */}
      {showEditBudget && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 text-slate-850 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Reallocate Budget: {showEditBudget.department}</h3>
              <button onClick={() => setShowEditBudget(null)} className="text-slate-450 hover:text-slate-805 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Allocated Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAllocated}
                  onChange={(e) => setNewAllocated(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="50000.00"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Apply Allocation Limit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
