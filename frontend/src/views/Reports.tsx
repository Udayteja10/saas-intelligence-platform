import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Report } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  X, 
  Download, 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  CheckCircle,
  Inbox,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScheduledReport {
  id: number;
  name: string;
  type: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  format: 'PDF' | 'EXCEL';
  nextRun: string;
}

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduled reports mock database
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([
    { id: 1, name: "Executive Cost Optimization", type: "COST_OPTIMIZATION", frequency: "MONTHLY", format: "PDF", nextRun: "2026-07-01" },
    { id: 2, name: "Subscriptions Compliance Registry", type: "SUBSCRIPTIONS", frequency: "WEEKLY", format: "EXCEL", nextRun: "2026-06-29" },
  ]);

  // Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newReport, setNewReport] = useState({
    type: 'MONTHLY_SPEND',
    format: 'PDF'
  });
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    type: 'COST_OPTIMIZATION',
    frequency: 'MONTHLY',
    format: 'PDF'
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reports');
      setReports(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await axios.post('/api/reports/generate', {
        type: newReport.type,
        format: newReport.format,
        createdById: user.id
      });
      setShowGenerateModal(false);
      fetchReports();
      confetti({ particleCount: 60, spread: 45 });
    } catch (err) {
      console.error("Failed generating report", err);
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (newSchedule.frequency === 'DAILY' ? 1 : newSchedule.frequency === 'WEEKLY' ? 7 : 30));
    
    const newSchedItem: ScheduledReport = {
      id: Date.now(),
      name: newSchedule.name,
      type: newSchedule.type,
      frequency: newSchedule.frequency as any,
      format: newSchedule.format as any,
      nextRun: nextDate.toISOString().split('T')[0]
    };
    setScheduledReports(prev => [...prev, newSchedItem]);
    setShowScheduleModal(false);
    setNewSchedule({ name: '', type: 'COST_OPTIMIZATION', frequency: 'MONTHLY', format: 'PDF' });
    confetti({ particleCount: 50 });
  };

  const handleDownload = async (report: Report) => {
    try {
      const res = await axios.get(`/api/reports/${report.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Failed downloading report file", err);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Opening reports engine...</p>
      </div>
    );
  }

  const pdfReportTypes = [
    { value: 'MONTHLY_SPEND', label: 'Monthly Spending Report' },
    { value: 'ANNUAL_SPEND', label: 'Annual Spending Report' },
    { value: 'VENDOR_ANALYSIS', label: 'Vendor Analysis Report' },
    { value: 'BUDGET_UTILIZATION', label: 'Budget Utilization Report' },
    { value: 'RENEWAL_SCHEDULE', label: 'Renewal Schedule Report' },
    { value: 'LICENSE_UTILIZATION', label: 'License Utilization Report' },
    { value: 'HEALTH_REPORT', label: 'SaaS Health Report' },
    { value: 'COST_OPTIMIZATION', label: 'Cost Optimization Report' }
  ];

  const excelExportTypes = [
    { value: 'SUBSCRIPTIONS', label: 'Subscriptions Export' },
    { value: 'LICENSES', label: 'License Seats Export' },
    { value: 'VENDORS', label: 'Vendor Registry Export' },
    { value: 'BUDGETS', label: 'Budget Allocation Export' }
  ];

  const currentTypesList = newReport.format === 'PDF' ? pdfReportTypes : [...pdfReportTypes, ...excelExportTypes];

  return (
    <div className="space-y-10 font-sans transition-colors duration-200 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports &amp; Intelligence</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Compile PDF reporting dashboards, export spreadsheet records, and schedule automated finance alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Clock className="w-4 h-4 text-slate-550" /> Schedule Report
          </button>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Compile Report
          </button>
        </div>
      </div>

      {/* Grid of Report Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Generated Reports history</h3>
        {reports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl shadow-sm space-y-4">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-450 dark:text-slate-500">No reports compiled yet. Click 'Compile Report' to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reports.map((r) => (
              <div 
                key={r.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-48 text-left"
              >
                {/* Title & Format Icon */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shrink-0">
                      {r.format === 'PDF' 
                        ? <FileText className="w-5 h-5 text-red-500" />
                        : <FileSpreadsheet className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                      r.format === 'PDF' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {r.format}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 mt-1 leading-snug">
                    {r.name}
                  </h4>
                </div>

                {/* Date & Action */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 flex items-center justify-between mt-auto">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                    <span>Generated:</span>
                    <p className="text-slate-650 dark:text-slate-350 font-bold mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDownload(r)}
                    className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 hover:bg-indigo-650 dark:hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all"
                    title="Download Report"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Reports List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Scheduled Reports Schedules</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  <th className="py-4 px-6">Schedule Name</th>
                  <th className="py-4 px-6">Frequency</th>
                  <th className="py-4 px-6">Format</th>
                  <th className="py-4 px-6">Next Run Date</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-650 dark:text-slate-350">
                {scheduledReports.map((sched) => (
                  <tr key={sched.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">{sched.name}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {sched.frequency}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs uppercase font-semibold">{sched.format}</td>
                    <td className="py-4 px-6 font-mono text-xs">{sched.nextRun}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Compile SaaS Report</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Export Format</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewReport({ ...newReport, format: 'PDF' })}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      newReport.format === 'PDF' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    PDF Document
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewReport({ ...newReport, format: 'EXCEL' })}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                      newReport.format === 'EXCEL' 
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 shadow-sm' 
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-450 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Excel Spreadsheet
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Report Scope / Type</label>
                <select
                  required
                  value={newReport.type}
                  onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  {currentTypesList.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Compile Report Data
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Schedule SaaS Report</h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-455 hover:text-slate-805 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Schedule Name</label>
                <input
                  type="text"
                  required
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Monthly SaaS Compliance Report"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Format</label>
                  <select
                    value={newSchedule.format}
                    onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">EXCEL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Frequency</label>
                  <select
                    value={newSchedule.frequency}
                    onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Report Scope / Type</label>
                <select
                  required
                  value={newSchedule.type}
                  onChange={(e) => setNewSchedule({ ...newSchedule, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  {pdfReportTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Activate Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
