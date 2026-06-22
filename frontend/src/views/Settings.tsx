import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Organization, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, Building, Users, UserPlus, X, Trash2, CheckCircle2, Sun, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useTheme } from '../context/ThemeContext';

export const Settings: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invites modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE'
  });

  const [orgNameInput, setOrgNameInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [orgRes, memberRes] = await Promise.all([
        axios.get('/api/organization/profile'),
        axios.get('/api/organization/members')
      ]);
      setOrg(orgRes.data);
      setOrgNameInput(orgRes.data.name);
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

  const handleUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.put('/api/organization/profile', { name: orgNameInput });
      setOrg(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      confetti({ particleCount: 30 });
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/organization/invite', inviteData);
      setShowInviteModal(false);
      setInviteData({ name: '', email: '', role: 'EMPLOYEE' });
      fetchData();
      confetti({ particleCount: 50, spread: 60 });
    } catch (err) {
      console.error("Failed inviting user", err);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await axios.put(`/api/organization/members/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      console.error("Failed changing role", err);
    }
  };

  const handleDeleteMember = async (userId: number) => {
    if (!window.confirm("Are you sure you want to remove this user from the workspace?")) return;
    try {
      await axios.delete(`/api/organization/members/${userId}`);
      fetchData();
    } catch (err) {
      console.error("Failed removing member", err);
    }
  };

  if (loading || !org) {
    return (
      <div className="h-[60vh] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading settings...</p>
        </div>
      </div>
    );
  }

  const isOrgAdmin = currentUser?.role === 'ORG_ADMIN';

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Workspace Settings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure company profiles, invite members, and adjust workspace roles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Details Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Building className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" /> Workspace Profile
            </h4>

            <form onSubmit={handleUpdateOrg} className="space-y-4">
              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Organization Name</label>
                <input
                  type="text"
                  required
                  disabled={!isOrgAdmin}
                  value={orgNameInput}
                  onChange={(e) => setOrgNameInput(e.target.value)}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-xs mt-2 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tenant Scope ID</label>
                <input
                  type="text"
                  disabled
                  value={org.id}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-xs mt-2 opacity-40 cursor-not-allowed"
                />
              </div>

              {isOrgAdmin && (
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-xs font-bold text-white dark:text-slate-900 rounded-xl transition-all shadow-sm"
                >
                  Save Profile Changes
                </button>
              )}
            </form>
          </div>

          {/* Theme Preferences Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Sun className="w-4.5 h-4.5 text-indigo-650 dark:text-indigo-400" /> Appearance Preferences
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Customize the look and feel of your SubTrack enterprise workspace.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Light Mode Option */}
              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/10 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {theme === 'light' && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Light</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Clean & contrast</p>
              </button>

              {/* Dark Mode Option */}
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-950/20 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/40 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Dark</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Sleek & modern</p>
              </button>
            </div>
          </div>
        </div>

        {/* User Management Panel */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" /> Workspace Members ({members.length})
            </h4>

            {isOrgAdmin && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 rounded-xl transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" /> Invite Member
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase">
                  <th className="py-2.5">Name</th>
                  <th className="py-2.5">Email</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  {isOrgAdmin && <th className="py-2.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-200">{m.name}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{m.email}</td>
                    <td className="py-3">
                      {isOrgAdmin && m.id !== currentUser?.id ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 rounded px-2 py-1 text-[11px] outline-none"
                        >
                          <option value="ORG_ADMIN">ORG_ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-500 dark:text-slate-450">{m.role}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-450'
                          : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    {isOrgAdmin && (
                      <td className="py-3 text-right">
                        {m.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteMember(m.id)}
                            className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-650 dark:text-red-400 hover:bg-red-600 dark:hover:bg-red-650 hover:text-white dark:hover:text-white transition-all inline-flex items-center"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Invite Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Member Name</label>
                <input
                  type="text"
                  required
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-xs mt-2"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-xs mt-2"
                  placeholder="jane@company.com"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Workspace Role</label>
                <select
                  required
                  value={inviteData.role}
                  onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                  className="glass-input block w-full px-3.5 py-2.5 rounded-xl text-xs mt-2"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Can request tools)</option>
                  <option value="MANAGER">MANAGER (Can approve requests / view budgets)</option>
                  <option value="ORG_ADMIN">ORG_ADMIN (Full workspace controls)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-xs font-bold text-white dark:text-slate-900 rounded-xl shadow-lg transition-all mt-4"
              >
                Send Workspace Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
