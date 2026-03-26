import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Save, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const EmployeeBiodata = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API}/profile/me`, { withCredentials: true });
      setProfile(res.data);
      const d = res.data;
      setForm({
        phone: d.phone || '', id_number: d.id_number || '', gender: d.gender || '',
        birth_place: d.birth_place || '', birth_date: d.birth_date || '', religion: d.religion || '',
        marital_status: d.marital_status || '', education: d.education || '', major: d.major || '',
        province: d.province || '', city: d.city || '', district: d.district || '',
        village: d.village || '', full_address: d.full_address || '',
        bank_name: d.bank_name || '', bank_account: d.bank_account || '', bank_holder: d.bank_holder || '',
        emergency_contact: d.emergency_contact || '', emergency_phone: d.emergency_phone || ''
      });
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/profile/me/fill-data`, form, { withCredentials: true });
      toast.success(res.data.message);
      if (res.data.skipped?.length > 0) {
        toast.info(`${res.data.skipped.length} field dilewati (sudah terisi oleh HRD)`);
      }
      fetchProfile();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const isEditable = (field) => !profile?.[field] || String(profile[field]).trim() === '';
  
  const totalFields = 19;
  const filledFields = profile ? ['phone','id_number','gender','birth_place','birth_date','religion','marital_status','education','major','province','city','district','village','full_address','bank_name','bank_account','bank_holder','emergency_contact','emergency_phone'].filter(f => profile[f] && String(profile[f]).trim() !== '').length : 0;
  const progress = Math.round((filledFields / totalFields) * 100);

  const FieldInput = ({ label, field, type = 'text', options }) => (
    <div className="grid gap-1.5">
      <Label className="text-xs flex items-center gap-1">
        {label}
        {!isEditable(field) && <Badge className="bg-emerald-100 text-emerald-700 text-[9px] px-1.5 py-0">Terisi</Badge>}
      </Label>
      {options ? (
        <select value={form[field] || ''} disabled={!isEditable(field)}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className={`h-10 rounded-md border border-input bg-background px-3 text-sm ${!isEditable(field) ? 'bg-slate-100 text-gray-500' : ''}`}>
          <option value="">-</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <Input type={type} value={form[field] || ''} disabled={!isEditable(field)}
          onChange={(e) => setForm({ ...form, [field]: e.target.value })}
          className={!isEditable(field) ? 'bg-slate-100 text-gray-500' : ''} />
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div></div>;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      {/* Progress */}
      <Card className={`border-0 shadow-sm ${progress === 100 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {progress === 100 ? <CheckCircle className="w-8 h-8 text-emerald-600" /> : null}
            <div className="flex-1">
              <p className="text-sm font-medium">{progress === 100 ? 'Data diri lengkap!' : 'Lengkapi data diri Anda'}</p>
              <p className="text-xs text-gray-600">{filledFields} dari {totalFields} field terisi ({progress}%)</p>
              <div className="w-full h-2 bg-white/50 rounded-full mt-2">
                <div className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Data Pribadi</CardTitle>
          <CardDescription>Field yang sudah diisi oleh HRD tidak bisa diubah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <FieldInput label="No. Telepon" field="phone" />
            <FieldInput label="No. KTP/NIK" field="id_number" />
            <FieldInput label="Jenis Kelamin" field="gender" options={['Laki-laki', 'Perempuan']} />
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <FieldInput label="Tempat Lahir" field="birth_place" />
            <FieldInput label="Tanggal Lahir" field="birth_date" type="date" />
            <FieldInput label="Agama" field="religion" options={['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu']} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Status Pernikahan" field="marital_status" options={['Belum Menikah','Menikah','Cerai']} />
            <FieldInput label="Pendidikan" field="education" options={['SD','SMP','SMA/SMK','D3','S1','S2','S3']} />
          </div>
          <FieldInput label="Jurusan" field="major" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Alamat</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Provinsi" field="province" />
            <FieldInput label="Kota/Kabupaten" field="city" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Kecamatan" field="district" />
            <FieldInput label="Kelurahan/Desa" field="village" />
          </div>
          <FieldInput label="Alamat Lengkap (RT/RW)" field="full_address" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Rekening Bank</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-3">
            <FieldInput label="Nama Bank" field="bank_name" />
            <FieldInput label="No. Rekening" field="bank_account" />
            <FieldInput label="Atas Nama" field="bank_holder" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Kontak Darurat</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            <FieldInput label="Nama" field="emergency_contact" />
            <FieldInput label="No. Telepon" field="emergency_phone" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90 h-12">
        <Save className="w-4 h-4 mr-2" />{saving ? 'Menyimpan...' : 'Simpan Data Diri'}
      </Button>
    </div>
  );
};
