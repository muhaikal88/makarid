import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_hr-saas-mvp/artifacts/did1y7v8_ChatGPT%20Image%20Feb%205%2C%202026%2C%2001_21_17%20PM.png";

export const Sidebar = () => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/superadmin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/superadmin/admins', icon: Shield, label: language === 'id' ? 'Super Admin' : 'Super Admins' },
    { to: '/superadmin/companies', icon: Building2, label: t('companies') },
    { to: '/superadmin/users', icon: Users, label: t('users') },
    { to: '/superadmin/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1e3a8a] text-white flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-white/10 px-4 py-3">
        <img 
          src={LOGO_URL} 
          alt="Makar.id" 
          className="h-16 w-auto object-contain"
          data-testid="sidebar-logo"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            data-testid={`nav-${item.to.slice(1)}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </aside>
  );
};
