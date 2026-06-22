import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PurchaseRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Plus, X, Check, Ban, AlertCircle, Inbox } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Requests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<{ req: PurchaseRequest; action: 'approve' | 'reject' } | null>(null);

  // Forms state
  const [newRequest, setNewRequest] = useState({
    softwareName: '',
    justification: '',
    department: 'Engineering',
    priority: 'MEDIUM',
    cost: ''
  });

  const [commentInput, setCommentInput] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/requests');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await axios.post(`/api/requests?employeeId=${user.id}`, {
        softwareName: newRequest.softwareName,
        justification: newRequest.justification,
        department: newRequest.department,
        priority: newRequest.priority,
        cost: parseFloat(newRequest.cost)
      });
      setShowAddModal(false);
      setNewRequest({ softwareName: '', justification: '', department: 'Engineering', priority: 'MEDIUM', cost: '' });
      fetchRequests();
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReviewRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewAction || !user) return;
    try {
      const endpoint = `/api/requests/${reviewAction.req.id}/${reviewAction.action}?approverId=${user.id}&rejecterId=${user.id}`;
      await axios.put(endpoint, {
        comment: commentInput
      });
      setReviewAction(null);
      setCommentInput('');
      fetchRequests();
      confetti({ particleCount: 70, spread: 50 });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading request pipelines...</p>
      </div>
    );
  }

  // Segmenting lists:
  const myRequests = requests.filter(r => r.user.id === user?.id);

  const pendingRequests = requests.filter(r => {
    if (user?.role === 'MANAGER') return r.status === 'PENDING_MANAGER';
    if (user?.role === 'ORG_ADMIN') return r.status === 'PENDING_ADMIN';
    return false;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'HIGH':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'MEDIUM':
        return 'bg-amber-550/10 text-amber-600 dark:text-amber-500 border border-amber-550/20';
      case 'LOW':
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-650 dark:text-red-400 border border-red-500/20';
      case 'PENDING_MANAGER':
        return 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20';
      case 'PENDING_ADMIN':
        return 'bg-sky-500/10 text-sky-650 dark:text-sky-400 border border-sky-500/20';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60';
    }
  };

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SaaS Procurement Requests</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Submit subscription purchase requests and track workflow approvals.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-xs font-semibold self-start"
        >
          <Plus className="w-4 h-4" /> Request Software
        </button>
      </div>

      {/* Review Queue (Visible only to approvers if there are items) */}
      {user?.role !== 'EMPLOYEE' && pendingRequests.length > 0 && (
        <div className="bg-amber-500/5 dark:bg-amber-500/5 p-6 rounded-2xl border border-amber-250 dark:border-amber-900/40 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" /> Awaiting Your Approval Action ({pendingRequests.length})
          </h4>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{req.softwareName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getPriorityBadge(req.priority)}`}>{req.priority}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Requested by <span className="font-semibold text-slate-700 dark:text-slate-300">{req.user.name}</span> ({req.department}) | Cost: <span className="font-bold text-indigo-600 dark:text-indigo-400">${req.cost}</span>
                  </p>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-1.5 italic">"{req.justification}"</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewAction({ req, action: 'approve' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white rounded-lg shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setReviewAction({ req, action: 'reject' })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-[10px] font-bold text-white rounded-lg shadow-sm transition-all"
                  >
                    <Ban className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of all requests */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider">My Submissions</h4>
        </div>
        {myRequests.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs text-slate-450 dark:text-slate-500">You have not submitted any purchase requests yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  <th className="py-4 px-6">Software</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6">Est. Cost</th>
                  <th className="py-4 px-6">Approval Status</th>
                  <th className="py-4 px-6">Approver Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-650 dark:text-slate-350">
                {myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{req.softwareName}</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[200px]" title={req.justification}>{req.justification}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getPriorityBadge(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">{req.department}</td>
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">${req.cost || 0}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${getStatusBadge(req.status)}`}>
                        {req.status.replace('PENDING_', 'PENDING ').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 dark:text-slate-450 italic">
                      {req.status === 'REJECTED' 
                        ? (req.adminComment || req.managerComment || 'Rejected without comments')
                        : (req.adminComment || req.managerComment || '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Submit Procurement Request</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Software Name</label>
                <input
                  type="text"
                  required
                  value={newRequest.softwareName}
                  onChange={(e) => setNewRequest({ ...newRequest, softwareName: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Figma Professional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Est. Monthly Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newRequest.cost}
                    onChange={(e) => setNewRequest({ ...newRequest, cost: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                    placeholder="45.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Department</label>
                <select
                  value={newRequest.department}
                  onChange={(e) => setNewRequest({ ...newRequest, department: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Procurement Justification</label>
                <textarea
                  required
                  value={newRequest.justification}
                  onChange={(e) => setNewRequest({ ...newRequest, justification: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 h-20 resize-none text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Need Figma to style developer interfaces..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Submit Procurement Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {reviewAction && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 capitalize">{reviewAction.action} Request</h3>
              <button onClick={() => setReviewAction(null)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewRequestSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Reviewer Comments</label>
                <textarea
                  required
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 h-20 resize-none text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Comment reason..."
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4 ${
                  reviewAction.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-650 hover:bg-red-750'
                }`}
              >
                Submit Action
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
