import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Globe, Bell, Shield, Palette, Mail, Eye, EyeOff, Server, AlertCircle, Send, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { getAuthHeaders } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [emailLogs, setEmailLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: 'notif@makar.id',
    from_name: 'Makar.id Notifications',
    use_tls: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/system/settings`, {
        headers: getAuthHeaders()
      });
      if (response.data.smtp_settings) {
        setSmtpSettings(response.data.smtp_settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMTP = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/system/settings`, {
        smtp_settings: smtpSettings
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Pengaturan SMTP berhasil disimpan');
    } catch (error) {
      console.error('Failed to save SMTP:', error);
      toast.error('Gagal menyimpan pengaturan SMTP');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title={t('settings')}>
      <div className="space-y-6 max-w-3xl" data-testid="settings-page">
        {/* Language Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#2E4DA7]/10 rounded-lg">
                <Globe className="w-5 h-5 text-[#2E4DA7]" />
              </div>
              <div>
                <CardTitle className="text-lg">Language / Bahasa</CardTitle>
                <CardDescription>Choose your preferred language</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label>Interface Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[200px]" data-testid="settings-language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">
                    <span className="flex items-center gap-2">
                      <span>🇮🇩</span> Bahasa Indonesia
                    </span>
                  </SelectItem>
                  <SelectItem value="en">
                    <span className="flex items-center gap-2">
                      <span>🇬🇧</span> English
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Global SMTP Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Global SMTP Email</CardTitle>
                <CardDescription>Default email server untuk semua perusahaan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Email Default</p>
                  <p>
                    Jika perusahaan tidak set custom SMTP, sistem akan menggunakan SMTP ini untuk kirim notifikasi (aplikasi lamaran, dll).
                  </p>
                </div>
              </div>
            </div>

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
                  type="number"
                  value={smtpSettings.port}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, port: parseInt(e.target.value) })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtp_username">SMTP Username *</Label>
              <Input
                id="smtp_username"
                value={smtpSettings.username}
                onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                placeholder="notif@makar.id"
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
                  placeholder="notif@makar.id"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from_name">From Name *</Label>
                <Input
                  id="from_name"
                  value={smtpSettings.from_name}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, from_name: e.target.value })}
                  placeholder="Makar.id Notifications"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label>Use TLS/SSL</Label>
                <p className="text-xs text-gray-500">Recommended for security</p>
              </div>
              <Switch
                checked={smtpSettings.use_tls}
                onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, use_tls: checked })}
              />
            </div>

            <Button 
              onClick={handleSaveSMTP}
              disabled={saving}
              className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              data-testid="save-smtp-btn"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan SMTP'}
            </Button>

            {/* Test Email Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-[#2E4DA7]" />
                <Label className="font-semibold">Tes Kirim Email</Label>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Kirim email tes untuk memastikan konfigurasi SMTP sudah benar.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="flex-1"
                  data-testid="test-email-input"
                />
                <Button
                  onClick={async () => {
                    if (!testEmail) {
                      toast.error('Masukkan email tujuan');
                      return;
                    }
                    setSendingTest(true);
                    try {
                      const response = await axios.post(`${API}/system/settings/test-email`, {
                        to_email: testEmail
                      }, {
                        headers: getAuthHeaders()
                      });
                      toast.success(response.data.message);
                    } catch (error) {
                      const detail = error.response?.data?.detail || 'Gagal mengirim email tes';
                      toast.error(detail);
                    } finally {
                      setSendingTest(false);
                    }
                  }}
                  disabled={sendingTest || !testEmail}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="send-test-email-btn"
                >
                  {sendingTest ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {sendingTest ? 'Mengirim...' : 'Kirim Tes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Notifications</CardTitle>
                <CardDescription>Manage notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email updates</p>
              </div>
              <Switch data-testid="email-notifications-switch" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>New Company Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when new companies register</p>
              </div>
              <Switch data-testid="company-alerts-switch" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>System Updates</Label>
                <p className="text-sm text-gray-500">Receive system maintenance notifications</p>
              </div>
              <Switch data-testid="system-updates-switch" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Security</CardTitle>
                <CardDescription>Security and authentication settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Switch data-testid="2fa-switch" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Session Timeout</Label>
                <p className="text-sm text-gray-500">Automatically logout after inactivity</p>
              </div>
              <Select defaultValue="24">
                <SelectTrigger className="w-[150px]" data-testid="session-timeout-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Appearance</CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-sm text-gray-500">Use smaller spacing and fonts</p>
              </div>
              <Switch data-testid="compact-mode-switch" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Animations</Label>
                <p className="text-sm text-gray-500">Enable interface animations</p>
              </div>
              <Switch data-testid="animations-switch" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};
