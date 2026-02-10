import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Globe, 
  Settings, 
  ArrowLeft, 
  Link2,
  Check,
  Info
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const CompanySettings = () => {
  const { language } = useLanguage();
  const { user, getAuthHeaders } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  
  // Domain settings
  const [customDomains, setCustomDomains] = useState({
    main: '',
    careers: '',
    hr: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // Redirect if not company admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Navigate to="/login" replace />;
  }

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/company/settings`, {
        headers: getAuthHeaders()
      });
      setSettings(response.data);
      
      if (response.data.custom_domains) {
        setCustomDomains(response.data.custom_domains);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDomains = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company/settings`, {
        custom_domains: customDomains
      }, {
        headers: getAuthHeaders()
      });
      toast.success(language === 'id' ? 'Domain berhasil diupdate' : 'Domains updated successfully');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save domains:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan domain');
    } finally {
      setSaving(false);
    }
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
            <Link to="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'id' ? 'Kembali' : 'Back'}
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#2E4DA7]" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {language === 'id' ? 'Pengaturan Perusahaan' : 'Company Settings'}
                </h1>
                <p className="text-sm text-gray-500">{settings?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {language === 'id' ? 'Custom Domain' : 'Custom Domain'}
            </CardTitle>
            <CardDescription>
              {language === 'id'
                ? 'Gunakan domain sendiri untuk branding. Pengaturan SMTP email dikelola oleh Super Admin.'
                : 'Use your own domain for branding. SMTP email settings are managed by Super Admin.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Domain Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {language === 'id' ? 'Subdomain Default Anda' : 'Your Default Subdomain'}
                  </p>
                  <p className="text-lg font-mono font-semibold text-emerald-700">
                    {settings?.default_subdomain || `${settings?.slug}.makar.id`}
                  </p>
                </div>
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* DNS Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    {language === 'id' ? 'Instruksi DNS' : 'DNS Instructions'}
                  </p>
                  <p>
                    {language === 'id'
                      ? 'Untuk menggunakan custom domain, Anda perlu menambahkan CNAME record di DNS provider Anda.'
                      : 'To use custom domain, you need to add a CNAME record in your DNS provider.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Domain Form */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="domain_main">Main Domain (Company Profile)</Label>
                <Input
                  id="domain_main"
                  value={customDomains.main}
                  onChange={(e) => setCustomDomains({ ...customDomains, main: e.target.value })}
                  placeholder="company.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain_careers">Careers Domain (Recruitment)</Label>
                <Input
                  id="domain_careers"
                  value={customDomains.careers}
                  onChange={(e) => setCustomDomains({ ...customDomains, careers: e.target.value })}
                  placeholder="careers.company.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="domain_hr">HR Domain (Employee Portal)</Label>
                <Input
                  id="domain_hr"
                  value={customDomains.hr}
                  onChange={(e) => setCustomDomains({ ...customDomains, hr: e.target.value })}
                  placeholder="hr.company.com"
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveDomains}
              disabled={saving}
              className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
            >
              {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Domain' : 'Save Domains')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
