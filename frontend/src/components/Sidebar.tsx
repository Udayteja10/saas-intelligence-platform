import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BarChart3, 
  Bot, 
  CreditCard, 
  Key, 
  Wallet, 
  FileText, 
  ShoppingBag, 
  Settings, 
  History, 
  LogOut,
  Sparkles,
  ClipboardList,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onSelectNav?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onSelectNav }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;

  // Sidebar navigation menu items matching requirements
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ORG_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Vendors', path: '/vendors', icon: Building2, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Licenses', path: '/licenses', icon: Key, roles: ['ORG_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Budgets', path: '/budgets', icon: Wallet, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Contracts', path: '/contracts', icon: FileText, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Requests', path: '/requests', icon: ShoppingBag, roles: ['ORG_ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Reports', path: '/reports', icon: ClipboardList, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, roles: ['ORG_ADMIN', 'MANAGER'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ORG_ADMIN', 'MANAGER', 'EMPLOYEE'] },
  ];

  // Optional: keep audit logs inside organization admin items if present originally
  const filteredItems = navItems.filter(item => item.roles.includes(role));
  
  if (role === 'ORG_ADMIN') {
    filteredItems.splice(9, 0, { name: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['ORG_ADMIN'] });
  }

  return (
    <aside 
      className={`h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 font-sans fixed left-0 top-0 z-30 transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* App Title Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">SubTrack AI</h1>
                <span className="text-[9px] text-indigo-600 dark:text-indigo-400 tracking-wider font-semibold uppercase block mt-1">
                  {role.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
          
          {/* Collapse Button */}
          {!isCollapsed && (
            <button 
              onClick={onToggle}
              className="p-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onSelectNav}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                } ${
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-700/60 shadow-sm'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100 text-slate-500 dark:text-slate-400 border border-transparent'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col gap-3">
        {isCollapsed && (
          <button 
            onClick={onToggle}
            className="mx-auto p-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-slate-950 dark:hover:text-white transition-all shadow-sm"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col gap-2' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={logout}
            className={`rounded-lg transition-colors text-slate-400 hover:text-red-500 dark:hover:text-red-400 ${
              isCollapsed ? 'p-2 hover:bg-red-500/10' : 'p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
