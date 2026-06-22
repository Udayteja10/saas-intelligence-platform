import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { License, User, Subscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  X, 
  Key, 
  UserCheck, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  Download, 
  ArrowUpDown,
  Inbox
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Licenses: React.FC = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<License | null>(null);
  const [showTransferModal, setShowTransferModal] = useState<License | null>(null);

  // Table search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortField, setSortField] = useState<'name' | 'cost' | 'utilization'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    subscription: true,
    assignedTo: true,
    cost: true,
    utilization: true,
    status: true,
    actions: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const itemsPerPage = 8;

  // Forms state
  const [newLic, setNewLic] = useState({
    name: '',
    subscriptionId: '',
    cost: ''
  });

  const [selectedUserId, setSelectedUserId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [licRes, memberRes, subRes] = await Promise.all([
        axios.get('/api/licenses'),
        axios.get('/api/organization/members'),
        axios.get('/api/subscriptions')
      ]);
      setLicenses(licRes.data);
      setMembers(memberRes.data);
      setSubscriptions(subRes.data.filter((s: Subscription) => s.status === 'ACTIVE'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/licenses?subscriptionId=${newLic.subscriptionId}`, {
        name: newLic.name,
        cost: parseFloat(newLic.cost)
      });
      setShowAddLicense(false);
      setNewLic({ name: '', subscriptionId: '', cost: '' });
      fetchData();
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignModal) return;
    try {
      await axios.put(`/api/licenses/${showAssignModal.id}/assign`, {
        userId: parseInt(selectedUserId)
      });
      setShowAssignModal(null);
      setSelectedUserId('');
      fetchData();
      confetti({ particleCount: 55, spread: 45 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTransferModal) return;
    try {
      await axios.put(`/api/licenses/${showTransferModal.id}/transfer`, {
        userId: parseInt(selectedUserId)
      });
      setShowTransferModal(null);
      setSelectedUserId('');
      fetchData();
      confetti({ particleCount: 60, spread: 50 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeLicense = async (id: number) => {
    if (!window.confirm("Are you sure you want to revoke assignment for this seat?")) return;
    try {
      await axios.put(`/api/licenses/${id}/revoke`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (field: 'name' | 'cost' | 'utilization') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    alert("Exporting License Roster to CSV/Excel...");
  };

  // Filter licenses based on role: Employees only see their own assigned seats
  const visibleLicenses = user?.role === 'EMPLOYEE'
    ? licenses.filter(lic => lic.assignedTo?.id === user.id)
    : licenses;

  const totalSeats = visibleLicenses.length;
  const assignedSeats = visibleLicenses.filter(l => l.status === 'ASSIGNED').length;
  const availableSeats = totalSeats - assignedSeats;
  const averageUtil = totalSeats === 0 
    ? 0 
    : Math.round(visibleLicenses.reduce((acc, curr) => acc + (curr.utilizationPercentage || 0), 0) / totalSeats);

  // Filter and sort items
  const filteredLicenses = visibleLicenses
    .filter(lic => {
      const matchesSearch = lic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        lic.subscription.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lic.assignedTo?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === '' || lic.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let valA: any = a[sortField === 'utilization' ? 'utilizationPercentage' : sortField];
      let valB: any = b[sortField === 'utilization' ? 'utilizationPercentage' : sortField];

      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLicenses = filteredLicenses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SaaS License Roster</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage user seats, track capacity, and review individual seat utilization.
          </p>
        </div>
        {user?.role !== 'EMPLOYEE' && (
          <button
            onClick={() => setShowAddLicense(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-xs font-semibold self-start"
          >
            <Plus className="w-4 h-4" /> Provision Seat
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-left">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block">Total Seats Purchased</span>
          <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{totalSeats}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-left">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider block">Allocated Seats</span>
          <h4 className="text-2xl font-black text-emerald-500 mt-1.5">{assignedSeats}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-left">
          <span className="text-[10px] font-bold text-slate-455 dark:text-slate-550 uppercase tracking-wider block">Available Capacity</span>
          <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">{availableSeats}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors text-left">
          <span className="text-[10px] font-bold text-slate-455 dark:text-slate-555 uppercase tracking-wider block">Average Utilization</span>
          <h4 className="text-2xl font-black text-slate-850 dark:text-white mt-1.5">{averageUtil}%</h4>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search seats, subscriptions..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="AVAILABLE">Available</option>
          </select>

          {/* Visibility Toggle Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> Columns
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 z-30 space-y-2 text-xs">
                <span className="font-bold text-slate-400 block mb-1 uppercase tracking-wider text-[9px]">Toggle Columns</span>
                {Object.keys(visibleColumns).map((col) => (
                  <label key={col} className="flex items-center gap-2 text-slate-600 dark:text-slate-350 capitalize cursor-pointer hover:text-slate-900 dark:hover:text-white">
                    <input
                      type="checkbox"
                      checked={(visibleColumns as any)[col]}
                      onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !(prev as any)[col] }))}
                      className="rounded text-indigo-600 border-slate-300 dark:border-slate-700 bg-transparent focus:ring-0"
                    />
                    {col}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all flex items-center gap-1.5 text-xs"
            title="Export Roster to CSV"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse w-1/4" />
          <hr className="border-slate-200 dark:border-slate-800" />
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between py-2.5">
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/4" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/5" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/12" />
            </div>
          ))}
        </div>
      ) : currentLicenses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
            <Key className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No software seats allocated</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              No matching license keys or provisioned seats were found in this layout.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  {visibleColumns.name && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Seat Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.subscription && <th className="py-4 px-6">Parent Subscription</th>}
                  {visibleColumns.assignedTo && <th className="py-4 px-6">Assigned User</th>}
                  {visibleColumns.cost && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('cost')}>
                      <div className="flex items-center gap-1.5">
                        Cost <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.utilization && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('utilization')}>
                      <div className="flex items-center gap-1.5">
                        Usage Score <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && <th className="py-4 px-6">Status</th>}
                  {visibleColumns.actions && user?.role !== 'EMPLOYEE' && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-650 dark:text-slate-350">
                {currentLicenses.map((lic) => {
                  const isUnderutilized = lic.status === 'ASSIGNED' && lic.utilizationPercentage !== undefined && lic.utilizationPercentage < 30;
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      {visibleColumns.name && (
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">{lic.name}</td>
                      )}
                      {visibleColumns.subscription && <td className="py-4 px-6">{lic.subscription.name}</td>}
                      {visibleColumns.assignedTo && (
                        <td className="py-4 px-6 font-semibold">
                          {lic.assignedTo ? lic.assignedTo.name : <span className="text-slate-400 dark:text-slate-600">Unassigned</span>}
                        </td>
                      )}
                      {visibleColumns.cost && <td className="py-4 px-6 font-semibold">${lic.cost}</td>}
                      {visibleColumns.utilization && (
                        <td className="py-4 px-6">
                          {lic.status === 'ASSIGNED' ? (
                            <div className="flex items-center gap-1.5">
                              <span className={isUnderutilized ? 'text-red-500 font-bold' : ''}>
                                {lic.utilizationPercentage}%
                              </span>
                              {isUnderutilized && <span title="Idle seat waste"><AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" /></span>}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-600">-</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                            lic.status === 'ASSIGNED' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {lic.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.actions && user?.role !== 'EMPLOYEE' && (
                        <td className="py-4 px-6 text-right space-x-1.5">
                          {lic.status === 'AVAILABLE' ? (
                            <button
                              onClick={() => setShowAssignModal(lic)}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all inline-flex items-center"
                              title="Assign User"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => setShowTransferModal(lic)}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all inline-flex items-center"
                                title="Transfer Seat"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevokeLicense(lic.id)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-850 hover:bg-red-600 dark:hover:bg-red-500 hover:text-white text-red-600 dark:text-red-450 transition-all inline-flex items-center"
                                title="Revoke Seat"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredLicenses.length)} of {filteredLicenses.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-30"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add License Modal */}
      {showAddLicense && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Provision License Seat</h3>
              <button onClick={() => setShowAddLicense(false)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLicense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Subscription Plan</label>
                <select
                  required
                  value={newLic.subscriptionId}
                  onChange={(e) => setNewLic({ ...newLic, subscriptionId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-750 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select subscription</option>
                  {subscriptions.map(s => <option key={s.id} value={s.id}>{s.name} ({s.vendor.name})</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Seat Name / Key</label>
                <input
                  type="text"
                  required
                  value={newLic.name}
                  onChange={(e) => setNewLic({ ...newLic, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Seat #11"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Unit Monthly Cost</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newLic.cost}
                  onChange={(e) => setNewLic({ ...newLic, cost: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="25.00"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Provision Seat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign License Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Assign {showAssignModal.name}</h3>
              <button onClick={() => setShowAssignModal(null)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignLicense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Assignee User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-750 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select Member</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_', ' ')})</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Assign Seat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transfer License Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-805 dark:text-slate-205">Transfer {showTransferModal.name}</h3>
              <button onClick={() => setShowTransferModal(null)} className="text-slate-455 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferLicense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">New Assignee User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-750 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select Member</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} {showTransferModal.assignedTo?.id === m.id ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Complete Transfer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
