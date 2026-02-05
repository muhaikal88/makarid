import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Globe, 
  Mail, 
  Settings, 
  ArrowLeft, 
  Building2,
  Link2,
  Server,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const CompanySettings = () => {
  const { t, language } = useLanguage();
  const { user, getAuthHeaders } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Domain settings
  const [customDomains, setCustomDomains] = useState({
    main: '',
    careers: '',
    hr: ''
  });
  
  // SMTP settings
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '587',
    user: '',
    password: '',
    from_email: '',
    from_name: ''
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
      
      // Set custom domains
      if (response.data.custom_domains) {
        setCustomDomains(response.data.custom_domains);
      }
      
      // Set SMTP settings
      if (response.data.smtp_settings) {
        setSmtpSettings(response.data.smtp_settings);
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

  const handleSaveSMTP = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/company/settings`, {
        smtp_settings: smtpSettings
      }, {
        headers: getAuthHeaders()
      });
      toast.success(language === 'id' ? 'Pengaturan SMTP berhasil disimpan' : 'SMTP settings saved successfully');
      fetchSettings();
    } catch (error) {
      console.error('Failed to save SMTP:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan SMTP');
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
      <div className="container mx-auto px-4 py-8">
        {/* Only Custom Domain - SMTP removed (Super Admin only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {language === 'id' ? 'Custom Domain (Opsional)' : 'Custom Domain (Optional)'}
            </CardTitle>
            <CardDescription>
              {language === 'id'
                ? 'Gunakan domain sendiri untuk branding yang lebih kuat. Pengaturan SMTP email dikelola oleh Super Admin.'
                : 'Use your own domain for stronger branding. SMTP email settings are managed by Super Admin.'}
            </CardDescription>
          </CardHeader>
              <Mail className="w-4 h-4" />
              SMTP Email
            </TabsTrigger>
          </TabsList>

          {/* Custom Domain Settings */}
          <TabsContent value="domains">
            <div className="grid gap-6">
              {/* Default Domain Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {language === 'id' ? 'Domain Default' : 'Default Domain'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'id' 
                      ? 'Domain default yang disediakan oleh sistem' 
                      : 'Default domain provided by the system'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {language === 'id' ? 'Subdomain Anda' : 'Your Subdomain'}
                        </p>
                        <p className="text-lg font-mono font-semibold text-emerald-700">
                          {settings?.default_subdomain || `${settings?.slug}.makar.id`}
                        </p>
                      </div>
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-gray-600 mb-1">Company Profile</p>
                        <p className="font-mono text-xs text-[#2E4DA7]">
                          {settings?.default_subdomain}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-gray-600 mb-1">Careers Page</p>
                        <p className="font-mono text-xs text-[#2E4DA7]">
                          {settings?.default_subdomain}/careers
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded">
                        <p className="text-gray-600 mb-1">Login Page</p>
                        <p className="font-mono text-xs text-[#2E4DA7]">
                          {settings?.default_subdomain}/login
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Domain Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="w-5 h-5" />
                    {language === 'id' ? 'Custom Domain (Opsional)' : 'Custom Domain (Optional)'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'id'
                      ? 'Gunakan domain sendiri untuk branding yang lebih kuat'
                      : 'Use your own domain for stronger branding'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          {language === 'id' ? 'Instruksi DNS' : 'DNS Instructions'}
                        </p>
                        <p>
                          {language === 'id'
                            ? 'Untuk menggunakan custom domain, Anda perlu menambahkan CNAME record di DNS provider Anda yang mengarah ke server kami.'
                            : 'To use custom domain, you need to add a CNAME record in your DNS provider pointing to our server.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="domain_main">
                        Main Domain (Company Profile)
                      </Label>
                      <Input
                        id="domain_main"
                        value={customDomains.main}
                        onChange={(e) => setCustomDomains({ ...customDomains, main: e.target.value })}
                        placeholder="company.com"
                      />
                      <p className="text-xs text-gray-500">
                        {language === 'id' ? 'Contoh: company.com' : 'Example: company.com'}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="domain_careers">
                        Careers Domain (Recruitment Page)
                      </Label>
                      <Input
                        id="domain_careers"
                        value={customDomains.careers}
                        onChange={(e) => setCustomDomains({ ...customDomains, careers: e.target.value })}
                        placeholder="careers.company.com"
                      />
                      <p className="text-xs text-gray-500">
                        {language === 'id' ? 'Contoh: careers.company.com' : 'Example: careers.company.com'}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="domain_hr">
                        HR Domain (Employee Portal)
                      </Label>
                      <Input
                        id="domain_hr"
                        value={customDomains.hr}
                        onChange={(e) => setCustomDomains({ ...customDomains, hr: e.target.value })}
                        placeholder="hr.company.com"
                      />
                      <p className="text-xs text-gray-500">
                        {language === 'id' ? 'Contoh: hr.company.com' : 'Example: hr.company.com'}
                      </p>
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
          </TabsContent>

          {/* SMTP Settings */}
          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  {language === 'id' ? 'Pengaturan SMTP Email' : 'SMTP Email Settings'}
                </CardTitle>
                <CardDescription>
                  {language === 'id'
                    ? 'Konfigurasi server email untuk notifikasi aplikasi lamaran'
                    : 'Configure email server for job application notifications'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">
                        {language === 'id' ? 'Opsional' : 'Optional'}
                      </p>
                      <p>
                        {language === 'id'
                          ? 'Jika tidak dikonfigurasi, sistem akan menggunakan email default kami.'
                          : 'If not configured, the system will use our default email.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_host">SMTP Host *</Label>
                      <Input
                        id="smtp_host"
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="smtp_port">SMTP Port *</Label>
                      <Input
                        id="smtp_port"
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                        placeholder="587"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="smtp_user">SMTP Username / Email *</Label>
                    <Input
                      id="smtp_user"
                      type="email"
                      value={smtpSettings.user}
                      onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                      placeholder="noreply@company.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="smtp_password">SMTP Password *</Label>
                    <div className="relative">
                      <Input
                        id="smtp_password"
                        type={showPassword ? 'text' : 'password'}
                        value={smtpSettings.password}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                        placeholder="••••••••"
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="from_email">From Email *</Label>
                      <Input
                        id="from_email"
                        type="email"
                        value={smtpSettings.from_email}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, from_email: e.target.value })}
                        placeholder="noreply@company.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="from_name">From Name *</Label>
                      <Input
                        id="from_name"
                        value={smtpSettings.from_name}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, from_name: e.target.value })}
                        placeholder="Company Name"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSMTP}
                  disabled={saving}
                  className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                >
                  {saving ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Pengaturan SMTP' : 'Save SMTP Settings')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
};
