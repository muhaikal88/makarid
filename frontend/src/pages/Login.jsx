import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Globe, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Toaster } from '../components/ui/sonner';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_cea08fa0-5c14-4b0d-bcc8-350a4e47c0ce/artifacts/hf5ag1pw_LOGO%20LUCKY%20HD_page-0001.jpg";
const BG_IMAGE = "https://images.unsplash.com/photo-1588209134368-81591fd1a36c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjBnbGFzcyUyMG9mZmljZSUyMGJ1aWxkaW5nJTIwc3VubnklMjBkYXklMjBkaXZlcnNlJTIwYXNpYW4lMjBidXNpbmVzcyUyMHRlYW0lMjBtZWV0aW5nJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3MDE4NjE3OHww&ixlib=rb-4.1.0&q=85";

export const Login = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-[#2E4DA7]/80"></div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="bg-white rounded-2xl p-4 mb-8 shadow-xl">
            <img src={LOGO_URL} alt="Lucky Cell" className="h-24 w-auto" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center font-['Manrope']">
            HR Management System
          </h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            {language === 'id' 
              ? 'Kelola karyawan, kehadiran, cuti, dan penggajian dengan mudah'
              : 'Manage employees, attendance, leave, and payroll with ease'}
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Language Switcher */}
        <div className="flex justify-end p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
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

        {/* Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center pb-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6">
                <div className="bg-white rounded-xl p-3 shadow-lg border">
                  <img src={LOGO_URL} alt="Lucky Cell" className="h-16 w-auto" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 font-['Manrope']" data-testid="login-title">
                {t('loginTitle')}
              </CardTitle>
              <CardDescription className="text-gray-500">
                {t('loginSubtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" data-testid="login-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-xs text-gray-500 text-center mb-2">Demo Credentials:</p>
                  <p className="text-xs text-gray-600 text-center font-mono">
                    superadmin@luckycell.co.id / admin123
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-4 text-center text-sm text-gray-500">
          © 2025 Lucky Cell HR System. All rights reserved.
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
