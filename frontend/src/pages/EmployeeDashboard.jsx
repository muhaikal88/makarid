import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Building2, 
  User, 
  Calendar, 
  FileText,
  Settings,
  LogOut,
  Globe,
  Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const EmployeeDashboard = () => {
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/me-session`, {
        withCredentials: true
      });
      setSession(response.data);
    } catch (error) {
      console.error('Session error:', error);
      navigate('/company-login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/company-login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/company-login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  if (!session || session.role !== 'employee') {
    return <Navigate to="/company-login" replace />;
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EM';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Company */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">
                  {language === 'id' ? 'Portal Karyawan' : 'Employee Portal'}
                </h1>
                <p className="text-xs text-gray-500">{session.company_name}</p>
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

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8 bg-emerald-600">
                      {session.picture ? (
                        <AvatarImage src={session.picture} alt={session.name} />
                      ) : (
                        <AvatarFallback className="bg-emerald-600 text-white text-sm">
                          {getInitials(session.name)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-2 border-b">
                    <p className="font-medium text-sm">{session.name}</p>
                    <p className="text-xs text-gray-500">{session.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/employee/profile')}>
                    <User className="w-4 h-4 mr-2" /> 
                    {language === 'id' ? 'Profil' : 'Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" /> 
                    {language === 'id' ? 'Keluar' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {language === 'id' ? 'Selamat Datang!' : 'Welcome!'}
          </h2>
          <p className="text-gray-600">
            {language === 'id' 
              ? 'Portal karyawan untuk akses informasi dan layanan HR'
              : 'Employee portal for HR information and services access'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-[#2E4DA7]" />
                {language === 'id' ? 'Profil Saya' : 'My Profile'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'id' 
                  ? 'Lihat dan update informasi pribadi'
                  : 'View and update personal information'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
                {language === 'id' ? 'Cuti & Absensi' : 'Leave & Attendance'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'id' 
                  ? 'Ajukan cuti dan lihat riwayat absensi'
                  : 'Request leave and view attendance history'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-amber-600" />
                {language === 'id' ? 'Dokumen' : 'Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                {language === 'id' 
                  ? 'Akses slip gaji dan dokumen lainnya'
                  : 'Access payslips and other documents'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 mb-1">
                  {language === 'id' ? 'Portal Dalam Pengembangan' : 'Portal Under Development'}
                </p>
                <p className="text-sm text-blue-700">
                  {language === 'id' 
                    ? 'Fitur-fitur employee portal sedang dalam tahap pengembangan dan akan segera tersedia.'
                    : 'Employee portal features are under development and will be available soon.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
