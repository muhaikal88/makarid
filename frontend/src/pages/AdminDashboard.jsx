import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import {
  Building2, Briefcase, FileText, Globe, Bell, User, Settings, LogOut,
  LayoutDashboard, Trash2, ClipboardList, Users, CalendarClock, CalendarOff,
  Calendar, Wallet, ChevronLeft, Menu, X
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Toaster, toast } from 'sonner';

import { OverviewTab } from '../components/admin/OverviewTab';
import { JobsTab } from '../components/admin/JobsTab';
import { ApplicationsTab } from '../components/admin/ApplicationsTab';
import { JobFormDialog } from '../components/admin/JobFormDialog';
import { AppDetailDialog } from '../components/admin/AppDetailDialog';
import { CompareDialog } from '../components/admin/CompareDialog';
import { TrashTab } from '../components/admin/TrashTab';
import { ActivityLogTab } from '../components/admin/ActivityLogTab';
import { EmployeesTab } from '../components/admin/EmployeesTab';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const defaultJobForm = {
  title: '', department: '', location: '', job_type: 'full_time',
  description: '', requirements: [], responsibilities: [],
  salary_min: '', salary_max: '', show_salary: false, status: 'draft',
  allow_existing_applicant: true
};

const sidebarMenu = [
  { section: 'REKRUTMEN', items: [
    { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'jobs', label: 'Lowongan Kerja', icon: Briefcase },
    { id: 'applications', label: 'Lamaran Masuk', icon: FileText },
    { id: 'trash', label: 'Tempat Sampah', icon: Trash2, badge: 'trash' },
    { id: 'logs', label: 'Log Aktivitas', icon: ClipboardList },
  ]},
  { section: 'KARYAWAN', items: [
    { id: 'employees', label: 'Data Karyawan', icon: Users },
    { id: 'attendance', label: 'Absensi', icon: CalendarClock, soon: true },
    { id: 'leave', label: 'Cuti & Izin', icon: CalendarOff, soon: true },
    { id: 'holidays', label: 'Hari Libur', icon: Calendar, soon: true },
    { id: 'payroll', label: 'Penggajian', icon: Wallet, soon: true },
  ]},
];

