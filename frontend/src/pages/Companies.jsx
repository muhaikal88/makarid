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
import { Building2, Plus, Pencil, Trash2, Search, Users, Globe, Link2, ExternalLink, Key, Calendar, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Domain form state
  const [domainData, setDomainData] = useState({
    main: '',
    careers: '',
    hr: ''
  });

  // License form state
  const [licenseData, setLicenseData] = useState({
    license_type: 'trial',
    license_end: '',
    is_active: true
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
    try {
      const response = await axios.get(`${API}/companies`, {
        headers: getAuthHeaders()
      });
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
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
        headers: getAuthHeaders()
      });
      toast.success(t('companyDeleted'));
      setIsDeleteOpen(false);
      setSelectedCompany(null);
      fetchCompanies();
    } catch (error) {
      console.error('Failed to delete company:', error);
      toast.error(t('error'));
    }
  };

  const handleOpenDomains = (company) => {
    setSelectedCompany(company);
    setDomainData({
      main: company.custom_domains?.main || company.domain || '',
      careers: company.custom_domains?.careers || '',
      hr: company.custom_domains?.hr || ''
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
                    <TableHead className="font-semibold">{t('domain')}</TableHead>
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
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe className="w-4 h-4" />
                          {company.domain}
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
                          <Users className="w-4 h-4" />
                          {company.employee_count}
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#2E4DA7]" />
              Custom Domains - {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Setup custom domain untuk white-label. Client perlu mengarahkan DNS ke server Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-2">Instruksi DNS untuk Client:</p>
              <p>Client perlu menambahkan CNAME record yang mengarah ke server Anda.</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="domain_main">
                Main Domain (Company Profile)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain_main"
                  value={domainData.main}
                  onChange={(e) => setDomainData({ ...domainData, main: e.target.value })}
                  placeholder="luckycell.co.id"
                />
                {domainData.main && (
                  <a 
                    href={`/company/${selectedCompany?.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </a>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="domain_careers">
                Careers Domain (Recruitment Page)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain_careers"
                  value={domainData.careers}
                  onChange={(e) => setDomainData({ ...domainData, careers: e.target.value })}
                  placeholder="careers.luckycell.co.id"
                />
                {domainData.careers && (
                  <a 
                    href={`/careers/${selectedCompany?.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </a>
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="domain_hr">
                HR Domain (Employee Login)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="domain_hr"
                  value={domainData.hr}
                  onChange={(e) => setDomainData({ ...domainData, hr: e.target.value })}
                  placeholder="hr.luckycell.co.id"
                />
                {domainData.hr && (
                  <a 
                    href={`/login/${selectedCompany?.domain}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </a>
                )}
              </div>
            </div>

            {selectedCompany?.custom_domains && (
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-800 mb-2">Current Active Domains:</p>
                <ul className="text-sm text-emerald-700 space-y-1">
                  {selectedCompany.custom_domains.main && (
                    <li>• Main: {selectedCompany.custom_domains.main}</li>
                  )}
                  {selectedCompany.custom_domains.careers && (
                    <li>• Careers: {selectedCompany.custom_domains.careers}</li>
                  )}
                  {selectedCompany.custom_domains.hr && (
                    <li>• HR: {selectedCompany.custom_domains.hr}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDomainsOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleSaveDomains}
              className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
              disabled={formLoading}
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
    </DashboardLayout>
  );
};
