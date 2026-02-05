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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Shield, Plus, Pencil, Trash2, Mail, User, RefreshCw, Eye, EyeOff, ShieldCheck, ShieldOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SuperAdmins = () => {
  const { language } = useLanguage();
  const { getAuthHeaders } = useAuth();
  
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    picture: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${API}/superadmins`, {
        headers: getAuthHeaders()
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()';
    const all = uppercase + lowercase + numbers + special;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    for (let i = 0; i < 8; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setFormData({ ...formData, password });
    setShowPassword(true);
    toast.success('Password kuat telah digenerate');
  };

  const handleOpenForm = (admin = null) => {
    if (admin) {
      setSelectedAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        password: '',
        picture: admin.picture || ''
      });
    } else {
      setSelectedAdmin(null);
      setFormData({ name: '', email: '', password: '', picture: '' });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (selectedAdmin) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await axios.put(`${API}/superadmins/${selectedAdmin.id}`, updateData, {
          headers: getAuthHeaders()
        });
        toast.success('Super Admin berhasil diupdate');
      } else {
        await axios.post(`${API}/superadmins`, formData, {
          headers: getAuthHeaders()
        });
        toast.success('Super Admin berhasil ditambahkan');
      }
      setIsFormOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to save admin:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/superadmins/${selectedAdmin.id}`, {
        headers: getAuthHeaders()
      });
      toast.success('Super Admin berhasil dihapus');
      setIsDeleteOpen(false);
      setSelectedAdmin(null);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      toast.error(error.response?.data?.detail || 'Gagal menghapus');
    }
  };


  const handleToggle2FA = async (admin, enable) => {
    try {
      await axios.post(`${API}/superadmins/${admin.id}/toggle-2fa?enable=${enable}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`2FA ${enable ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to toggle 2FA:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah 2FA');
    }
  };

  const handleToggleActive = async (admin, active) => {
    try {
      await axios.post(`${API}/superadmins/${admin.id}/toggle-active?active=${active}`, {}, {
        headers: getAuthHeaders()
      });
      toast.success(`Akun ${active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to toggle active:', error);
      toast.error(error.response?.data?.detail || 'Gagal mengubah status');
    }
  };


  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'SA';
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
    <DashboardLayout title={language === 'id' ? 'Manajemen Super Admin' : 'Super Admin Management'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              {language === 'id' 
                ? 'Kelola akun Super Admin yang memiliki akses penuh ke sistem'
                : 'Manage Super Admin accounts with full system access'}
            </p>
          </div>
          <Button 
            className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
            onClick={() => handleOpenForm()}
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'id' ? 'Tambah Super Admin' : 'Add Super Admin'}
          </Button>
        </div>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Belum ada Super Admin</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold">{language === 'id' ? 'Admin' : 'Admin'}</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">2FA</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">{language === 'id' ? 'Dibuat' : 'Created'}</TableHead>
                    <TableHead className="text-right font-semibold">{language === 'id' ? 'Aksi' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 bg-[#2E4DA7]">
                            {admin.picture ? (
                              <AvatarImage src={admin.picture} alt={admin.name} />
                            ) : (
                              <AvatarFallback className="bg-[#2E4DA7] text-white">
                                {getInitials(admin.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{admin.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.totp_enabled ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Aktif
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">
                            <ShieldOff className="w-3 h-3 mr-1" />
                            Tidak Aktif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={admin.is_active ? 'default' : 'secondary'}
                          className={admin.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        >
                          {admin.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(admin.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenForm(admin)}
                          >
                            <Pencil className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setIsDeleteOpen(true);
                            }}
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
              {selectedAdmin 
                ? (language === 'id' ? 'Edit Super Admin' : 'Edit Super Admin')
                : (language === 'id' ? 'Tambah Super Admin' : 'Add Super Admin')}
            </DialogTitle>
            <DialogDescription>
              {selectedAdmin 
                ? 'Update informasi Super Admin'
                : 'Buat akun Super Admin baru dengan akses penuh'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    Password {selectedAdmin ? '' : '*'}
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="h-8"
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!selectedAdmin}
                    placeholder={selectedAdmin ? 'Kosongkan jika tidak ingin ganti' : ''}
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
                  Min 8 karakter: huruf besar, kecil, angka & simbol
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="picture">URL Gambar Profil</Label>
                <Input
                  id="picture"
                  value={formData.picture}
                  onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button 
                type="submit" 
                className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                disabled={formLoading}
              >
                {formLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Super Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedAdmin?.name}</strong>?
              <br /><br />
              <span className="text-red-500">Tindakan ini tidak dapat dibatalkan.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#E31E24] hover:bg-[#E31E24]/90"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};
