import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Vendor } from '../types';
import { 
  Plus, 
  X, 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Download, 
  Building2, 
  CheckCircle,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddVendor, setShowAddVendor] = useState(false);
  
  // Table search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortField, setSortField] = useState<'name' | 'riskScore' | 'category'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    logo: true,
    name: true,
    category: true,
    risk: true,
    website: true,
    description: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const itemsPerPage = 8;

  // New Vendor Form State
  const [newVendor, setNewVendor] = useState({
    name: '',
    logoUrl: '',
    category: 'Productivity',
    riskScore: '20',
    website: '',
    description: ''
  });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/vendors');
      setVendors(res.data);
    } catch (err) {
      console.error("Failed fetching vendors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/vendors', {
        name: newVendor.name,
        logoUrl: newVendor.logoUrl,
        category: newVendor.category,
        riskScore: parseInt(newVendor.riskScore),
        website: newVendor.website,
        description: newVendor.description
      });
      setShowAddVendor(false);
      setNewVendor({
        name: '',
        logoUrl: '',
        category: 'Productivity',
        riskScore: '20',
        website: '',
        description: ''
      });
      fetchVendors();
      confetti({ particleCount: 60, spread: 50 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSort = (field: 'name' | 'riskScore' | 'category') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    alert("Exporting Vendors Catalog to Excel/CSV...");
  };

  // Filter and sort items
  const filteredVendors = vendors
    .filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === '' || v.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVendors = filteredVendors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);

  const categories = Array.from(new Set(vendors.map(v => v.category)));

  return (
    <div className="space-y-8 font-sans">
      {/* Upper Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vendors Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor vendor catalog compliance, risk ratings, and website configurations.
          </p>
        </div>
        <button
          onClick={() => setShowAddVendor(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-xs font-semibold self-start"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor database..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
          />
        </div>

        {/* Filters & Visibility */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Visibility toggle dropdown */}
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
            title="Export Vendors List"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse w-full" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse w-full" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800/60 rounded-xl animate-pulse w-full" />
        </div>
      ) : currentVendors.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center mx-auto text-slate-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No vendors catalogued</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Register active service vendors first to link them to software subscriptions and contract catalogs.
            </p>
          </div>
          <button
            onClick={() => setShowAddVendor(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            Add New Vendor
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  {visibleColumns.logo && <th className="py-4 px-6 w-16">Logo</th>}
                  {visibleColumns.name && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('category')}>
                      <div className="flex items-center gap-1.5">
                        Category <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.risk && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('riskScore')}>
                      <div className="flex items-center gap-1.5">
                        Compliance Risk <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.website && <th className="py-4 px-6">Website</th>}
                  {visibleColumns.description && <th className="py-4 px-6">Description</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-600 dark:text-slate-350">
                {currentVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                    {visibleColumns.logo && (
                      <td className="py-4 px-6">
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-lg flex items-center justify-center p-1 font-bold text-xs text-slate-800 dark:text-slate-300">
                          {vendor.logoUrl ? (
                            <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-contain" />
                          ) : (
                            vendor.name.charAt(0)
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        {vendor.name}
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-400">
                          {vendor.category}
                        </span>
                      </td>
                    )}
                    {visibleColumns.risk && (
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            vendor.riskScore > 50 ? 'bg-red-500' : vendor.riskScore > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <span className={`font-bold ${
                            vendor.riskScore > 50 ? 'text-red-500' : vendor.riskScore > 30 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>{vendor.riskScore}/100</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.website && (
                      <td className="py-4 px-6 font-mono text-xs text-slate-450 dark:text-slate-500">
                        {vendor.website ? (
                          <a href={`https://${vendor.website}`} target="_blank" rel="noreferrer" className="text-indigo-650 hover:underline">
                            {vendor.website}
                          </a>
                        ) : (
                          '--'
                        )}
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="py-4 px-6 text-xs max-w-xs truncate text-slate-400 dark:text-slate-450">
                        {vendor.description || 'No description available'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredVendors.length)} of {filteredVendors.length} entries
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

      {/* Add Vendor Modal */}
      {showAddVendor && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Register Service Vendor</h3>
              <button onClick={() => setShowAddVendor(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Vendor Name</label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
                  placeholder="Atlassian"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-700 dark:text-slate-350 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
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
                  <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Risk Rating (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newVendor.riskScore}
                    onChange={(e) => setNewVendor({ ...newVendor, riskScore: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Website URL</label>
                <input
                  type="text"
                  value={newVendor.website}
                  onChange={(e) => setNewVendor({ ...newVendor, website: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
                  placeholder="atlassian.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">Profile Description</label>
                <textarea
                  value={newVendor.description}
                  onChange={(e) => setNewVendor({ ...newVendor, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 h-20 resize-none text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
                  placeholder="Wiki databases and team collaboration software..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Register Vendor
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
