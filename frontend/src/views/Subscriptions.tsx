import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Subscription, Vendor, User } from '../types';
import { 
  Plus, 
  X, 
  Calendar, 
  AlertCircle, 
  Ban, 
  RefreshCw, 
  Search, 
  SlidersHorizontal, 
  Download, 
  ArrowUpDown, 
  Inbox,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddSub, setShowAddSub] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState<Subscription | null>(null);

  // Table search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState<'name' | 'cost' | 'renewalDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    vendor: true,
    category: true,
    billing: true,
    cost: true,
    renewal: true,
    status: true,
    actions: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const itemsPerPage = 8;

  // Forms state
  const [newSub, setNewSub] = useState({
    name: '',
    vendorId: '',
    category: 'Productivity',
    plan: 'Standard',
    cost: '',
    currency: 'USD',
    billingCycle: 'MONTHLY',
    startDate: '',
    renewalDate: '',
    ownerId: ''
  });

  const [renewalDateInput, setRenewalDateInput] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subRes, vendorRes, memberRes] = await Promise.all([
        axios.get('/api/subscriptions'),
        axios.get('/api/vendors'),
        axios.get('/api/organization/members')
      ]);
      setSubscriptions(subRes.data);
      setVendors(vendorRes.data);
      setMembers(memberRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`/api/subscriptions?vendorId=${newSub.vendorId}${newSub.ownerId ? `&ownerId=${newSub.ownerId}` : ''}`, {
        name: newSub.name,
        category: newSub.category,
        plan: newSub.plan,
        cost: parseFloat(newSub.cost),
        currency: newSub.currency,
        billingCycle: newSub.billingCycle,
        startDate: newSub.startDate,
        renewalDate: newSub.renewalDate,
        status: 'ACTIVE'
      });
      setShowAddSub(false);
      setNewSub({
        name: '',
        vendorId: '',
        category: 'Productivity',
        plan: 'Standard',
        cost: '',
        currency: 'USD',
        billingCycle: 'MONTHLY',
        startDate: '',
        renewalDate: '',
        ownerId: ''
      });
      fetchData();
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelSub = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await axios.put(`/api/subscriptions/${id}/cancel`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenewSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRenewModal) return;
    try {
      await axios.put(`/api/subscriptions/${showRenewModal.id}/renew`, {
        renewalDate: renewalDateInput
      });
      setShowRenewModal(null);
      fetchData();
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (field: 'name' | 'cost' | 'renewalDate') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    alert("Exporting Subscriptions to CSV/Excel...");
  };

  // Filter and sort
  const filteredSubs = subscriptions
    .filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        sub.vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || sub.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'renewalDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubs = filteredSubs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubs.length / itemsPerPage);

  const categories = Array.from(new Set(subscriptions.map(s => s.category)));

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Title section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subscriptions Catalog</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization's software licensing contracts, renewal dates, and billing intervals.
          </p>
        </div>

        <button
          onClick={() => setShowAddSub(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-xs font-semibold self-start"
        >
          <Plus className="w-4 h-4" /> Track Subscription
        </button>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search subscriptions, vendors..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Visibility Toggle dropdown */}
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
            title="Export to Excel"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Grid view / Table View */}
      {loading ? (
        /* Premium Skeleton Loader */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded-lg animate-pulse w-1/4" />
          <hr className="border-slate-200 dark:border-slate-800" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex justify-between items-center gap-4 py-2">
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/5" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/6" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/6" />
              <div className="h-5 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/12" />
            </div>
          ))}
        </div>
      ) : currentSubs.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No subscriptions tracked</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              It looks like you haven't tracked any active SaaS products yet. Register your SaaS subscriptions here to begin tracking compliance and expenses.
            </p>
          </div>
          <button
            onClick={() => setShowAddSub(true)}
            className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Create Subscription
          </button>
        </div>
      ) : (
        /* Premium Table Grid */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  {visibleColumns.name && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-855 dark:hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.vendor && <th className="py-4 px-6">Vendor</th>}
                  {visibleColumns.category && <th className="py-4 px-6">Category</th>}
                  {visibleColumns.billing && <th className="py-4 px-6">Billing</th>}
                  {visibleColumns.cost && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-855 dark:hover:text-white" onClick={() => handleSort('cost')}>
                      <div className="flex items-center gap-1.5">
                        Cost <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.renewal && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-855 dark:hover:text-white" onClick={() => handleSort('renewalDate')}>
                      <div className="flex items-center gap-1.5">
                        Renewal Date <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && <th className="py-4 px-6">Status</th>}
                  {visibleColumns.actions && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-350">
                {currentSubs.map((sub) => {
                  const isOverdue = new Date(sub.renewalDate) < new Date() && sub.status === 'ACTIVE';
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      {visibleColumns.name && (
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">{sub.name}</td>
                      )}
                      {visibleColumns.vendor && <td className="py-4 px-6">{sub.vendor.name}</td>}
                      {visibleColumns.category && (
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                            {sub.category}
                          </span>
                        </td>
                      )}
                      {visibleColumns.billing && <td className="py-4 px-6 uppercase text-[11px] font-semibold">{sub.billingCycle}</td>}
                      {visibleColumns.cost && (
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                          ${sub.cost} <span className="text-[10px] font-normal text-slate-400">({sub.currency})</span>
                        </td>
                      )}
                      {visibleColumns.renewal && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-455 dark:text-slate-500'}`} />
                            <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                              {new Date(sub.renewalDate).toLocaleDateString()}
                            </span>
                            {isOverdue && <span title="Renewal Overdue"><AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" /></span>}
                          </div>
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider ${
                            sub.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-750'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-4 px-6 text-right space-x-1.5">
                          {sub.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => {
                                  setShowRenewModal(sub);
                                  setRenewalDateInput(new Date(new Date(sub.renewalDate).setMonth(new Date(sub.renewalDate).getMonth() + 1)).toISOString().split('T')[0]);
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 hover:bg-indigo-650 dark:hover:bg-indigo-500 hover:text-white dark:hover:text-white text-indigo-600 dark:text-indigo-400 transition-all inline-flex items-center"
                                title="Renew Plan"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancelSub(sub.id)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-850 hover:bg-red-650 hover:text-white dark:hover:text-white text-red-600 dark:text-red-400 transition-all inline-flex items-center"
                                title="Cancel Plan"
                              >
                                <Ban className="w-3.5 h-3.5" />
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredSubs.length)} of {filteredSubs.length} entries
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

      {/* Add Subscription Modal */}
      {showAddSub && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-250 dark:border-slate-800 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-855 dark:text-slate-200">Track Subscription</h3>
              <button onClick={() => setShowAddSub(false)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Vendor Name</label>
                  <select
                    required
                    value={newSub.vendorId}
                    onChange={(e) => setNewSub({ ...newSub, vendorId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Subscription Name</label>
                  <input
                    type="text"
                    required
                    value={newSub.name}
                    onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="AWS Hosting"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Category</label>
                  <select
                    value={newSub.category}
                    onChange={(e) => setNewSub({ ...newSub, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-355 focus:outline-none"
                  >
                    <option value="Cloud">Cloud</option>
                    <option value="Development">Development</option>
                    <option value="Security">Security</option>
                    <option value="Productivity">Productivity</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Design">Design</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Plan Tier</label>
                  <input
                    type="text"
                    value={newSub.plan}
                    onChange={(e) => setNewSub({ ...newSub, plan: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Enterprise Plan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newSub.cost}
                    onChange={(e) => setNewSub({ ...newSub, cost: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="99.99"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Currency</label>
                  <input
                    type="text"
                    required
                    value={newSub.currency}
                    onChange={(e) => setNewSub({ ...newSub, currency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="USD"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Billing Cycle</label>
                  <select
                    value={newSub.billingCycle}
                    onChange={(e) => setNewSub({ ...newSub, billingCycle: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-855 dark:text-slate-350 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Start Date</label>
                  <input
                    type="date"
                    required
                    value={newSub.startDate}
                    onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-350 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Renewal Date</label>
                  <input
                    type="date"
                    required
                    value={newSub.renewalDate}
                    onChange={(e) => setNewSub({ ...newSub, renewalDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-855 dark:text-slate-350 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Owner / Manager</label>
                <select
                  value={newSub.ownerId}
                  onChange={(e) => setNewSub({ ...newSub, ownerId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select User</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Track Subscription
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Renew Subscription Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Renew {showRenewModal.name}</h3>
              <button onClick={() => setShowRenewModal(null)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewSub} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">New Renewal Date</label>
                <input
                  type="date"
                  required
                  value={renewalDateInput}
                  onChange={(e) => setRenewalDateInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-350 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Complete Renewal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
