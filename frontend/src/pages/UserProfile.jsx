import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Mail, Lock, Eye, EyeOff, Camera, ArrowLeft, Building2, Shield, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const UserProfile = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', picture: '' });

  // 2FA states
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile/me`, { withCredentials: true });
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        password: '',
        picture: response.data.picture || ''
      });
    } catch (error) {
      toast.error('Gagal memuat profil');
      navigate('/company-login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData = { name: formData.name, email: formData.email, picture: formData.picture || null };
      if (formData.password) updateData.password = formData.password;
      await axios.put(`${API}/profile/me`, updateData, { withCredentials: true });
      toast.success('Profil berhasil diupdate');
      fetchProfile();
      setFormData({ ...formData, password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal update profil');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Hanya file JPG atau PNG yang diperbolehkan');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await axios.post(`${API}/upload/profile-picture`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, picture: response.data.url });
      toast.success('Foto berhasil diupload');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal upload foto');
    } finally {
      setUploading(false);
    }
  };

  // 2FA Functions
  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const response = await axios.post(`${API}/profile/me/2fa/setup`, {}, { withCredentials: true });
      setTwoFASetup(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal setup 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error('Masukkan 6 digit kode');
      return;
    }
    setTwoFALoading(true);
    try {
      await axios.post(`${API}/profile/me/2fa/verify?token=${verifyCode}`, {}, { withCredentials: true });
      toast.success('Google Authenticator berhasil diaktifkan!');
      setTwoFASetup(null);
      setVerifyCode('');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Kode verifikasi salah');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast.error('Masukkan password untuk menonaktifkan 2FA');
      return;
    }
    setTwoFALoading(true);
    try {
      await axios.post(`${API}/profile/me/2fa/disable?password=${encodeURIComponent(disablePassword)}`, {}, { withCredentials: true });
      toast.success('Google Authenticator dinonaktifkan');
      setDisablePassword('');
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Password salah');
    } finally {
      setTwoFALoading(false);
    }
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const getDashboardLink = () => profile?.current_role === 'admin' ? '/admin/dashboard' : '/employee/dashboard';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={getDashboardLink()}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'id' ? 'Kembali' : 'Back'}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-[#2E4DA7]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'id' ? 'Profil Saya' : 'My Profile'}
                </h1>
                <p className="text-sm text-gray-500">{profile?.current_company?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'id' ? 'Informasi Profil' : 'Profile Information'}</CardTitle>
            <CardDescription>
              {language === 'id' ? 'Update informasi profil dan keamanan akun Anda' : 'Update your profile information and account security'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-slate-100">
                    {formData.picture ? (
                      <AvatarImage src={formData.picture} alt={formData.name} />
                    ) : (
                      <AvatarFallback className={`text-white text-2xl ${profile?.current_role === 'admin' ? 'bg-[#2E4DA7]' : 'bg-emerald-600'}`}>
                        {getInitials(formData.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleUploadPicture}
                    className="hidden"
                    data-testid="profile-picture-input"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {language === 'id' ? 'Foto Profil' : 'Profile Picture'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'id' ? 'Klik foto untuk upload. Format JPG/PNG, maks 5MB.' : 'Click photo to upload. JPG/PNG, max 5MB.'}
                  </p>
                  {formData.picture && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-red-500 hover:text-red-700 h-auto p-0"
                      onClick={() => setFormData({ ...formData, picture: '' })}
                    >
                      {language === 'id' ? 'Hapus foto' : 'Remove photo'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="grid gap-2">
                <Label htmlFor="name"><User className="w-4 h-4 inline mr-2" />{language === 'id' ? 'Nama' : 'Name'}</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="profile-name-input" />
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email"><Mail className="w-4 h-4 inline mr-2" />Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required data-testid="profile-email-input" />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password"><Lock className="w-4 h-4 inline mr-2" />{language === 'id' ? 'Password Baru' : 'New Password'}</Label>
                <div className="relative">
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={language === 'id' ? 'Kosongkan jika tidak ingin ganti' : 'Leave empty to keep current'}
                    className="pr-10" data-testid="profile-password-input"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{language === 'id' ? 'Kosongkan jika tidak ingin mengubah password' : 'Leave empty if you do not want to change password'}</p>
              </div>

              {/* Company Info */}
              {profile?.current_company && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#2E4DA7]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{language === 'id' ? 'Perusahaan Aktif' : 'Active Company'}</p>
                      <p className="text-base font-semibold text-gray-900">{profile.current_company.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(getDashboardLink())} className="flex-1">
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={saving} className="flex-1 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90" data-testid="profile-save-btn">
                  {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2FA / Google Authenticator Card - only for admins */}
        {profile?.current_role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#2E4DA7]" />
                Google Authenticator (2FA)
              </CardTitle>
              <CardDescription>
                {language === 'id'
                  ? 'Tambahkan lapisan keamanan ekstra untuk akun Anda dengan Google Authenticator'
                  : 'Add an extra layer of security to your account with Google Authenticator'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.totp_enabled ? (
                /* 2FA is ENABLED */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-800">
                        {language === 'id' ? 'Google Authenticator Aktif' : 'Google Authenticator Active'}
                      </p>
                      <p className="text-sm text-emerald-600">
                        {language === 'id' ? 'Akun Anda dilindungi dengan verifikasi 2 langkah' : 'Your account is protected with 2-step verification'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {language === 'id' ? 'Masukkan password untuk menonaktifkan 2FA:' : 'Enter password to disable 2FA:'}
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="password" value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        placeholder="Password"
                        data-testid="disable-2fa-password"
                      />
                      <Button
                        variant="destructive" onClick={handleDisable2FA} disabled={twoFALoading}
                        data-testid="disable-2fa-btn"
                      >
                        <ShieldOff className="w-4 h-4 mr-2" />
                        {twoFALoading ? '...' : (language === 'id' ? 'Nonaktifkan' : 'Disable')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : twoFASetup ? (
                /* 2FA SETUP in progress */
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {language === 'id'
                      ? '1. Scan QR code ini dengan aplikasi Google Authenticator:'
                      : '1. Scan this QR code with Google Authenticator app:'}
                  </p>
                  <div className="flex justify-center p-4 bg-white rounded-lg border">
                    <img src={twoFASetup.qr_code_url} alt="QR Code" className="w-48 h-48" data-testid="2fa-qr-code" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{language === 'id' ? 'Atau masukkan kode manual:' : 'Or enter code manually:'}</p>
                    <code className="text-sm font-mono text-[#2E4DA7] break-all">{twoFASetup.secret}</code>
                  </div>
                  <p className="text-sm text-gray-600">
                    {language === 'id'
                      ? '2. Masukkan 6 digit kode dari aplikasi untuk verifikasi:'
                      : '2. Enter the 6-digit code from the app to verify:'}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000" maxLength={6} className="text-center text-2xl tracking-widest font-mono"
                      data-testid="2fa-verify-code"
                    />
                    <Button onClick={handleVerify2FA} disabled={twoFALoading || verifyCode.length !== 6} className="bg-[#2E4DA7]" data-testid="2fa-verify-btn">
                      {twoFALoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (language === 'id' ? 'Verifikasi' : 'Verify')}
                    </Button>
                  </div>
                  <Button variant="ghost" onClick={() => { setTwoFASetup(null); setVerifyCode(''); }} className="w-full">
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </Button>
                </div>
              ) : (
                /* 2FA NOT enabled */
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <Shield className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">
                        {language === 'id' ? 'Google Authenticator Tidak Aktif' : 'Google Authenticator Inactive'}
                      </p>
                      <p className="text-sm text-amber-600">
                        {language === 'id' ? 'Aktifkan untuk keamanan akun yang lebih baik' : 'Enable for better account security'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleSetup2FA} disabled={twoFALoading} className="bg-[#2E4DA7]" data-testid="setup-2fa-btn">
                    {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                    {language === 'id' ? 'Aktifkan Google Authenticator' : 'Enable Google Authenticator'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
