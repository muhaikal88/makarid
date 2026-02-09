import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Building2, Briefcase, FileText, Globe, Bell, User, Settings, LogOut, LayoutDashboard, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Toaster, toast } from 'sonner';

import { OverviewTab } from '../components/admin/OverviewTab';
import { JobsTab } from '../components/admin/JobsTab';
import { ApplicationsTab } from '../components/admin/ApplicationsTab';
import { JobFormDialog } from '../components/admin/JobFormDialog';
import { AppDetailDialog } from '../components/admin/AppDetailDialog';
import { CompareDialog } from '../components/admin/CompareDialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const defaultJobForm = {
  title: '',
  department: '',
  location: '',
  job_type: 'full_time',
  description: '',
  requirements: [],
  responsibilities: [],
  salary_min: '',
  salary_max: '',
  show_salary: false,
  status: 'draft'
};

export const AdminDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Application management
  const [selectedApp, setSelectedApp] = useState(null);
  const [isAppDetailOpen, setIsAppDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [searchApp, setSearchApp] = useState('');

  // Job form
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({ ...defaultJobForm });

  // Compare
  const [compareApps, setCompareApps] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Trash
  const [trashApps, setTrashApps] = useState([]);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me-session`, { withCredentials: true });
      if (response.data.role !== 'admin') {
        navigate('/company-login');
        return;
      }
      setSession(response.data);
      setAuthLoading(false);
      fetchData();
    } catch (error) {
      navigate('/company-login');
    }
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
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } finally {
      navigate('/company-login');
    }
  };

  const handleOpenJobForm = (job = null) => {
    if (job) {
      setSelectedJob(job);
      setJobFormData({
        title: job.title,
        department: job.department || '',
        location: job.location || '',
        job_type: job.job_type,
        description: job.description,
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        salary_min: job.salary_min || '',
        salary_max: job.salary_max || '',
        show_salary: job.show_salary || false,
        status: job.status
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
      if (selectedJob) {
        await axios.put(`${API}/jobs-session/${selectedJob.id}`, jobFormData, { withCredentials: true });
        toast.success('Lowongan berhasil diupdate');
      } else {
        await axios.post(`${API}/jobs-session`, jobFormData, { withCredentials: true });
        toast.success('Lowongan berhasil ditambahkan');
      }
      setIsJobFormOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save job:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan lowongan');
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Hapus lowongan "${job.title}"?`)) return;
    try {
      await axios.delete(`${API}/jobs-session/${job.id}`, { withCredentials: true });
      toast.success('Lowongan berhasil dihapus');
      fetchData();
    } catch (error) {
      console.error('Failed to delete job:', error);
      toast.error(error.response?.data?.detail || 'Gagal menghapus lowongan');
    }
  };

  const handleOpenAppDetail = async (app) => {
    try {
      const response = await axios.get(`${API}/applications-session/${app.id}`, { withCredentials: true });
      setSelectedApp(response.data);
      setIsAppDetailOpen(true);
    } catch (error) {
      console.error('Failed to fetch application detail:', error);
      toast.error('Gagal memuat detail lamaran');
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications-session/${appId}/status?status=${newStatus}`, {}, { withCredentials: true });
      toast.success('Status berhasil diupdate');
      setIsAppDetailOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Gagal update status');
    }
  };

  const handleCompare = async (ids) => {
    try {
      const details = await Promise.all(
        ids.map(id => axios.get(`${API}/applications-session/${id}`, { withCredentials: true }).then(r => r.data))
      );
      setCompareApps(details);
      setIsCompareOpen(true);
    } catch (error) {
      console.error('Failed to fetch for compare:', error);
      toast.error('Gagal memuat data perbandingan');
    }
  };

  const handleCompareUpdateStatus = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications-session/${appId}/status?status=${newStatus}`, {}, { withCredentials: true });
      toast.success('Status berhasil diupdate');
      // Refresh compare data in-place
      setCompareApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Gagal update status');
    }
  };

  const handleDeleteApp = async (appId) => {
    try {
      await axios.delete(`${API}/applications-session/${appId}`, { withCredentials: true });
      toast.success('Lamaran dipindahkan ke tempat sampah');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus lamaran');
    }
  };

  const handleRestoreApp = async (appId) => {
    try {
      await axios.post(`${API}/applications-session/${appId}/restore`, {}, { withCredentials: true });
      toast.success('Lamaran berhasil dipulihkan');
      fetchData();
    } catch (error) {
      toast.error('Gagal memulihkan lamaran');
    }
  };

  const handlePermanentDeleteApp = async (appId) => {
    if (!window.confirm('Hapus permanen? Data tidak bisa dikembalikan.')) return;
    try {
      await axios.delete(`${API}/applications-session/${appId}/permanent`, { withCredentials: true });
      toast.success('Lamaran dihapus permanen');
      fetchData();
    } catch (error) {
      toast.error('Gagal menghapus permanen');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesJob = filterJob === 'all' || app.job_id === filterJob;
    const matchesDept = filterDepartment === 'all' || app.job_department === filterDepartment;
    const matchesSearch = !searchApp ||
      app.applicant_name?.toLowerCase().includes(searchApp.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(searchApp.toLowerCase());
    return matchesStatus && matchesJob && matchesDept && matchesSearch;
  });

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const stats = {
    totalJobs: jobs.length,
    publishedJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#2E4DA7] rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">{session?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2" data-testid="language-toggle">
                    <Globe className="w-4 h-4" />
                    <span>{language.toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('id')}>Bahasa Indonesia</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="ghost" size="icon" className="relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
                {stats.pendingApplications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E31E24] text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingApplications}
                  </span>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2" data-testid="profile-menu-btn">
                    <Avatar className="w-8 h-8 bg-[#2E4DA7]">
                      <AvatarFallback className="bg-[#2E4DA7] text-white text-sm">
                        {getInitials(session?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                    <User className="w-4 h-4 mr-2" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600" data-testid="logout-btn">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
              <LayoutDashboard className="w-4 h-4" />
              {language === 'id' ? 'Ringkasan' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2" data-testid="tab-jobs">
              <Briefcase className="w-4 h-4" />
              {language === 'id' ? 'Lowongan' : 'Jobs'}
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2" data-testid="tab-applications">
              <FileText className="w-4 h-4" />
              {language === 'id' ? 'Lamaran' : 'Applications'}
            </TabsTrigger>
            <TabsTrigger value="trash" className="flex items-center gap-2 relative" data-testid="tab-trash">
              <Trash2 className="w-4 h-4" />
              {language === 'id' ? 'Tempat Sampah' : 'Trash'}
              {trashApps.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">{trashApps.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab
              stats={stats}
              applications={applications}
              session={session}
              language={language}
              formatDate={formatDate}
              getInitials={getInitials}
            />
          </TabsContent>

          <TabsContent value="jobs">
            <JobsTab
              jobs={jobs}
              language={language}
              handleOpenJobForm={handleOpenJobForm}
              handleDeleteJob={handleDeleteJob}
            />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab
              filteredApplications={filteredApplications}
              applications={applications}
              jobs={jobs}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterJob={filterJob}
              setFilterJob={setFilterJob}
              filterDepartment={filterDepartment}
              setFilterDepartment={setFilterDepartment}
              searchApp={searchApp}
              setSearchApp={setSearchApp}
              language={language}
              handleOpenAppDetail={handleOpenAppDetail}
              handleCompare={handleCompare}
              getInitials={getInitials}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <JobFormDialog
        isOpen={isJobFormOpen}
        onClose={setIsJobFormOpen}
        selectedJob={selectedJob}
        jobFormData={jobFormData}
        setJobFormData={setJobFormData}
        handleSubmit={handleSubmitJob}
        language={language}
      />

      <AppDetailDialog
        isOpen={isAppDetailOpen}
        onClose={setIsAppDetailOpen}
        selectedApp={selectedApp}
        handleUpdateStatus={handleUpdateStatus}
        getInitials={getInitials}
      />

      <CompareDialog
        isOpen={isCompareOpen}
        onClose={setIsCompareOpen}
        compareApps={compareApps}
        handleUpdateStatus={handleCompareUpdateStatus}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
};
