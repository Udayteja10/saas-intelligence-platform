import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Contract, Vendor } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Plus, 
  X, 
  Download, 
  AlertCircle, 
  Calendar, 
  Search, 
  SlidersHorizontal,
  ArrowUpDown,
  Inbox
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Contracts: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({
    vendorId: '',
    name: '',
    version: '1.0',
    expirationDate: '',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Table search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [sortField, setSortField] = useState<'name' | 'expirationDate'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    vendor: true,
    version: true,
    file: true,
    expiration: true,
    actions: true
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const itemsPerPage = 8;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractRes, vendorRes] = await Promise.all([
        axios.get('/api/contracts'),
        axios.get('/api/vendors')
      ]);
      setContracts(contractRes.data);
      setVendors(vendorRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('vendorId', uploadData.vendorId);
    formData.append('name', uploadData.name);
    formData.append('version', uploadData.version);
    formData.append('expirationDate', uploadData.expirationDate);
    formData.append('description', uploadData.description);
    formData.append('file', selectedFile);

    try {
      await axios.post('/api/contracts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowUploadModal(false);
      setUploadData({ vendorId: '', name: '', version: '1.0', expirationDate: '', description: '' });
      setSelectedFile(null);
      fetchData();
      confetti({ particleCount: 50 });
    } catch (err) {
      console.error("Failed uploading contract", err);
    }
  };

  const handleDownload = async (contract: Contract) => {
    try {
      const res = await axios.get(`/api/contracts/${contract.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract.fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("Failed downloading contract file", err);
    }
  };

  const handleSort = (field: 'name' | 'expirationDate') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    alert("Exporting Contracts catalog to CSV/Excel...");
  };

  // Filter and sort items
  const filteredContracts = contracts
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVendor = selectedVendorId === '' || c.vendor.id.toString() === selectedVendorId;
      return matchesSearch && matchesVendor;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'expirationDate') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);

  return (
    <div className="space-y-8 font-sans transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Contract Repository</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Store master agreements, service level terms, and track expiration milestones.
          </p>
        </div>
        {user?.role !== 'EMPLOYEE' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-all duration-200 text-xs font-semibold self-start"
          >
            <Plus className="w-4 h-4" /> Upload Document
          </button>
        )}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search contracts, files..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-250 focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <select
            value={selectedVendorId}
            onChange={(e) => { setSelectedVendorId(e.target.value); setCurrentPage(1); }}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 focus:outline-none"
          >
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          {/* Visibility Dropdown */}
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
            title="Export repository catalog"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800/40 rounded animate-pulse w-1/3" />
          <hr className="border-slate-200 dark:border-slate-800" />
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-5 bg-slate-100 dark:bg-slate-805/40 rounded animate-pulse w-1/4" />
              <div className="h-5 bg-slate-100 dark:bg-slate-805/40 rounded animate-pulse w-1/6" />
            </div>
          ))}
        </div>
      ) : currentContracts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-855 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No active agreements vault</h3>
            <p className="text-xs text-slate-450 dark:text-slate-500 leading-relaxed">
              No files or executed agreements are registered. Upload your vendor service contract documents to begin.
            </p>
          </div>
          {user?.role !== 'EMPLOYEE' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              Upload Contract
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-950/20">
                  {visibleColumns.name && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">
                        Agreement Name <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.vendor && <th className="py-4 px-6">Vendor</th>}
                  {visibleColumns.version && <th className="py-4 px-6">Version</th>}
                  {visibleColumns.file && <th className="py-4 px-6">File Reference</th>}
                  {visibleColumns.expiration && (
                    <th className="py-4 px-6 cursor-pointer hover:text-slate-800 dark:hover:text-white" onClick={() => handleSort('expirationDate')}>
                      <div className="flex items-center gap-1.5">
                        Expiration Date <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.actions && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-650 dark:text-slate-350">
                {currentContracts.map((c) => {
                  const daysToExpiry = Math.ceil((new Date(c.expirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isExpiring = daysToExpiry <= 30 && daysToExpiry > 0;
                  const isExpired = daysToExpiry <= 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                      {visibleColumns.name && (
                        <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                      )}
                      {visibleColumns.vendor && <td className="py-4 px-6">{c.vendor.name}</td>}
                      {visibleColumns.version && <td className="py-4 px-6 uppercase text-xs">v{c.version || '1.0'}</td>}
                      {visibleColumns.file && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[150px]" title={c.fileName}>{c.fileName}</span>
                          </div>
                        </td>
                      )}
                      {visibleColumns.expiration && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`w-3.5 h-3.5 ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-slate-450 dark:text-slate-500'}`} />
                            <span className={isExpired ? 'text-red-500 font-bold' : isExpiring ? 'text-amber-500 font-semibold' : ''}>
                              {new Date(c.expirationDate).toLocaleDateString()}
                            </span>
                            {isExpired ? (
                              <span title="Agreement Expired"><AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" /></span>
                            ) : isExpiring ? (
                              <span title="Expiring soon"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>
                            ) : null}
                          </div>
                        </td>
                      )}
                      {visibleColumns.actions && (
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDownload(c)}
                            className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-850 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 transition-all inline-flex items-center"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
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
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredContracts.length)} of {filteredContracts.length} entries
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-805 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Upload Vendor Agreement</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-450 hover:text-slate-800 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadContract} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Vendor</label>
                <select
                  required
                  value={uploadData.vendorId}
                  onChange={(e) => setUploadData({ ...uploadData, vendorId: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-750 dark:text-slate-300 focus:outline-none"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Agreement Title</label>
                <input
                  type="text"
                  required
                  value={uploadData.name}
                  onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Atlassian Enterprise Contract"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Version</label>
                  <input
                    type="text"
                    required
                    value={uploadData.version}
                    onChange={(e) => setUploadData({ ...uploadData, version: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-850 dark:text-slate-200 focus:outline-none"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Expiration Date</label>
                  <input
                    type="date"
                    required
                    value={uploadData.expirationDate}
                    onChange={(e) => setUploadData({ ...uploadData, expirationDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 text-slate-800 dark:text-slate-350 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Contract Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl text-xs mt-2 h-16 resize-none text-slate-850 dark:text-slate-200 focus:outline-none"
                  placeholder="Negotiated master pricing structure..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase">Document File (PDF / DOC)</label>
                <input
                  type="file"
                  required
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-550 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 file:cursor-pointer hover:file:bg-slate-200 dark:hover:file:bg-slate-700/80 transition-all mt-2"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-xl shadow-lg transition-all mt-4"
              >
                Upload to Vault
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
