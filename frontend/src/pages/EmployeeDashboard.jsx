import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import {
  Building2, User, CalendarClock, FileText, Settings, LogOut, Globe, Menu, X, LayoutDashboard,
  CalendarOff, Calendar, Wallet, UserCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Toaster, toast } from 'sonner';
import { AttendancePage } from './AttendancePage';
import { EmployeeBiodata } from './EmployeeBiodata';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const sidebarMenu = [
  { id: 'attendance', label: 'Absensi', icon: CalendarClock },
  { id: 'biodata', label: 'Data Diri', icon: UserCircle },
  { id: 'leave', label: 'Cuti & Izin', icon: CalendarOff, soon: true },
  { id: 'payslip', label: 'Slip Gaji', icon: Wallet, soon: true },
];

export const EmployeeDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30); // minutes

  useEffect(() => { fetchSession(); }, []);

  // Auto-logout on idle
  useEffect(() => {
    if (!session || sessionTimeout <= 0) return;
    
    let timer;
    const timeoutMs = sessionTimeout * 60 * 1000;
    
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.info('Sesi Anda berakhir karena tidak ada aktivitas');
        handleLogout();
      }, timeoutMs);
    };
    
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();
    
    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [session, sessionTimeout]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me-session`, { withCredentials: true });
      setSession(response.data);
      
      // Fetch session timeout setting
      try {
        const settingsRes = await axios.get(`${API}/attendance/settings-public`, { withCredentials: true });
        if (settingsRes.data.session_timeout) setSessionTimeout(settingsRes.data.session_timeout);
      } catch {}
    } catch (error) {
      navigate('/company-login');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); }
    catch {}
    navigate('/company-login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div></div>;
  if (!session || session.role !== 'employee') return <Navigate to="/company-login" replace />;

  const getInitials = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="employee-dashboard">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-60 bg-white border-r z-50 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{session?.company_name}</p>
              <p className="text-[11px] text-gray-500 truncate">{session?.name}</p>
            </div>
          </div>
          <button className="lg:hidden p-1 hover:bg-slate-100 rounded" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sidebarMenu.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} disabled={item.soon}
                onClick={() => { if (!item.soon) { setActiveTab(item.id); setSidebarOpen(false); } }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-emerald-50 text-emerald-700 font-medium border-r-2 border-emerald-600' :
                  item.soon ? 'text-gray-300 cursor-not-allowed' :
                  'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.soon && <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-400 rounded-full">Segera</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-3 space-y-1">
          <button onClick={() => navigate('/employee/profile')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-slate-50 rounded-lg">
            <User className="w-4 h-4" /> Profil Saya
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg" data-testid="logout-btn">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
                {sidebarMenu.find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 text-xs" onClick={handleLogout}>
                <LogOut className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Keluar</span>
              </Button>
              <Avatar className="w-8 h-8 bg-emerald-600 cursor-pointer" onClick={() => navigate('/employee/profile')}>
                <AvatarFallback className="bg-emerald-600 text-white text-xs">{getInitials(session?.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {activeTab === 'attendance' && <AttendancePage />}
          {activeTab === 'biodata' && <EmployeeBiodata />}
          {['leave', 'payslip'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'leave' ? <CalendarOff className="w-8 h-8 text-slate-400" /> : <Wallet className="w-8 h-8 text-slate-400" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{sidebarMenu.find(i => i.id === activeTab)?.label}</h3>
              <p className="text-gray-500 text-sm">Fitur ini sedang dalam pengembangan</p>
            </div>
          )}
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
