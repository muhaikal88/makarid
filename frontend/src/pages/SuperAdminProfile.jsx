import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { User, Mail, Lock, Eye, EyeOff, Camera, RefreshCw, Shield, Key, Copy, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SuperAdminProfile = () => {
  const { language } = useLanguage();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    picture: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile/superadmin`, {
        headers: getAuthHeaders()
      });
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        password: '',
        picture: response.data.picture || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        picture: formData.picture || null
      };
      
      // Only include password if changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await axios.put(`${API}/profile/superadmin`, updateData, {
        headers: getAuthHeaders()
      });
      
      toast.success(language === 'id' ? 'Profil berhasil diupdate' : 'Profile updated successfully');
      fetchProfile();
      setFormData({ ...formData, password: '' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.detail || 'Gagal update profil');
    } finally {
      setSaving(false);

    }
  };

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()';
    
    const all = uppercase + lowercase + numbers + special;
    
    let password = '';
    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill rest randomly (total 12 characters)
    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData({ ...formData, password });
    setShowPassword(true);
    toast.success(language === 'id' ? 'Password kuat telah digenerate' : 'Strong password generated');
  };

  const handleSetup2FA = async () => {
    try {
      const response = await axios.post(`${API}/profile/superadmin/2fa/setup`, {}, {
        headers: getAuthHeaders()
      });
      setQrCodeUrl(response.data.qr_code_url);
      setTotpSecret(response.data.secret);
      setShow2FASetup(true);
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      toast.error('Gagal setup 2FA');
    }
  };

  const handleVerify2FA = async () => {
    setVerifying(true);
    try {
      await axios.post(`${API}/profile/superadmin/2fa/verify?token=${verificationCode}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('Google Authenticator berhasil diaktifkan!');
      setShow2FASetup(false);
      setVerificationCode('');
      fetchProfile();
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      toast.error(error.response?.data?.detail || 'Kode verifikasi salah');
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt(language === 'id' ? 'Masukkan password untuk disable 2FA:' : 'Enter password to disable 2FA:');
    if (!password) return;
    
    try {
      await axios.post(`${API}/profile/superadmin/2fa/disable?password=${password}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success('2FA berhasil dinonaktifkan');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Password salah');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SA';
  };

  if (loading) {
    return (
      <DashboardLayout title={language === 'id' ? 'Profil Saya' : 'My Profile'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={language === 'id' ? 'Profil Saya' : 'My Profile'}>
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Informasi Profil' : 'Profile Information'}</CardTitle>
            <CardDescription>
              {language === 'id' 
                ? 'Update informasi profil dan keamanan akun Anda'
                : 'Update your profile information and account security'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-slate-100">
                  {formData.picture ? (
                    <AvatarImage src={formData.picture} alt={formData.name} />
                  ) : (
                    <AvatarFallback className="bg-[#2E4DA7] text-white text-2xl">
                      {getInitials(formData.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="picture">{language === 'id' ? 'URL Gambar Profil' : 'Profile Picture URL'}</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="picture"
                      value={formData.picture}
                      onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'id' ? 'Masukkan URL gambar profil' : 'Enter profile picture URL'}
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  <User className="w-4 h-4 inline mr-2" />
                  {language === 'id' ? 'Nama' : 'Name'}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    <Lock className="w-4 h-4 inline mr-2" />
                    {language === 'id' ? 'Password Baru' : 'New Password'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="h-8"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={language === 'id' ? 'Kosongkan jika tidak ingin ganti' : 'Leave empty to keep current'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {language === 'id' 
                    ? 'Min 8 karakter: huruf besar, kecil, angka & simbol'
                    : 'Min 8 chars: uppercase, lowercase, number & special char'}
                </p>
              </div>

              {/* 2FA Section */}
              <div className="border-t pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Google Authenticator (2FA)
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'id' 
                        ? 'Tambah keamanan ekstra dengan verifikasi 2 langkah'
                        : 'Add extra security with 2-step verification'}
                    </p>
                  </div>
                  {profile?.totp_enabled ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDisable2FA}
                      className="text-red-600 hover:text-red-700"
                    >
                      Nonaktifkan
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetup2FA}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Aktifkan
                    </Button>
                  )}
                </div>
                
                {profile?.totp_enabled && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">
                      2FA Aktif - Akun Anda terlindungi
                    </span>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/superadmin/dashboard')}
                  className="flex-1"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                >
                  {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>


      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Setup Google Authenticator
            </DialogTitle>
            <DialogDescription>
              Scan QR code dengan aplikasi Google Authenticator
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Step 1: Download App */}
            <div>
              <p className="font-medium text-sm mb-2">1. Download Google Authenticator</p>
              <p className="text-sm text-gray-600">
                Install dari Play Store (Android) atau App Store (iOS)
              </p>
            </div>

            {/* Step 2: Scan QR */}
            <div>
              <p className="font-medium text-sm mb-2">2. Scan QR Code</p>
              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
              )}
            </div>

            {/* Manual Entry */}
            <div>
              <p className="font-medium text-sm mb-2">Atau masukkan kode manual:</p>
              <div className="flex gap-2">
                <Input value={totpSecret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(totpSecret);
                    toast.success('Secret disalin!');
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Step 3: Verify */}
            <div>
              <p className="font-medium text-sm mb-2">3. Masukkan Kode Verifikasi</p>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShow2FASetup(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleVerify2FA}
              disabled={verifying || verificationCode.length !== 6}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {verifying ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};
