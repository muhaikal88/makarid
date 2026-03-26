import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Settings, ArrowLeft, Globe, Mail, Lock, Building2, Eye, EyeOff } from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const CompanySettings = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [smtpData, setSmtpData] = useState({
    host: '', port: 465, username: '', password: '', from_email: '', from_name: '', use_tls: true
  });
  const [domainData, setDomainData] = useState({ main: '', careers: '', hr: '', team: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const sessionRes = await axios.get(`${API}/auth/me-session`, { withCredentials: true });
      if (sessionRes.data.role !== 'admin') { navigate('/company-login'); return; }
      setSession(sessionRes.data);

      // Fetch company settings
      const settingsRes = await axios.get(`${API}/company-settings-session`, { withCredentials: true });
      const s = settingsRes.data;
      if (s.custom_domains) {
        setDomainData({
          main: s.custom_domains.main || '', careers: s.custom_domains.careers || '',
          hr: s.custom_domains.hr || '', team: s.custom_domains.team || ''
        });
      }
      if (s.smtp_settings) {
        setSmtpData({
          host: s.smtp_settings.host || '', port: s.smtp_settings.port || 465,
          username: s.smtp_settings.username || '', password: s.smtp_settings.password || '',
          from_email: s.smtp_settings.from_email || '', from_name: s.smtp_settings.from_name || '',
          use_tls: s.smtp_settings.use_tls !== false
        });
      }
    } catch (error) {
      navigate('/company-login');
    } finally { setLoading(false); }
  };

  const handleSaveDomains = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company-settings-session`, { custom_domains: domainData }, { withCredentials: true });
      toast.success('Domain berhasil disimpan');
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleSaveSMTP = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company-settings-session`, { smtp_settings: smtpData }, { withCredentials: true });
      toast.success('SMTP berhasil disimpan');
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E4DA7]"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Kembali</Button></Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings className="w-5 h-5" />Pengaturan</h1>
              <p className="text-xs sm:text-sm text-gray-500">{session?.company_name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl space-y-6">
        {/* Custom Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" />Custom Domain</CardTitle>
            <CardDescription>Atur domain khusus untuk perusahaan Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="grid gap-1.5"><Label className="text-xs">Domain Utama</Label><Input value={domainData.main} onChange={(e) => setDomainData({ ...domainData, main: e.target.value })} placeholder="luckycell.co.id" /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Career Domain</Label><Input value={domainData.careers} onChange={(e) => setDomainData({ ...domainData, careers: e.target.value })} placeholder="career.luckycell.co.id" /></div>
              <div className="grid gap-1.5"><Label className="text-xs">HR Domain (Admin)</Label><Input value={domainData.hr} onChange={(e) => setDomainData({ ...domainData, hr: e.target.value })} placeholder="hr.luckycell.co.id" /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Team Domain (Karyawan)</Label><Input value={domainData.team} onChange={(e) => setDomainData({ ...domainData, team: e.target.value })} placeholder="team.luckycell.co.id" /></div>
            </div>
            <Button onClick={handleSaveDomains} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 w-full">{saving ? 'Menyimpan...' : 'Simpan Domain'}</Button>
          </CardContent>
        </Card>

        {/* SMTP Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Email SMTP Perusahaan</CardTitle>
            <CardDescription>Konfigurasi email untuk notifikasi perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label className="text-xs">SMTP Host</Label><Input value={smtpData.host} onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })} placeholder="smtp.gmail.com" /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Port</Label><Input type="number" value={smtpData.port} onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) || 465 })} /></div>
            </div>
            <div className="grid gap-1.5"><Label className="text-xs">Username</Label><Input value={smtpData.username} onChange={(e) => setSmtpData({ ...smtpData, username: e.target.value })} placeholder="noreply@company.com" /></div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} value={smtpData.password} onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })} className="pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label className="text-xs">From Email</Label><Input value={smtpData.from_email} onChange={(e) => setSmtpData({ ...smtpData, from_email: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label className="text-xs">From Name</Label><Input value={smtpData.from_name} onChange={(e) => setSmtpData({ ...smtpData, from_name: e.target.value })} /></div>
            </div>
            <Button onClick={handleSaveSMTP} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 w-full">{saving ? 'Menyimpan...' : 'Simpan SMTP'}</Button>
          </CardContent>
        </Card>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
};
