import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AuditLog } from '../types';
import { History, Eye, Terminal } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/audit-logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Accessing audit registries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Enterprise Audit Trails</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review organizational events, permission role modifications, and updates logs</p>
        </div>
      </div>

      {/* Log Feed */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Log Registry</h4>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8">No audit events logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">User Context</th>
                  <th className="py-3 px-6">Action / Event</th>
                  <th className="py-3 px-6">Modified Entity</th>
                  <th className="py-3 px-6">Action Details</th>
                  <th className="py-3 px-6">Source IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-350 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/10 transition-all">
                    <td className="py-3.5 px-6 text-slate-400 dark:text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-slate-200">
                      {log.user ? log.user.name : 'System Background Job'}
                    </td>
                    <td className="py-3.5 px-6 text-indigo-600 dark:text-indigo-400 font-bold">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-450">
                      {log.entityType ? `${log.entityType} #${log.entityId}` : '-'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 font-sans max-w-[250px] truncate" title={log.details}>
                      {log.details || '-'}
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 dark:text-slate-500">
                      {log.ipAddress || '0.0.0.0'}
                    </td>
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
