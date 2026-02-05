import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Building2, Briefcase, Users, FileText, Settings, LogOut,
  Plus, Eye, Clock, MapPin, DollarSign, ChevronRight,
  Globe, Bell, User, LayoutDashboard, Pencil, Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const jobTypeLabels = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  internship: 'Internship'
};

export const AdminDashboard = () => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Job form states
  const [isJobFormOpen, setIsJobFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobFormData, setJobFormData] = useState({
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
  });

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me-session`, {
        withCredentials: true
      });
      
      // Verify role is admin
      if (response.data.role !== 'admin') {
        navigate('/company-login');
        return;
      }
      
      setSession(response.data);
      setAuthLoading(false);
      fetchData();
    } catch (error) {
      console.error('Session error:', error);
      navigate('/company-login');
    }
  };

  const fetchData = async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([
        axios.get(`${API}/jobs-session`, { withCredentials: true }),
        axios.get(`${API}/applications-session`, { withCredentials: true })
      ]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/company-login');
    } catch (error) {
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
      setJobFormData({
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
      });
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


  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const stats = {
    totalJobs: jobs.length,
    publishedJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    pendingApplications: applications.filter(a => a.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#2E4DA7] rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">{session?.name}</p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Language */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{language.toUpperCase()}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('id')}>
                    🇮🇩 Bahasa Indonesia
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')}>
                    🇬🇧 English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                {stats.pendingApplications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E31E24] text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingApplications}
                  </span>
                )}
              </Button>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
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
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              {language === 'id' ? 'Ringkasan' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              {language === 'id' ? 'Lowongan' : 'Jobs'}
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {language === 'id' ? 'Lamaran' : 'Applications'}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'id' ? 'Total Lowongan' : 'Total Jobs'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalJobs}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Briefcase className="w-6 h-6 text-[#2E4DA7]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'id' ? 'Lowongan Aktif' : 'Active Jobs'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.publishedJobs}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <Eye className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'id' ? 'Total Lamaran' : 'Total Applications'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalApplications}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl">
                      <FileText className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">
                        {language === 'id' ? 'Menunggu Review' : 'Pending Review'}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingApplications}</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Applications */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle>
                  {language === 'id' ? 'Lamaran Terbaru' : 'Recent Applications'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="bg-[#2E4DA7]">
                            <AvatarFallback className="bg-[#2E4DA7] text-white">
                              {getInitials(app.applicant_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{app.applicant_name}</p>
                            <p className="text-sm text-gray-500">{app.job_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                            {app.status}
                          </Badge>
                          <span className="text-sm text-gray-400">{formatDate(app.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {language === 'id' ? 'Daftar Lowongan' : 'Job Listings'}
              </h2>
              <Button 
                className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                onClick={() => handleOpenJobForm()}
              >
                <Plus className="w-4 h-4 mr-2" />
                {language === 'id' ? 'Tambah Lowongan' : 'Add Job'}
              </Button>
            </div>

            {jobs.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    {language === 'id' ? 'Belum ada lowongan' : 'No jobs yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map(job => (
                  <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                            <Badge variant={job.status === 'published' ? 'default' : 'secondary'}
                              className={job.status === 'published' ? 'bg-emerald-100 text-emerald-700' : ''}>
                              {job.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {job.department && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {job.department}
                              </span>
                            )}
                            {job.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {jobTypeLabels[job.job_type] || job.job_type}
                            </span>
                            {job.show_salary && job.salary_min && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                Rp {job.salary_min.toLocaleString()}
                                {job.salary_max && ` - ${job.salary_max.toLocaleString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#2E4DA7]">{job.application_count}</p>
                            <p className="text-sm text-gray-500">
                              {language === 'id' ? 'Lamaran' : 'Applications'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenJobForm(job)}
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJob(job)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              {language === 'id' ? 'Daftar Lamaran' : 'Applications'}
            </h2>

            {applications.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">
                    {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <Card key={app.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12 bg-[#2E4DA7]">
                            <AvatarFallback className="bg-[#2E4DA7] text-white">
                              {getInitials(app.applicant_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-gray-900">{app.applicant_name}</h3>
                            <p className="text-sm text-gray-500">{app.applicant_email}</p>
                            <p className="text-sm text-[#2E4DA7] mt-1">{app.job_title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                              {app.status}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-2">{formatDate(app.created_at)}</p>
                          </div>
                          {app.resume_url && (
                            <a 
                              href={`${process.env.REACT_APP_BACKEND_URL}${app.resume_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FileText className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>



      {/* Job Form Dialog */}
      <Dialog open={isJobFormOpen} onOpenChange={setIsJobFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJob 
                ? (language === 'id' ? 'Edit Lowongan' : 'Edit Job')
                : (language === 'id' ? 'Tambah Lowongan Baru' : 'Add New Job')}
            </DialogTitle>
            <DialogDescription>
              {language === 'id' 
                ? 'Isi informasi lowongan pekerjaan'
                : 'Fill in the job posting information'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitJob}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Judul Lowongan *</Label>
                <Input
                  id="title"
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="department">Departemen</Label>
                  <Input
                    id="department"
                    value={jobFormData.department}
                    onChange={(e) => setJobFormData({ ...jobFormData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={jobFormData.location}
                    onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                    placeholder="e.g. Jakarta"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="job_type">Tipe Pekerjaan</Label>
                <Select
                  value={jobFormData.job_type}
                  onValueChange={(value) => setJobFormData({ ...jobFormData, job_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi Pekerjaan *</Label>
                <Textarea
                  id="description"
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  placeholder="Jelaskan tanggung jawab dan kualifikasi..."
                  rows={6}
                  required
                />
              </div>

              {/* Salary Range */}
              <div className="grid gap-2">
                <Label>Range Gaji (Opsional)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    type="number"
                    value={jobFormData.salary_min}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_min: e.target.value })}
                    placeholder="Min (e.g. 3000000)"
                  />
                  <Input
                    type="number"
                    value={jobFormData.salary_max}
                    onChange={(e) => setJobFormData({ ...jobFormData, salary_max: e.target.value })}
                    placeholder="Max (e.g. 4500000)"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show_salary"
                    checked={jobFormData.show_salary}
                    onChange={(e) => setJobFormData({ ...jobFormData, show_salary: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="show_salary" className="text-sm cursor-pointer">
                    Tampilkan gaji di halaman publik
                  </Label>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={jobFormData.status}
                  onValueChange={(value) => setJobFormData({ ...jobFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Belum Dipublikasi)</SelectItem>
                    <SelectItem value="published">Published (Aktif)</SelectItem>
                    <SelectItem value="closed">Closed (Ditutup)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsJobFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90">
                {selectedJob ? 'Update' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
};
