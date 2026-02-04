import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Globe, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CompanyLogin = () => {
  const { domain } = useParams();
  const { t, language, setLanguage } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompany();
  }, [domain]);

  const fetchCompany = async () => {
    try {
      const response = await axios.get(`${API}/public/company/${domain}`);
      setCompany(response.data);
    } catch (err) {
      setError('Company not found');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already logged in
  if (user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setSubmitting(true);

    try {
      const userData = await login(email, password);
      
      // Check if user belongs to this company
      if (userData.role === 'super_admin') {
        setLoginError(language === 'id' 
          ? 'Super Admin harus login di halaman utama' 
          : 'Super Admin must login on main page');
        return;
      }
      
      // Verify company_id matches
      if (userData.company_id !== company.id) {
        setLoginError(language === 'id' 
          ? 'Akun tidak terdaftar di perusahaan ini' 
          : 'Account not registered with this company');
        return;
      }
      
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setLoginError(t('loginError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {language === 'id' ? 'Perusahaan Tidak Ditemukan' : 'Company Not Found'}
          </h1>
          <p className="text-gray-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Company Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#2E4DA7] to-[#1e3a8a]"
        style={company?.cover_image ? {
          backgroundImage: `url(${company.cover_image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        <div className="absolute inset-0 bg-[#2E4DA7]/85"></div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {company?.logo_url ? (
            <div className="bg-white rounded-2xl p-4 mb-8 shadow-xl">
              <img src={company.logo_url} alt={company.name} className="h-24 w-auto object-contain" />
            </div>
          ) : (
            <div className="bg-white/20 rounded-2xl p-6 mb-8">
              <Building2 className="w-16 h-16 text-white" />
            </div>
          )}
          <h1 className="text-3xl font-bold mb-2 text-center font-['Manrope']">
            {company?.name}
          </h1>
          {company?.tagline && (
            <p className="text-lg text-white/80 text-center mb-6">{company.tagline}</p>
          )}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-md">
            <p className="text-white/90 text-center text-sm">
              {language === 'id' 
                ? 'Portal karyawan untuk akses kehadiran, cuti, dan informasi perusahaan'
                : 'Employee portal for attendance, leave, and company information'}
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white">
        {/* Language Switcher */}
        <div className="flex justify-end p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                data-testid="company-login-language-switcher"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{language.toUpperCase()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => setLanguage('id')}
                className={language === 'id' ? 'bg-slate-100' : ''}
              >
                <span className="mr-2">🇮🇩</span> Bahasa Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-slate-100' : ''}
              >
                <span className="mr-2">🇬🇧</span> English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center pb-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6">
                {company?.logo_url ? (
                  <div className="bg-white rounded-xl p-3 shadow-lg border">
                    <img src={company.logo_url} alt={company.name} className="h-16 w-auto object-contain" />
                  </div>
                ) : (
                  <div className="bg-slate-100 rounded-xl p-4">
                    <Building2 className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 font-['Manrope']" data-testid="company-login-title">
                {language === 'id' ? 'Login Karyawan' : 'Employee Login'}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {company?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {loginError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" data-testid="company-login-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={`admin@${domain}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    data-testid="company-login-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">{t('password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                      data-testid="company-login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 text-white font-medium"
                  disabled={submitting}
                  data-testid="company-login-submit"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {t('loading')}
                    </span>
                  ) : (
                    t('loginButton')
                  )}
                </Button>
              </form>

              {/* Links */}
              <div className="mt-6 pt-6 border-t text-center space-y-3">
                <a 
                  href={`/careers/${domain}`}
                  className="text-sm text-[#2E4DA7] hover:underline block"
                >
                  {language === 'id' ? 'Lihat Lowongan Kerja' : 'View Job Openings'}
                </a>
                <a 
                  href={`/company/${domain}`}
                  className="text-sm text-gray-500 hover:text-gray-700 block"
                >
                  {language === 'id' ? 'Tentang Perusahaan' : 'About Company'}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} {company?.name}. Powered by Lucky Cell HR System.
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