export const AdminDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [searchApp, setSearchApp] = useState('');

  // Job form
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({ ...defaultJobForm });

  // App detail
  const [isAppDetailOpen, setIsAppDetailOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  // Compare
  const [compareApps, setCompareApps] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Trash
  const [trashApps, setTrashApps] = useState([]);

  useEffect(() => { checkSession(); }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me-session`, { withCredentials: true });
      if (response.data.role !== 'admin') { navigate('/company-login'); return; }
      setSession(response.data);
      setAuthLoading(false);
      fetchData();
    } catch { navigate('/company-login'); }
  };

  const fetchData = async () => {
    try {
      const [jobsRes, appsRes, trashRes] = await Promise.all([
        axios.get(`${API}/jobs-session`, { withCredentials: true }),
        axios.get(`${API}/applications-session`, { withCredentials: true }),
        axios.get(`${API}/applications-session-trash`, { withCredentials: true })
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      setTrashApps(trashRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); }
    finally { navigate('/company-login'); }
  };

  const handleOpenJobForm = (job = null) => {
    if (job) {
      setSelectedJob(job);
      setJobFormData({
        title: job.title, department: job.department || '', location: job.location || '',
        job_type: job.job_type, description: job.description,
        requirements: job.requirements || [], responsibilities: job.responsibilities || [],
        salary_min: job.salary_min || '', salary_max: job.salary_max || '',
        show_salary: job.show_salary || false, status: job.status,
        allow_existing_applicant: job.allow_existing_applicant !== false
      });
    } else {
      setSelectedJob(null);
      setJobFormData({ ...defaultJobForm });
    }
    setIsJobFormOpen(true);
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const cleanData = {
        ...jobFormData,
        salary_min: jobFormData.salary_min ? parseInt(jobFormData.salary_min) : null,
        salary_max: jobFormData.salary_max ? parseInt(jobFormData.salary_max) : null,
      };
      if (selectedJob) {
        await axios.put(`${API}/jobs-session/${selectedJob.id}`, cleanData, { withCredentials: true });
        toast.success('Lowongan berhasil diupdate');
      } else {
        await axios.post(`${API}/jobs-session`, cleanData, { withCredentials: true });
        toast.success('Lowongan berhasil ditambahkan');
      }
      setIsJobFormOpen(false);
      fetchData();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (detail || 'Gagal menyimpan lowongan'));
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Hapus lowongan "${job.title}"?`)) return;
    try {
      await axios.delete(`${API}/jobs-session/${job.id}`, { withCredentials: true });
      toast.success('Lowongan berhasil dihapus');
      fetchData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Gagal menghapus lowongan'); }
  };

  const handleOpenAppDetail = (app) => { setSelectedApp(app); setIsAppDetailOpen(true); };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications-session/${appId}/status`, { status: newStatus }, { withCredentials: true });
      toast.success('Status berhasil diupdate');
      fetchData();
      if (selectedApp?.id === appId) setSelectedApp({ ...selectedApp, status: newStatus });
    } catch (error) { toast.error(error.response?.data?.detail || 'Gagal update status'); }
  };

  const handleCompare = (apps) => { setCompareApps(apps); setIsCompareOpen(true); };
  const handleCompareUpdateStatus = async (appId, newStatus) => {
    await handleUpdateStatus(appId, newStatus);
    setCompareApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  const handleDeleteApp = async (appId) => {
    if (!window.confirm('Pindahkan lamaran ini ke tempat sampah?')) return;
    try {
      await axios.delete(`${API}/applications-session/${appId}`, { withCredentials: true });
      toast.success('Lamaran dipindahkan ke tempat sampah');
      fetchData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Gagal menghapus'); }
  };

  const handleRestoreApp = async (appId) => {
    try {
      await axios.post(`${API}/applications-session/${appId}/restore`, {}, { withCredentials: true });
      toast.success('Lamaran berhasil dipulihkan');
      fetchData();
    } catch (error) { toast.error('Gagal memulihkan'); }
  };

  const handlePermanentDeleteApp = async (appId) => {
    if (!window.confirm('Hapus permanen? Data tidak bisa dikembalikan.')) return;
    try {
      await axios.delete(`${API}/applications-session/${appId}/permanent`, { withCredentials: true });
      toast.success('Lamaran dihapus permanen');
      fetchData();
    } catch (error) { toast.error('Gagal menghapus'); }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const stats = {
    totalJobs: jobs.length,
    publishedJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length,
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus !== 'all' && app.status !== filterStatus) return false;
    if (filterJob !== 'all' && app.job_id !== filterJob) return false;
    if (filterDepartment !== 'all' && app.job_department !== filterDepartment) return false;
    if (searchApp) {
      const s = searchApp.toLowerCase();
      const name = (app.form_data?.full_name || app.form_data?.name || '').toLowerCase();
      const email = (app.form_data?.email || '').toLowerCase();
      if (!name.includes(s) && !email.includes(s)) return false;
    }
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" data-testid="admin-dashboard">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r z-50 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-[#2E4DA7] rounded-lg flex items-center justify-center shrink-0">
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

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sidebarMenu.map((group) => (
            <div key={group.section} className="mb-2">
              <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.section}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeCount = item.badge === 'trash' ? trashApps.length : 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!item.soon) { setActiveTab(item.id); setSidebarOpen(false); }
                    }}
                    disabled={item.soon}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      isActive ? 'bg-[#2E4DA7]/10 text-[#2E4DA7] font-medium border-r-2 border-[#2E4DA7]' :
                      item.soon ? 'text-gray-300 cursor-not-allowed' :
                      'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
                    }`}
                    data-testid={`sidebar-${item.id}`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full">{badgeCount}</span>
                    )}
                    {item.soon && (
                      <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-400 rounded-full">Segera</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t p-3 space-y-1">
          <button onClick={() => navigate('/admin/company-profile')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-slate-50 rounded-lg">
            <Building2 className="w-4 h-4" /> Profil Perusahaan
          </button>
          <button onClick={() => navigate('/admin/profile')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-slate-50 rounded-lg">
            <User className="w-4 h-4" /> Profil Saya
          </button>
          <button onClick={() => navigate('/admin/settings')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-slate-50 rounded-lg">
            <Settings className="w-4 h-4" /> Pengaturan
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg" data-testid="logout-btn">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">
                {sidebarMenu.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-8 w-8" data-testid="notifications-btn">
                <Bell className="w-4 h-4" />
                {stats.pendingApplications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E31E24] text-white text-[10px] rounded-full flex items-center justify-center">
                    {stats.pendingApplications}
                  </span>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                    <Globe className="w-4 h-4" />{language.toUpperCase()}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('id')}>Bahasa Indonesia</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Avatar className="w-8 h-8 bg-[#2E4DA7] cursor-pointer" onClick={() => navigate('/admin/profile')}>
                <AvatarFallback className="bg-[#2E4DA7] text-white text-xs">{getInitials(session?.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} applications={applications} session={session} language={language} formatDate={formatDate} getInitials={getInitials} />
          )}
          {activeTab === 'jobs' && (
            <JobsTab jobs={jobs} language={language} handleOpenJobForm={handleOpenJobForm} handleDeleteJob={handleDeleteJob} />
          )}
          {activeTab === 'applications' && (
            <ApplicationsTab
              filteredApplications={filteredApplications} applications={applications} jobs={jobs}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              filterJob={filterJob} setFilterJob={setFilterJob}
              filterDepartment={filterDepartment} setFilterDepartment={setFilterDepartment}
              searchApp={searchApp} setSearchApp={setSearchApp}
              language={language} handleOpenAppDetail={handleOpenAppDetail}
              handleCompare={handleCompare} handleDeleteApp={handleDeleteApp}
              getInitials={getInitials} formatDate={formatDate}
            />
          )}
          {activeTab === 'trash' && (
            <TrashTab trashApps={trashApps} language={language} handleRestoreApp={handleRestoreApp}
              handlePermanentDeleteApp={handlePermanentDeleteApp} getInitials={getInitials} formatDate={formatDate} />
          )}
          {activeTab === 'logs' && <ActivityLogTab language={language} />}
          {activeTab === 'employees' && <EmployeesTab language={language} />}
          {['attendance','leave','holidays','payroll'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'employees' && <Users className="w-8 h-8 text-slate-400" />}
                {activeTab === 'attendance' && <CalendarClock className="w-8 h-8 text-slate-400" />}
                {activeTab === 'leave' && <CalendarOff className="w-8 h-8 text-slate-400" />}
                {activeTab === 'holidays' && <Calendar className="w-8 h-8 text-slate-400" />}
                {activeTab === 'payroll' && <Wallet className="w-8 h-8 text-slate-400" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {sidebarMenu.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
              </h3>
              <p className="text-gray-500 text-sm">Fitur ini sedang dalam pengembangan dan akan segera tersedia.</p>
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <JobFormDialog isOpen={isJobFormOpen} onClose={setIsJobFormOpen} selectedJob={selectedJob}
        jobFormData={jobFormData} setJobFormData={setJobFormData} handleSubmit={handleSubmitJob} language={language} />
      <AppDetailDialog isOpen={isAppDetailOpen} onClose={setIsAppDetailOpen} selectedApp={selectedApp}
        handleUpdateStatus={handleUpdateStatus} getInitials={getInitials} />
      <CompareDialog isOpen={isCompareOpen} onClose={setIsCompareOpen} compareApps={compareApps}
        handleUpdateStatus={handleCompareUpdateStatus} />
      <Toaster position="top-right" richColors />
    </div>
  );
};
