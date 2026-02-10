import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { User, Mail, Lock, Eye, EyeOff, Camera, ArrowLeft, Building2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const UserProfile = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
      const response = await axios.get(`${API}/profile/me`, {
        withCredentials: true
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
      navigate('/company-login');
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

      await axios.put(`${API}/profile/me`, updateData, {
        withCredentials: true
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

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const getDashboardLink = () => {
    if (profile?.current_role === 'admin') {
      return '/admin/dashboard';
    }
    return '/employee/dashboard';
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
                <p className="text-sm text-gray-500">
                  {profile?.current_company?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
                    <AvatarFallback className={`text-white text-2xl ${
                      profile?.current_role === 'admin' ? 'bg-[#2E4DA7]' : 'bg-emerald-600'
                    }`}>
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
                <Label htmlFor="password">
                  <Lock className="w-4 h-4 inline mr-2" />
                  {language === 'id' ? 'Password Baru' : 'New Password'}
                </Label>
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
                    ? 'Kosongkan jika tidak ingin mengubah password'
                    : 'Leave empty if you do not want to change password'}
                </p>
              </div>

              {/* Current Company Info (Read-only for context) */}
              {profile?.current_company && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#2E4DA7]" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {language === 'id' ? 'Perusahaan Aktif' : 'Active Company'}
                      </p>
                      <p className="text-base font-semibold text-gray-900">
                        {profile.current_company.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(getDashboardLink())}
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

      <Toaster position="top-right" richColors />
    </div>
  );
};
