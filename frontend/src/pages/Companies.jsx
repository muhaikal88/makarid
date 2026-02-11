import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Building2, Plus, Pencil, Trash2, Search, Users, Globe, Link2, ExternalLink, Key, Calendar, AlertTriangle, CheckCircle, XCircle, Clock, Mail, Eye, EyeOff, Server, Info, Copy } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

const licenseTypeLabels = {
  trial: { label: 'Trial', color: 'bg-amber-100 text-amber-700' },
  monthly: { label: 'Bulanan', color: 'bg-blue-100 text-blue-700' },
  yearly: { label: 'Tahunan', color: 'bg-emerald-100 text-emerald-700' },
  lifetime: { label: 'Lifetime', color: 'bg-purple-100 text-purple-700' }
};

const licenseStatusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-700'
};

export const Companies = () => {
  const { t, language } = useLanguage();
  const { getAuthHeaders } = useAuth();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDomainsOpen, setIsDomainsOpen] = useState(false);
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isSMTPOpen, setIsSMTPOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Domain form state
  const [domainData, setDomainData] = useState({
    main: '',
    careers: '',
    hr: '',
    page_title: ''
  });

  // License form state
  const [licenseData, setLicenseData] = useState({
    license_type: 'trial',
    license_end: '',
    is_active: true
  });

  // SMTP form state
  const [smtpData, setSmtpData] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    address: '',
    phone: '',
    email: '',
    logo_url: '',
    is_active: true
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.get(`${API}/companies`, {
          headers: getAuthHeaders(),
          timeout: 15000
        });
        setCompanies(response.data);
        return;
      } catch (error) {
        if (error.response?.status === 401) break;
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        console.error('Failed to fetch companies:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleOpenForm = (company = null) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name,
        domain: company.domain,
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        logo_url: company.logo_url || '',
        is_active: company.is_active
      });
    } else {
      setSelectedCompany(null);
      setFormData({
        name: '',
        domain: '',
        address: '',
        phone: '',
        email: '',
        logo_url: '',
        is_active: true
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCompany(null);
    setFormData({
      name: '',
      domain: '',
      address: '',
      phone: '',
      email: '',
      logo_url: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (selectedCompany) {
        await axios.put(`${API}/companies/${selectedCompany.id}`, formData, {
          headers: getAuthHeaders()
        });
        toast.success(t('companyUpdated'));
      } else {
        await axios.post(`${API}/companies`, formData, {
          headers: getAuthHeaders()
        });
        toast.success(t('companyCreated'));
      }
      handleCloseForm();
      fetchCompanies();
    } catch (error) {
      console.error('Failed to save company:', error);
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/companies/${selectedCompany.id}`, {
        headers: getAuthHeaders(),
        timeout: 15000
      });
      toast.success(t('companyDeleted'));
      setIsDeleteOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast.error(error.response?.data?.detail || t('error'));
    }
  };

  const handleOpenDomains = (company) => {
    setSelectedCompany(company);
    setDomainData({
      main: company.custom_domains?.main || company.domain || '',
      careers: company.custom_domains?.careers || '',
      hr: company.custom_domains?.hr || '',
      page_title: company.page_title || ''
    });
    setIsDomainsOpen(true);
  };

  const handleSaveDomains = async () => {
    setFormLoading(true);
    try {
      await axios.put(`${API}/companies/${selectedCompany.id}/domains`, domainData, {
        headers: getAuthHeaders()
      });
      toast.success('Domain berhasil diupdate');
      setIsDomainsOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to update domains:', error);
      toast.error(error.response?.data?.detail || 'Gagal update domain');
    } finally {
      setFormLoading(false);
    }
  };

  // License management
  const handleOpenLicense = (company) => {
    setSelectedCompany(company);
    setLicenseData({
      license_type: company.license_type || 'trial',
      license_end: company.license_end ? company.license_end.split('T')[0] : '',
      is_active: company.is_active !== false
    });
    setIsLicenseOpen(true);
  };

  const handleSaveLicense = async () => {
    setFormLoading(true);
    try {
      await axios.put(`${API}/companies/${selectedCompany.id}/license`, {
        license_type: licenseData.license_type,
        license_end: licenseData.license_end ? new Date(licenseData.license_end).toISOString() : null,
        is_active: licenseData.is_active
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Lisensi berhasil diupdate');
      setIsLicenseOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to update license:', error);
      toast.error(error.response?.data?.detail || 'Gagal update lisensi');
    } finally {
      setFormLoading(false);
    }
  };

  const handleExtendLicense = async (days) => {
    setFormLoading(true);
    try {
      await axios.post(`${API}/companies/${selectedCompany.id}/license/extend?days=${days}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`Lisensi diperpanjang ${days} hari`);
      fetchCompanies();
      // Update license data in dialog
      const response = await axios.get(`${API}/companies/${selectedCompany.id}`, {
        headers: getAuthHeaders()
      });
      setLicenseData({
        license_type: response.data.license_type || 'trial',
        license_end: response.data.license_end ? response.data.license_end.split('T')[0] : '',
        is_active: response.data.is_active !== false
      });
      setSelectedCompany(response.data);
    } catch (error) {
      console.error('Failed to extend license:', error);
      toast.error(error.response?.data?.detail || 'Gagal perpanjang lisensi');
    } finally {
      setFormLoading(false);
    }
  };


  // SMTP Management
  const handleOpenSMTP = (company) => {
    setSelectedCompany(company);
    const smtp = company.smtp_settings || {};
    setSmtpData({
      host: smtp.host || '',
      port: smtp.port || 587,
      username: smtp.username || '',
      password: smtp.password || '',
      from_email: smtp.from_email || '',
      from_name: smtp.from_name || company.name,
      use_tls: smtp.use_tls !== false
    });
    setIsSMTPOpen(true);
  };

  const handleSaveSMTP = async () => {
    setFormLoading(true);
    try {
      await axios.put(`${API}/companies/${selectedCompany.id}`, {
        smtp_settings: smtpData
      }, {
        headers: getAuthHeaders()
      });
      toast.success('Pengaturan SMTP berhasil disimpan');
      setIsSMTPOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to update SMTP:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan SMTP');
    } finally {
      setFormLoading(false);
    }
  };


  const handleToggleActive = async (company) => {
    try {
      const endpoint = company.is_active 
        ? `${API}/companies/${company.id}/suspend`
        : `${API}/companies/${company.id}/activate`;
      
      await axios.post(endpoint, {}, { headers: getAuthHeaders() });
      toast.success(company.is_active ? 'Perusahaan dinonaktifkan' : 'Perusahaan diaktifkan');
      fetchCompanies();
    } catch (error) {
      console.error('Failed to toggle company status:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah status');
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout title={t('companyManagement')}>
      <div className="space-y-6" data-testid="companies-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-companies"
            />
          </div>
          <Button 
            className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
            onClick={() => handleOpenForm()}
            data-testid="add-company-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addCompany')}
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{searchTerm ? t('noData') : t('noCompanies')}</p>
                {!searchTerm && (
                  <Button 
                    className="mt-4 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                    onClick={() => handleOpenForm()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addCompany')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">{t('companyName')}</TableHead>
                    <TableHead className="font-semibold">Link Karir</TableHead>
                    <TableHead className="font-semibold">Lisensi</TableHead>
                    <TableHead className="font-semibold">{t('status')}</TableHead>
                    <TableHead className="font-semibold">Admin</TableHead>
                    <TableHead className="font-semibold">Karyawan</TableHead>
                    <TableHead className="text-right font-semibold">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id} data-testid={`company-row-${company.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#2E4DA7]/10 rounded-lg flex items-center justify-center">
                            {company.logo_url ? (
                              <img src={company.logo_url} alt={company.name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-[#2E4DA7]" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-1">
                            <code className="text-xs font-mono text-gray-600">
                              {company.slug}.makar.id
                            </code>
                            {company.custom_domains?.careers && (
                              <code className="text-xs font-mono text-emerald-600">
                                {company.custom_domains.careers}
                              </code>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const link = company.custom_domains?.careers || `${company.slug}.makar.id`;
                              navigator.clipboard.writeText(`https://${link}`);
                              toast.success('Link disalin!');
                            }}
                            title="Copy link"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={licenseTypeLabels[company.license_type]?.color || 'bg-gray-100'}>
                            {licenseTypeLabels[company.license_type]?.label || company.license_type}
                          </Badge>
                          {company.days_remaining !== null && company.days_remaining !== undefined && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {company.days_remaining >= 0 
                                ? `${company.days_remaining} hari lagi`
                                : `Expired ${Math.abs(company.days_remaining)} hari`}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={licenseStatusColors[company.license_status] || 'bg-gray-100'}>
                            {company.license_status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {company.license_status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1" />}
                            {company.license_status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                            {company.license_status === 'active' ? 'Aktif' : company.license_status === 'expired' ? 'Expired' : 'Suspended'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{company.admin_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium">{company.employee_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenLicense(company)}
                            title="Manage License"
                            data-testid={`license-company-${company.id}`}
                          >
                            <Key className="w-4 h-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenSMTP(company)}
                            title="Manage Email (SMTP)"
                            data-testid={`smtp-company-${company.id}`}
                          >
                            <Mail className="w-4 h-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDomains(company)}
                            title="Manage Domains"
                            data-testid={`domains-company-${company.id}`}
                          >
                            <Link2 className="w-4 h-4 text-[#2E4DA7]" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(company)}
                            data-testid={`edit-company-${company.id}`}
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCompany(company);
                              setIsDeleteOpen(true);
                            }}
                            data-testid={`delete-company-${company.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCompany ? t('editCompany') : t('addCompany')}
            </DialogTitle>
            <DialogDescription>
              {selectedCompany 
                ? 'Update the company information below.'
                : 'Fill in the details to create a new company.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('companyName')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="company-name-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">{t('domain')} *</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                  required
                  data-testid="company-domain-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="company-email-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="company-phone-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t('address')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="company-address-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">{t('logoUrl')}</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://..."
                  data-testid="company-logo-input"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t('status')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{formData.is_active ? t('active') : t('inactive')}</span>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    data-testid="company-status-switch"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                {t('cancel')}
              </Button>
              <Button 
                type="submit" 
                className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                disabled={formLoading}
                data-testid="save-company-btn"
              >
                {formLoading ? t('loading') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCompany')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')} <strong>{selectedCompany?.name}</strong>?
              <br /><br />
              <span className="text-red-500">{t('deleteWarning')}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#E31E24] hover:bg-[#E31E24]/90"
              onClick={handleDelete}
              data-testid="confirm-delete-company"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Domain Management Dialog */}
      <Dialog open={isDomainsOpen} onOpenChange={setIsDomainsOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#2E4DA7]" />
              Custom Domain - {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Atur domain kustom agar client bisa akses dengan domain mereka sendiri tanpa embel-embel makar.id
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            {/* Domain Mapping Table */}
            <div className="rounded-lg border overflow-hidden">
              {/* Main Domain */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#2E4DA7]" />
                    <Label className="font-semibold text-sm">Main Domain (Company Profile)</Label>
                  </div>
                  {domainData.main && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      → /company/{selectedCompany?.slug}
                    </Badge>
                  )}
                </div>
                <Input
                  value={domainData.main}
                  onChange={(e) => setDomainData({ ...domainData, main: e.target.value })}
                  placeholder="luckycell.co.id"
                  data-testid="domain-main-input"
                />
                {domainData.main && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    <span className="font-medium">{domainData.main}</span> → akan menampilkan halaman Company Profile
                  </p>
                )}
              </div>

              {/* Careers Domain */}
              <div className="p-4 border-b bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <Label className="font-semibold text-sm">Careers Domain (Halaman Karir)</Label>
                  </div>
                  {domainData.careers && (
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                      → /careers/{selectedCompany?.slug}
                    </Badge>
                  )}
                </div>
                <Input
                  value={domainData.careers}
                  onChange={(e) => setDomainData({ ...domainData, careers: e.target.value })}
                  placeholder="career.luckycell.co.id"
                  data-testid="domain-careers-input"
                />
                {domainData.careers && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    <span className="font-medium">{domainData.careers}</span> → akan menampilkan daftar lowongan kerja & form lamaran
                  </p>
                )}
              </div>

              {/* HR Domain */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-600" />
                    <Label className="font-semibold text-sm">HR Domain (Login Karyawan)</Label>
                  </div>
                  {domainData.hr && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                      → /company-login
                    </Badge>
                  )}
                </div>
                <Input
                  value={domainData.hr}
                  onChange={(e) => setDomainData({ ...domainData, hr: e.target.value })}
                  placeholder="hr.luckycell.co.id"
                  data-testid="domain-hr-input"
                />
                {domainData.hr && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    <span className="font-medium">{domainData.hr}</span> → akan menampilkan halaman login Admin & Karyawan
                  </p>
                )}
              </div>
            </div>

            {/* Default URLs */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Default URL (tanpa custom domain):</p>
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-16">Profile</span>
                  <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-[#2E4DA7]">makar.id/company/{selectedCompany?.slug}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-16">Karir</span>
                  <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-emerald-600">makar.id/careers/{selectedCompany?.slug}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 w-16">Login</span>
                  <code className="text-xs bg-white px-2 py-1 rounded border font-mono text-amber-600">makar.id/company-login</code>
                </div>
              </div>
            </div>

            {/* DNS Instructions */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-2 text-sm text-amber-800">
                  <p className="font-semibold">Instruksi DNS untuk Client:</p>
                  <p>Client perlu menambahkan <strong>CNAME record</strong> di DNS mereka:</p>
                  <div className="bg-white/60 rounded p-3 font-mono text-xs space-y-1">
                    {domainData.main && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-36 shrink-0">{domainData.main}</span>
                        <span className="text-gray-400">CNAME →</span>
                        <span className="font-semibold">makar.id</span>
                      </div>
                    )}
                    {domainData.careers && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-36 shrink-0">{domainData.careers}</span>
                        <span className="text-gray-400">CNAME →</span>
                        <span className="font-semibold">makar.id</span>
                      </div>
                    )}
                    {domainData.hr && (
                      <div className="flex gap-2">
                        <span className="text-gray-500 w-36 shrink-0">{domainData.hr}</span>
                        <span className="text-gray-400">CNAME →</span>
                        <span className="font-semibold">makar.id</span>
                      </div>
                    )}
                    {!domainData.main && !domainData.careers && !domainData.hr && (
                      <span className="text-gray-400">Isi domain di atas untuk melihat instruksi DNS</span>
                    )}
                  </div>
                  <p className="text-xs text-amber-600">Pastikan SSL/Proxy diaktifkan jika menggunakan Cloudflare.</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDomainsOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSaveDomains}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              disabled={formLoading}
              data-testid="save-domains-btn"
            >
              {formLoading ? t('loading') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Management Dialog */}
      <Dialog open={isLicenseOpen} onOpenChange={setIsLicenseOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Manajemen Lisensi - {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Kelola masa aktif lisensi dan status akses perusahaan
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current Status */}
            <div className={`p-4 rounded-lg ${
              selectedCompany?.license_status === 'active' ? 'bg-emerald-50' :
              selectedCompany?.license_status === 'expired' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status Saat Ini</p>
                  <p className={`text-lg font-bold ${
                    selectedCompany?.license_status === 'active' ? 'text-emerald-700' :
                    selectedCompany?.license_status === 'expired' ? 'text-red-700' : 'text-gray-700'
                  }`}>
                    {selectedCompany?.license_status === 'active' ? 'Aktif' : 
                     selectedCompany?.license_status === 'expired' ? 'Expired' : 'Suspended'}
                  </p>
                </div>
                {selectedCompany?.days_remaining !== null && selectedCompany?.days_remaining !== undefined && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Sisa Waktu</p>
                    <p className={`text-lg font-bold ${selectedCompany?.days_remaining < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                      {selectedCompany?.days_remaining >= 0 
                        ? `${selectedCompany?.days_remaining} hari`
                        : `Expired ${Math.abs(selectedCompany?.days_remaining)} hari`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Extend Buttons */}
            <div className="space-y-2">
              <Label>Perpanjang Cepat</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleExtendLicense(30)} disabled={formLoading}>
                  +30 Hari
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExtendLicense(90)} disabled={formLoading}>
                  +3 Bulan
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleExtendLicense(365)} disabled={formLoading}>
                  +1 Tahun
                </Button>
              </div>
            </div>

            {/* License Type */}
            <div className="grid gap-2">
              <Label>Tipe Lisensi</Label>
              <Select
                value={licenseData.license_type}
                onValueChange={(value) => setLicenseData({ ...licenseData, license_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial (30 hari)</SelectItem>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* License End Date */}
            <div className="grid gap-2">
              <Label htmlFor="license_end">Tanggal Berakhir</Label>
              <Input
                id="license_end"
                type="date"
                value={licenseData.license_end}
                onChange={(e) => setLicenseData({ ...licenseData, license_end: e.target.value })}
              />
              <p className="text-xs text-gray-500">Kosongkan untuk lifetime license</p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <Label>Status Aktif</Label>
                <p className="text-sm text-gray-500">
                  {licenseData.is_active 
                    ? 'Perusahaan dapat mengakses semua layanan' 
                    : 'Semua akses diblokir (suspended)'}
                </p>
              </div>
              <Switch
                checked={licenseData.is_active}
                onCheckedChange={(checked) => setLicenseData({ ...licenseData, is_active: checked })}
              />
            </div>

            {!licenseData.is_active && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Perusahaan Dinonaktifkan</p>
                    <p className="text-sm text-red-600">
                      Semua halaman publik (company profile, careers, login) akan menampilkan pesan error.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsLicenseOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSaveLicense}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              disabled={formLoading}
            >
              {formLoading ? t('loading') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Company SMTP Email Dialog */}
      <Dialog open={isSMTPOpen} onOpenChange={setIsSMTPOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              Pengaturan Email SMTP - {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Konfigurasi SMTP khusus untuk perusahaan ini (override Global SMTP)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Opsional</p>
                  <p>
                    Jika tidak diisi, sistem akan menggunakan Global SMTP (notif@makar.id) yang diset di Settings.
                    Isi form ini jika perusahaan ingin menggunakan email domain mereka sendiri.
                  </p>
                </div>
              </div>
            </div>

            {/* SMTP Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="smtp_host">SMTP Host</Label>
                <Input
                  id="smtp_host"
                  value={smtpData.host}
                  onChange={(e) => setSmtpData({ ...smtpData, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={smtpData.port}
                  onChange={(e) => setSmtpData({ ...smtpData, port: parseInt(e.target.value) })}
                  placeholder="587"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtp_username">SMTP Username / Email</Label>
              <Input
                id="smtp_username"
                value={smtpData.username}
                onChange={(e) => setSmtpData({ ...smtpData, username: e.target.value })}
                placeholder="noreply@company.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="smtp_password">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtp_password"
                  type={showPassword ? 'text' : 'password'}
                  value={smtpData.password}
                  onChange={(e) => setSmtpData({ ...smtpData, password: e.target.value })}
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
                <Label htmlFor="from_email">From Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={smtpData.from_email}
                  onChange={(e) => setSmtpData({ ...smtpData, from_email: e.target.value })}
                  placeholder="noreply@company.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={smtpData.from_name}
                  onChange={(e) => setSmtpData({ ...smtpData, from_name: e.target.value })}
                  placeholder={selectedCompany?.name}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <Label>Use TLS/SSL</Label>
                <p className="text-xs text-gray-500">Recommended for security</p>
              </div>
              <Switch
                checked={smtpData.use_tls}
                onCheckedChange={(checked) => setSmtpData({ ...smtpData, use_tls: checked })}
              />
            </div>

            {/* Clear button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSmtpData({
                    host: '',
                    port: 587,
                    username: '',
                    password: '',
                    from_email: '',
                    from_name: '',
                    use_tls: true
                  });
                }}
                className="flex-1"
              >
                Reset (Gunakan Global SMTP)
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSMTPOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleSaveSMTP}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              disabled={formLoading}
            >
              {formLoading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};
