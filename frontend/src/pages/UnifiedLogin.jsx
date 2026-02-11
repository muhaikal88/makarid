import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Eye, EyeOff, AlertCircle, Mail, Lock } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useDomain } from '../contexts/DomainContext';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const UnifiedLogin = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isCustomDomain, companyName, companyLogo } = useDomain();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/unified-login`, { email, password });
      const data = response.data;
      
      // Store user info for selection page
      sessionStorage.setItem('login_data', JSON.stringify(data));
      
      // Check if needs selection
      if (data.needs_selection) {
        // Multiple companies or roles - go to selector
        navigate('/select-company', { state: { loginData: data } });
      } else {
        // Single access - auto select and create session
        const access = data.access_list[0];
        const sessionResp = await axios.post(`${API}/auth/select-company`, {
          company_id: access.company_id,
          role: access.role,
          user_table: access.user_table,
          user_id: access.user_id
        }, {
          withCredentials: true
        });
        
        // Redirect based on role
        if (access.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error(language === 'id' 
        ? 'Email atau password salah' 
        : 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/google/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-[#1e3a8a] to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {language === 'id' ? 'Login Karyawan' : 'Employee Login'}
          </h1>
          <p className="text-white/60 mt-2">Makar.id - Manajemen Karyawan</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-xl font-bold text-gray-900 text-center">
              {language === 'id' ? 'Masuk ke Akun Anda' : 'Sign In to Your Account'}
            </CardTitle>
            <CardDescription className="text-gray-500 text-center">
              {language === 'id' 
                ? 'Gunakan email dan password atau login dengan Google'
                : 'Use your email and password or sign in with Google'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 flex items-center justify-center gap-3"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium">
                {language === 'id' ? 'Masuk dengan Google' : 'Sign in with Google'}
              </span>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  {language === 'id' ? 'atau' : 'or'}
                </span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
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
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    {language === 'id' ? 'Memproses...' : 'Processing...'}
                  </span>
                ) : (
                  language === 'id' ? 'Masuk' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Info */}
            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                {language === 'id' 
                  ? 'Tidak punya akun? Hubungi administrator perusahaan Anda'
                  : "Don't have an account? Contact your company administrator"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-white/50 mt-6">
          © {new Date().getFullYear()} Makar.id
        </p>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
