import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
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
import { Users as UsersIcon, Plus, Pencil, Trash2, Search, Building2, Mail } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const Users = () => {
  const { t } = useLanguage();
  const { getAuthHeaders } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    company_id: '',
    is_active: true
  });

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`, {
        headers: getAuthHeaders()
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API}/companies`, {
        headers: getAuthHeaders()
      });
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  const handleOpenForm = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        company_id: user.company_id || '',
        is_active: user.is_active
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        company_id: '',
        is_active: true
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      company_id: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = { ...formData };
      if (!payload.company_id) {
        delete payload.company_id;
      }
      if (selectedUser && !payload.password) {
        delete payload.password;
      }

      if (selectedUser) {
        await axios.put(`${API}/users/${selectedUser.id}`, payload, {
          headers: getAuthHeaders()
        });
        toast.success(t('userUpdated'));
      } else {
        await axios.post(`${API}/users`, payload, {
          headers: getAuthHeaders()
        });
        toast.success(t('userCreated'));
      }
      handleCloseForm();
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/users/${selectedUser.id}`, {
        headers: getAuthHeaders()
      });
      toast.success(t('userDeleted'));
      setIsDeleteOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(t('error'));
    }
  };

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Company filter
    const matchesCompany = filterCompany === 'all' || 
                          (user.companies && user.companies.includes(filterCompany));
    
    // Role filter
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    return matchesSearch && matchesCompany && matchesRole;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany, filterRole]);

  const getCompanyName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.name || '-';
  };

  const getRoleBadge = (role) => {
    if (role === 'admin') {
      return <Badge className="bg-[#2E4DA7] hover:bg-[#2E4DA7]">{t('admin')}</Badge>;
    }
    return <Badge variant="secondary">{t('employee')}</Badge>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout title={t('userManagement')}>
      <div className="space-y-6" data-testid="users-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-users"
            />
          </div>
          <Button 
            className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
            onClick={() => handleOpenForm()}
            data-testid="add-user-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addUser')}
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{searchTerm ? t('noData') : t('noData')}</p>
                {!searchTerm && (
                  <Button 
                    className="mt-4 bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                    onClick={() => handleOpenForm()}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('addUser')}
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">{t('name')}</TableHead>
                    <TableHead className="font-semibold">{t('email')}</TableHead>
                    <TableHead className="font-semibold">{t('role')}</TableHead>
                    <TableHead className="font-semibold">{t('company')}</TableHead>
                    <TableHead className="font-semibold">{t('status')}</TableHead>
                    <TableHead className="font-semibold">{t('createdAt')}</TableHead>
                    <TableHead className="text-right font-semibold">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#2E4DA7]/10 rounded-full flex items-center justify-center">
                            <span className="text-[#2E4DA7] font-medium">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Building2 className="w-4 h-4" />
                          {user.company_names && user.company_names.length > 0 
                            ? user.company_names.join(', ')
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.is_active ? 'default' : 'secondary'}
                          className={user.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        >
                          {user.is_active ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(user)}
                            data-testid={`edit-user-${user.id}`}
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDeleteOpen(true);
                            }}
                            data-testid={`delete-user-${user.id}`}
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
              {selectedUser ? t('editUser') : t('addUser')}
            </DialogTitle>
            <DialogDescription>
              {selectedUser 
                ? 'Update the user information below.'
                : 'Fill in the details to create a new user.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="user-name-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="user-email-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {t('password')} {selectedUser ? '' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!selectedUser}
                  placeholder={selectedUser ? 'Leave blank to keep current' : ''}
                  data-testid="user-password-input"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">{t('role')} *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue placeholder={t('selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('admin')}</SelectItem>
                    <SelectItem value="employee">{t('employee')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">{t('company')}</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                >
                  <SelectTrigger data-testid="user-company-select">
                    <SelectValue placeholder={t('selectCompany')} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">{t('status')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{formData.is_active ? t('active') : t('inactive')}</span>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    data-testid="user-status-switch"
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
                data-testid="save-user-btn"
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
            <AlertDialogTitle>{t('deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete')} <strong>{selectedUser?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#E31E24] hover:bg-[#E31E24]/90"
              onClick={handleDelete}
              data-testid="confirm-delete-user"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
