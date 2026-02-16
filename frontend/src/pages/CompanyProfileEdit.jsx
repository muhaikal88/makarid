import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Building2, Camera, Loader2, Save, Plus, X, ExternalLink, Image, Palette } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

// Lazy load ReactQuill to avoid React 19 concurrent rendering issues
let ReactQuill = null;
try {
  ReactQuill = require('react-quill-new').default;
  require('react-quill-new/dist/quill.snow.css');
} catch (e) {
  console.warn('ReactQuill not available');
}

const RichEditor = ({ value, onChange, placeholder }) => {
  if (!ReactQuill) {
    return <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} />;
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <ReactQuill
        theme="snow" value={value || ''} onChange={onChange} placeholder={placeholder}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['blockquote'],
            ['link', 'image'],
            ['clean']
          ],
        }}
      />
    </div>
  );
};

export const CompanyProfileEdit = () => {
  const { language } = useLanguage();
  const logoInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [session, setSession] = useState(null);

  const [info, setInfo] = useState({ name: '', address: '', phone: '', email: '', logo_url: '' });
  const [profile, setProfile] = useState({
    tagline: '', description: '', vision: '', mission: '',
    history: '', culture: '', benefits: [], social_links: {},
    gallery_images: [], primary_color: '#2E4DA7'
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
        history: d.history || '', culture: d.culture || '', benefits: d.benefits || [], social_links: d.social_links || {},
        gallery_images: d.gallery_images || [], primary_color: d.primary_color || '#2E4DA7'
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

  const handleUploadGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingGallery(true);
    try {
      const urls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await axios.post(`${API}/upload/content-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        urls.push(res.data.url);
      }
      setProfile(prev => ({ ...prev, gallery_images: [...prev.gallery_images, ...urls] }));
      toast.success(`${urls.length} gambar berhasil diupload`);
    } catch (err) {
      toast.error('Gagal upload gambar');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const removeGalleryImage = (idx) => {
    setProfile(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, i) => i !== idx) }));
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
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/admin/dashboard">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3"><ArrowLeft className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Kembali</span></Button>
              </Link>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Profil Perusahaan</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Edit halaman profil publik perusahaan Anda</p>
              </div>
            </div>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Preview</span></Button>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-3xl space-y-4 sm:space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Informasi Dasar</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Nama, alamat, kontak, dan logo</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-slate-200">
                  {info.logo_url ? <img src={info.logo_url} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />}
                </div>
                <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </button>
                <input ref={logoInputRef} type="file" accept="image/jpeg,image/png" onChange={handleUploadLogo} className="hidden" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Logo Perusahaan</p>
                <p className="text-xs text-gray-500">Klik untuk upload. JPG/PNG, maks 5MB.</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Nama Perusahaan</Label>
              <Input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Alamat</Label>
              <Input value={info.address} onChange={(e) => setInfo({ ...info, address: e.target.value })} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="grid gap-2">
                <Label>Telepon</Label>
                <Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleSaveInfo} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan Informasi Dasar'}
            </Button>
          </CardContent>
        </Card>

        {/* Theme Color */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Palette className="w-5 h-5" />Warna Tema</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Warna utama yang digunakan di halaman profil publik</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <input type="color" value={profile.primary_color || '#2E4DA7'}
                onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                className="w-12 h-12 rounded-lg border-2 border-slate-200 cursor-pointer" />
              <div>
                <Input value={profile.primary_color || '#2E4DA7'}
                  onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                  className="w-32 font-mono text-sm" placeholder="#2E4DA7" />
              </div>
              <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: profile.primary_color || '#2E4DA7' }}></div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content with Rich Editor */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Konten Profil</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Deskripsi, visi misi, budaya kerja. Gunakan editor untuk format teks.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid gap-2">
              <Label>Tagline</Label>
              <Input value={profile.tagline} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} placeholder="Contoh: Your Trusted Partner" />
            </div>

            <div className="grid gap-2">
              <Label>Deskripsi Perusahaan</Label>
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill theme="snow" value={profile.description} onChange={(val) => setProfile({ ...profile, description: val })} modules={quillModules} placeholder="Ceritakan tentang perusahaan Anda..." />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill theme="snow" value={profile.history} onChange={(val) => setProfile({ ...profile, history: val })} modules={quillModules} placeholder="Opsional" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Budaya Perusahaan</Label>
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill theme="snow" value={profile.culture} onChange={(val) => setProfile({ ...profile, culture: val })} modules={quillModules} />
              </div>
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
              <div className="grid sm:grid-cols-2 gap-3">
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

        {/* Gallery */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Image className="w-5 h-5" />Galeri Foto</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Upload foto-foto perusahaan untuk ditampilkan di halaman profil</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profile.gallery_images.map((img, i) => (
                <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border bg-slate-50">
                  <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => removeGalleryImage(i)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => galleryInputRef.current?.click()} disabled={uploadingGallery}
                className="aspect-video rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 hover:border-[#2E4DA7] hover:bg-blue-50 transition-colors cursor-pointer">
                {uploadingGallery ? <Loader2 className="w-6 h-6 text-slate-400 animate-spin" /> : <Plus className="w-6 h-6 text-slate-400" />}
                <span className="text-xs text-slate-500">{uploadingGallery ? 'Uploading...' : 'Tambah Foto'}</span>
              </button>
            </div>
            <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUploadGallery} className="hidden" />
            <p className="text-xs text-gray-500">JPG/PNG/WebP, maks 10MB per file. Gambar otomatis dikompresi.</p>

            <Button onClick={handleSaveProfile} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 w-full">
              <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan Galeri'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
