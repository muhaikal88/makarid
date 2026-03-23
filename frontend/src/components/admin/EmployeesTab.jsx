import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { Switch } from '../ui/switch';
import { Users, Plus, Search, Upload, Edit, Trash2, Download, Mail, Phone, Briefcase, Building2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const EmployeesTab = ({ language }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', position: '', department: '', join_date: '', password: '',
    birth_place: '', birth_date: '', gender: '', marital_status: '', religion: '',
    id_number: '', education: '', major: '', province: '', city: '', district: '',
    village: '', full_address: '', bank_name: '', bank_account: '', bank_holder: '',
    emergency_contact: '', emergency_phone: '', salary: '', employment_type: ''
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/employees-session`, { withCredentials: true });
      setEmployees(res.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally { setLoading(false); }
  };

  const handleOpen = (emp = null) => {
    if (emp) {
      setSelectedEmp(emp);
      setForm({
        name: emp.name || '', email: emp.email || '', phone: emp.phone || '',
        position: emp.position || '', department: emp.department || '',
        join_date: emp.join_date || '', password: '',
        birth_place: emp.birth_place || '', birth_date: emp.birth_date || '',
        gender: emp.gender || '', marital_status: emp.marital_status || '',
        religion: emp.religion || '', id_number: emp.id_number || '',
        education: emp.education || '', major: emp.major || '',
        province: emp.province || '', city: emp.city || '',
        district: emp.district || '', village: emp.village || '',
        full_address: emp.full_address || '',
        bank_name: emp.bank_name || '', bank_account: emp.bank_account || '',
        bank_holder: emp.bank_holder || '',
        emergency_contact: emp.emergency_contact || '', emergency_phone: emp.emergency_phone || '',
        salary: emp.salary || '', employment_type: emp.employment_type || ''
      });
    } else {
      setSelectedEmp(null);
      setForm({
        name: '', email: '', phone: '', position: '', department: '', join_date: '', password: '',
        birth_place: '', birth_date: '', gender: '', marital_status: '', religion: '',
        id_number: '', education: '', major: '', province: '', city: '', district: '',
        village: '', full_address: '', bank_name: '', bank_account: '', bank_holder: '',
        emergency_contact: '', emergency_phone: '', salary: '', employment_type: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) { toast.error('Nama dan email wajib diisi'); return; }
    setSaving(true);
    try {
      const cleanData = { ...form, salary: form.salary ? parseInt(form.salary) : null };
      if (selectedEmp) {
        await axios.put(`${API}/employees-session/${selectedEmp.id}`, cleanData, { withCredentials: true });
        toast.success('Data karyawan berhasil diupdate');
      } else {
        await axios.post(`${API}/employees-session`, cleanData, { withCredentials: true });
        toast.success('Karyawan berhasil ditambahkan');
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm(`Hapus ${emp.name} dari perusahaan?`)) return;
    try {
      await axios.delete(`${API}/employees-session/${emp.id}`, { withCredentials: true });
      toast.success('Karyawan berhasil dihapus');
      fetchEmployees();
    } catch (error) { toast.error('Gagal menghapus'); }
  };

  const handleToggleActive = async (emp) => {
    try {
      await axios.put(`${API}/employees-session/${emp.id}`, { is_active: !emp.is_active }, { withCredentials: true });
      toast.success(emp.is_active ? 'Karyawan dinonaktifkan' : 'Karyawan diaktifkan');
      fetchEmployees();
    } catch (error) { toast.error('Gagal mengubah status'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axios.post(`${API}/employees-session/import`, fd, {
        withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message);
      if (res.data.errors?.length > 0) {
        res.data.errors.forEach(err => toast.error(err));
      }
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal import');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csv = 'Nama,Email,Telepon,Posisi,Departemen,Tanggal Masuk\nJohn Doe,john@company.com,08123456789,Staff IT,IT,2026-01-15\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_karyawan.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const filtered = employees.filter(emp => {
    const s = search.toLowerCase();
    return !s || emp.name?.toLowerCase().includes(s) || emp.email?.toLowerCase().includes(s) ||
      emp.position?.toLowerCase().includes(s) || emp.department?.toLowerCase().includes(s);
  });

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Cari karyawan..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-1.5" />Template
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
            <Upload className="w-4 h-4 mr-1.5" />{importing ? 'Importing...' : 'Import Excel'}
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
          <Button size="sm" className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90" onClick={() => handleOpen()} data-testid="add-employee-btn">
            <Plus className="w-4 h-4 mr-1.5" />Tambah
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            <p className="text-xs text-gray-500">Total Karyawan</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{employees.filter(e => e.is_active).length}</p>
            <p className="text-xs text-gray-500">Aktif</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-gray-400">{employees.filter(e => !e.is_active).length}</p>
            <p className="text-xs text-gray-500">Nonaktif</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-[#2E4DA7]">{[...new Set(employees.map(e => e.department).filter(Boolean))].length}</p>
            <p className="text-xs text-gray-500">Departemen</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">{search ? 'Tidak ditemukan' : 'Belum ada data karyawan'}</p>
              {!search && <Button size="sm" className="mt-3 bg-[#2E4DA7]" onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-1" />Tambah Karyawan</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Karyawan</TableHead>
                    <TableHead className="hidden sm:table-cell">Posisi</TableHead>
                    <TableHead className="hidden md:table-cell">Departemen</TableHead>
                    <TableHead className="hidden md:table-cell">Bergabung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-[#2E4DA7] text-white text-xs">{getInitials(emp.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{emp.name}</p>
                            <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                            {emp.phone && <p className="text-xs text-gray-400 sm:hidden">{emp.phone}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-gray-600">{emp.position || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">{emp.department || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Switch checked={emp.is_active} onCheckedChange={() => handleToggleActive(emp)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpen(emp)}>
                            <Edit className="w-4 h-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(emp)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEmp ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
            <DialogDescription>{selectedEmp ? 'Update data karyawan' : 'Isi data karyawan baru. Password default: Welcome123!'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Data Utama */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Data Utama</p>
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Nama Lengkap *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="emp-name" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="emp-email" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">No. Telepon</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">No. KTP/NIK</Label>
                    <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Jenis Kelamin</Label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">-</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Tempat Lahir</Label>
                    <Input value={form.birth_place} onChange={(e) => setForm({ ...form, birth_place: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Tanggal Lahir</Label>
                    <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Agama</Label>
                    <select value={form.religion} onChange={(e) => setForm({ ...form, religion: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">-</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen">Kristen</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Status Pernikahan</Label>
                    <select value={form.marital_status} onChange={(e) => setForm({ ...form, marital_status: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">-</option>
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Menikah">Menikah</option>
                      <option value="Cerai">Cerai</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Pendidikan Terakhir</Label>
                    <select value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">-</option>
                      <option value="SD">SD</option><option value="SMP">SMP</option>
                      <option value="SMA/SMK">SMA/SMK</option><option value="D3">D3</option>
                      <option value="S1">S1</option><option value="S2">S2</option><option value="S3">S3</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Jurusan</Label>
                  <Input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Alamat */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Alamat</p>
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label className="text-xs">Provinsi</Label><Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">Kota/Kabupaten</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label className="text-xs">Kecamatan</Label><Input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">Kelurahan/Desa</Label><Input value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} /></div>
                </div>
                <div className="grid gap-1.5"><Label className="text-xs">Alamat Lengkap (RT/RW)</Label><Input value={form.full_address} onChange={(e) => setForm({ ...form, full_address: e.target.value })} /></div>
              </div>
            </div>

            {/* Data Kepegawaian */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Kepegawaian</p>
              <div className="grid gap-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label className="text-xs">Posisi/Jabatan</Label><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
                  <div className="grid gap-1.5"><Label className="text-xs">Departemen</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="grid gap-1.5"><Label className="text-xs">Tanggal Masuk</Label><Input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} /></div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Status Kerja</Label>
                    <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">-</option>
                      <option value="Tetap">Tetap</option>
                      <option value="Kontrak">Kontrak</option>
                      <option value="Magang">Magang</option>
                      <option value="Paruh Waktu">Paruh Waktu</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5"><Label className="text-xs">Gaji (Rp)</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
                </div>
              </div>
            </div>

            {/* Rekening Bank */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Rekening Bank</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="grid gap-1.5"><Label className="text-xs">Nama Bank</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="BCA, BRI, dll" /></div>
                <div className="grid gap-1.5"><Label className="text-xs">No. Rekening</Label><Input value={form.bank_account} onChange={(e) => setForm({ ...form, bank_account: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">Atas Nama</Label><Input value={form.bank_holder} onChange={(e) => setForm({ ...form, bank_holder: e.target.value })} /></div>
              </div>
            </div>

            {/* Kontak Darurat */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Kontak Darurat</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5"><Label className="text-xs">Nama</Label><Input value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} /></div>
                <div className="grid gap-1.5"><Label className="text-xs">No. Telepon</Label><Input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} /></div>
              </div>
            </div>

            {/* Password (only for new) */}
            {!selectedEmp && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Akun Login</p>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Password</Label>
                  <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Default: Welcome123!" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90">
              {saving ? 'Menyimpan...' : (selectedEmp ? 'Update' : 'Simpan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
