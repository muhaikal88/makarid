import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Globe, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Toaster } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO_URL = "https://customer-assets.emergentagent.com/job_hr-saas-mvp/artifacts/did1y7v8_ChatGPT%20Image%20Feb%205%2C%202026%2C%2001_21_17%20PM.png";

export const Login = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, setUser, setToken } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    if (user.role === 'super_admin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    } else {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use superadmin login endpoint
      const response = await axios.post(`${API}/auth/superadmin/login`, { 
        email, 
        password 
      });
      
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      navigate('/superadmin/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#1e3a8a] to-slate-900 p-4">
      {/* Language Switcher - Fixed Top Right */}
      <div className="fixed top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10"
              data-testid="login-language-switcher"
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

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-['Manrope']">
            {language === 'id' ? 'Portal Super Admin' : 'Super Admin Portal'}
          </h1>
          <p className="text-white/60 mt-2">Lucky Cell HR Management System</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-slate-100 rounded-xl p-3">
                <img src={LOGO_URL} alt="Lucky Cell" className="h-12 w-auto" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-gray-900" data-testid="login-title">
              {t('loginTitle')}
            </CardTitle>
            <CardDescription className="text-gray-500">
              {language === 'id' 
                ? 'Masuk untuk mengelola semua perusahaan'
                : 'Sign in to manage all companies'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" data-testid="login-error">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="superadmin@luckycell.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  data-testid="login-email"
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
                    data-testid="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 text-white font-medium"
                disabled={loading}
                data-testid="login-submit"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {t('loading')}
                  </span>
                ) : (
                  t('loginButton')
                )}
              </Button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                {language === 'id' 
                  ? 'Admin perusahaan silakan login di halaman perusahaan masing-masing:'
                  : 'Company admins please login at your company page:'}
              </p>
              <p className="text-xs text-[#2E4DA7] text-center mt-1 font-mono">
                /login/[domain-perusahaan]
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white/50 mt-6">
          © {new Date().getFullYear()} Lucky Cell HR System
        </p>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
