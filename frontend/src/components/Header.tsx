import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Notification } from '../types';
import { 
  Bell, 
  Check, 
  ShieldAlert, 
  BadgeAlert, 
  KeyRound, 
  CalendarCheck, 
  Sun, 
  Moon, 
  Search 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return 'Dashboard';
    return path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`/api/notifications/unread?userId=${user.id}`);
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed fetching alerts", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: number) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await axios.put(`/api/notifications/read-all?userId=${user.id}`);
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'BUDGET':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case 'LICENSE':
        return <KeyRound className="w-4 h-4 text-indigo-500" />;
      case 'RENEWAL':
        return <CalendarCheck className="w-4 h-4 text-amber-500" />;
      default:
        return <BadgeAlert className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-slate-900/80 px-8 flex items-center justify-between z-20 sticky top-0 backdrop-blur-md transition-colors duration-200">
      {/* Title & Organization Name */}
      <div className="flex items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none block mb-0.5">
            Enterprise Workspace
          </span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans tracking-tight">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex items-center relative w-80 max-w-xs xl:max-w-md">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input 
          type="text"
          placeholder="Search SaaS subscriptions, contracts, requests..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all font-sans"
        />
      </div>

      {/* Controls & Profile */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-slate-900 animate-pulse" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-40 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">Alert Center</span>
                {notifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                  <p className="text-xs">All caught up! No notifications.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 flex gap-3 group relative hover:border-slate-200 dark:hover:border-slate-800 transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">{getAlertIcon(notif.type)}</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-250">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                        <span className="text-[9px] text-slate-400 dark:text-slate-650 mt-1 block">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 transition-all"
                        title="Dismiss"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-250">{user.name}</p>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-semibold">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
