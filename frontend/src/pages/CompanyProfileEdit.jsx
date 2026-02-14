import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Building2, Camera, Loader2, Save, Plus, X, ExternalLink } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const CompanyProfileEdit = () => {
  const { language } = useLanguage();
  const logoInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [session, setSession] = useState(null);

  const [info, setInfo] = useState({ name: '', address: '', phone: '', email: '', logo_url: '' });
  const [profile, setProfile] = useState({
    tagline: '', description: '', vision: '', mission: '',
    history: '', culture: '', benefits: [], social_links: {}
  });
  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sessionRes, profileRes] = await Promise.all([
        axios.get(`${API}/auth/me-session`, { withCredentials: true }),
        axios.get(`${API}/company-profile-session`, { withCredentials: true })
      ]);
      setSession(sessionRes.data);
      const d = profileRes.data;
      setInfo({ name: d.name || '', address: d.address || '', phone: d.phone || '', email: d.email || '', logo_url: d.logo_url || '' });
      setProfile({
        tagline: d.tagline || '', description: d.description || '', vision: d.vision || '', mission: d.mission || '',
        history: d.history || '', culture: d.culture || '', benefits: d.benefits || [], social_links: d.social_links || {}
      });
    } catch (error) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Hanya JPG/PNG'); return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/upload/profile-picture`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setInfo({ ...info, logo_url: res.data.url });
      toast.success('Logo berhasil diupload');
    } catch (err) {
      toast.error('Gagal upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company-info-session-json`, info, { withCredentials: true });
      toast.success('Informasi perusahaan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company-profile-session`, profile, { withCredentials: true });
      toast.success('Profil perusahaan berhasil disimpan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const addBenefit = () => {
    if (!newBenefit.trim()) return;
    setProfile({ ...profile, benefits: [...profile.benefits, newBenefit.trim()] });
    setNewBenefit('');
  };

  const removeBenefit = (i) => {
    setProfile({ ...profile, benefits: profile.benefits.filter((_, idx) => idx !== i) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div>
      </div>
    );
  }

  const previewUrl = session?.company_slug ? `/company/${session.company_slug}` : '#';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Button>
              </Link>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#2E4DA7]" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profil Perusahaan</h1>
                  <p className="text-sm text-gray-500">Edit halaman profil publik perusahaan Anda</p>
                </div>
              </div>
            </div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-2" />Preview</Button>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Nama, alamat, kontak, dan logo perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {info.logo_url ? (
                    <img src={info.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png" onChange={handleUploadLogo} className="hidden" />
              </div>
              <div>
                <p className="text-sm font-medium">Logo Perusahaan</p>
                <p className="text-xs text-gray-500">Klik untuk upload. JPG/PNG, maks 5MB.</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Nama Perusahaan</Label>
              <Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} data-testid="company-name-input" />
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Input value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSaveInfo} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan Informasi Dasar'}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <Card>
          <CardHeader>
            <CardTitle>Konten Profil</CardTitle>
            <CardDescription>Deskripsi, visi misi, budaya kerja yang tampil di halaman publik</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Tagline</Label>
              <Input value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} placeholder="Contoh: Your Trusted Partner" />
            </div>
            <div className="grid gap-2">
              <Label>Deskripsi Perusahaan</Label>
              <Textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} rows={4} placeholder="Ceritakan tentang perusahaan Anda..." />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Visi</Label>
                <Textarea value={profile.vision} onChange={(e) => setProfile({ ...profile, vision: e.target.value })} rows={3} />
              </div>
              <div className="grid gap-2">
                <Label>Misi</Label>
                <Textarea value={profile.mission} onChange={(e) => setProfile({ ...profile, mission: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Sejarah Perusahaan</Label>
              <Textarea value={profile.history} onChange={(e) => setProfile({ ...profile, history: e.target.value })} rows={3} placeholder="Opsional" />
            </div>
            <div className="grid gap-2">
              <Label>Budaya Perusahaan</Label>
              <Textarea value={profile.culture} onChange={(e) => setProfile({ ...profile, culture: e.target.value })} rows={3} />
            </div>

            {/* Benefits */}
            <div className="grid gap-2">
              <Label>Benefit Karyawan</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.benefits.map((b, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {b}
                    <button onClick={() => removeBenefit(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Contoh: BPJS Kesehatan"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())} />
                <Button type="button" variant="outline" onClick={addBenefit}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="grid gap-2">
              <Label>Media Sosial</Label>
              <div className="grid md:grid-cols-2 gap-3">
                {['instagram', 'facebook', 'linkedin', 'twitter'].map((platform) => (
                  <div key={platform} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 w-20 capitalize">{platform}</span>
                    <Input value={profile.social_links[platform] || ''} placeholder={`https://${platform}.com/...`}
                      onChange={(e) => setProfile({ ...profile, social_links: { ...profile.social_links, [platform]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 w-full">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan Konten Profil'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
