import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../ui/table';
import { CalendarClock, Settings, Check, X, Clock, Plus, Trash2, Shield, UserCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const AttendanceTab = ({ language }) => {
  const [tab, setTab] = useState('today');
  const [settings, setSettings] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [monthRecords, setMonthRecords] = useState([]);
  const [selectedPending, setSelectedPending] = useState([]);
  const [newIp, setNewIp] = useState('');

  const toggleSelectPending = (id) => {
    setSelectedPending(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    setSelectedPending(prev => prev.length === pendingRecords.length ? [] : pendingRecords.map(r => r.id));
  };
  const handleBulkApprove = async (approve) => {
    if (selectedPending.length === 0) { toast.error('Pilih minimal 1 absen'); return; }
    try {
      const res = await axios.post(`${API}/attendance/bulk-approve`, { record_ids: selectedPending, approve }, { withCredentials: true });
      toast.success(res.data.message);
      setSelectedPending([]);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal'); }
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [settingsRes, todayRes, pendingRes, empRes] = await Promise.all([
        axios.get(`${API}/attendance/settings`, { withCredentials: true }),
        axios.get(`${API}/attendance/company`, { withCredentials: true }),
        axios.get(`${API}/attendance/pending`, { withCredentials: true }),
        axios.get(`${API}/employees-session`, { withCredentials: true }),
      ]);
      setSettings(settingsRes.data);
      setTodayRecords(todayRes.data);
      setPendingRecords(pendingRes.data);
      setEmployees(empRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMonth = async () => {
    try {
      const res = await axios.get(`${API}/attendance/company?month=${selectedMonth}`, { withCredentials: true });
      setMonthRecords(res.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (tab === 'history') fetchMonth(); }, [tab, selectedMonth]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/attendance/settings`, settings, { withCredentials: true });
      toast.success('Pengaturan absensi berhasil disimpan');
    } catch (e) { toast.error('Gagal menyimpan'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id, approve) => {
    try {
      await axios.put(`${API}/attendance/${id}/approve?approve=${approve}`, {}, { withCredentials: true });
      toast.success(approve ? 'Absen disetujui' : 'Absen ditolak');
      fetchAll();
    } catch (e) { toast.error('Gagal'); }
  };

  const handleGrantBackdate = async (empId, empName) => {
    if (!window.confirm(`Berikan akses absen mundur ke ${empName}? (sekali pakai)`)) return;
    try {
      await axios.post(`${API}/attendance/grant-backdate/${empId}`, {}, { withCredentials: true });
      toast.success(`Akses absen mundur diberikan ke ${empName}`);
      fetchAll();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal'); }
  };

  const addIp = () => {
    if (!newIp.trim()) return;
    setSettings({ ...settings, office_ips: [...(settings.office_ips || []), newIp.trim()] });
    setNewIp('');
  };

  const removeIp = (i) => {
    setSettings({ ...settings, office_ips: settings.office_ips.filter((_, idx) => idx !== i) });
  };

  const getInitials = (n) => n?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div></div>;

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'today', label: 'Hari Ini', count: todayRecords.length },
          { id: 'pending', label: 'Perlu Approval', count: pendingRecords.length },
          { id: 'history', label: 'Riwayat' },
          { id: 'backdate', label: 'Akses Mundur' },
          { id: 'settings', label: 'Pengaturan' },
        ].map(t => (
          <Button key={t.id} variant={tab === t.id ? 'default' : 'outline'} size="sm"
            className={tab === t.id ? 'bg-[#2E4DA7]' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {t.count > 0 && <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">{t.count}</span>}
          </Button>
        ))}
      </div>

      {/* Today's Attendance */}
      {tab === 'today' && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Absensi Hari Ini</CardTitle></CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Belum ada absensi hari ini</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead>Karyawan</TableHead><TableHead>Masuk</TableHead><TableHead>Pulang</TableHead>
                    <TableHead>Break</TableHead><TableHead>Skor</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {todayRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8"><AvatarFallback className="bg-[#2E4DA7] text-white text-xs">{getInitials(r.employee_name)}</AvatarFallback></Avatar>
                            <div><p className="text-sm font-medium">{r.employee_name}</p><p className="text-xs text-gray-500">{r.employee_email}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{r.clock_in || '-'}</TableCell>
                        <TableCell className="text-sm">{r.clock_out || '-'}</TableCell>
                        <TableCell className="text-xs">{r.break_start && r.break_end ? `${r.break_start}-${r.break_end}` : r.break_start ? `${r.break_start}-...` : '-'}</TableCell>
                        <TableCell><Badge className={r.clock_in_score >= (settings?.face_threshold||70) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>{r.clock_in_score || 0}%</Badge></TableCell>
                        <TableCell><Badge className={r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {r.status === 'approved' ? 'OK' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                        </Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pending Approval */}
      {tab === 'pending' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Menunggu Approval ({pendingRecords.length})</CardTitle>
              {pendingRecords.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{selectedPending.length} dipilih</span>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={selectedPending.length === 0} onClick={() => handleBulkApprove(true)}>
                    <Check className="w-3.5 h-3.5 mr-1" />Setujui
                  </Button>
                  <Button size="sm" variant="destructive" disabled={selectedPending.length === 0} onClick={() => handleBulkApprove(false)}>
                    <X className="w-3.5 h-3.5 mr-1" />Tolak
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pendingRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada absen yang perlu disetujui</p>
            ) : (
              <div className="space-y-2">
                {/* Select All */}
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <input type="checkbox" checked={selectedPending.length === pendingRecords.length && pendingRecords.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                  <span className="text-xs font-medium text-gray-600">Pilih Semua</span>
                </div>
                
                {pendingRecords.map(r => (
                  <div key={r.id} className={`p-4 rounded-lg border transition-colors ${selectedPending.includes(r.id) ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selectedPending.includes(r.id)} onChange={() => toggleSelectPending(r.id)} className="rounded shrink-0" />
                      {(r.clock_in_photo || r.pending_change?.photo_url) && (
                        <img src={r.pending_change?.photo_url || r.clock_in_photo} alt="" className="w-12 h-12 rounded-lg object-cover border shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{r.employee_name}</p>
                        <p className="text-xs text-gray-500">{r.date}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => handleApprove(r.id, true)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8" onClick={() => handleApprove(r.id, false)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Detail: data saat ini vs pengajuan */}
                    <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white rounded border">
                        <p className="font-semibold text-gray-600 mb-1">Data Saat Ini:</p>
                        <p>Masuk: <span className="font-medium">{r.clock_in || '--:--'}</span></p>
                        <p>Pulang: <span className="font-medium">{r.clock_out || '--:--'}</span></p>
                        {(r.break_start || r.break_end) && <p>Break: <span className="font-medium">{r.break_start || '--:--'} - {r.break_end || '--:--'}</span></p>}
                        <p>Skor masuk: <span className="font-medium">{r.clock_in_score || 0}%</span></p>
                      </div>
                      {r.pending_change ? (
                        <div className="p-2 bg-amber-100 rounded border border-amber-300">
                          <p className="font-semibold text-amber-800 mb-1">Pengajuan Perubahan:</p>
                          <p className="text-amber-700">Aksi: <span className="font-medium">
                            {r.pending_change.action === 'clock_in' ? 'Absen Masuk' : r.pending_change.action === 'clock_out' ? 'Absen Pulang' : r.pending_change.action === 'break_start' ? 'Mulai Break' : 'Selesai Break'}
                          </span></p>
                          <p className="text-amber-700">Jam: <span className="font-medium">{r.pending_change.time}</span></p>
                          <p className="text-amber-700">Skor wajah: <span className="font-medium">{r.pending_change.face_score}%</span> (min: {settings?.face_threshold||70}%)</p>
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-100 rounded border border-amber-300">
                          <p className="font-semibold text-amber-800 mb-1">Skor Rendah:</p>
                          <p className="text-amber-700">Skor: <span className="font-medium">{r.clock_in_score || r.clock_out_score || 0}%</span> (min: {settings?.face_threshold||70}%)</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {tab === 'history' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Riwayat Absensi</CardTitle>
              <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-40" />
            </div>
          </CardHeader>
          <CardContent>
            {monthRecords.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data untuk bulan ini</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow className="bg-slate-50">
                    <TableHead>Tanggal</TableHead><TableHead>Karyawan</TableHead><TableHead>Masuk</TableHead>
                    <TableHead>Pulang</TableHead><TableHead>Skor</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {monthRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.date}{r.is_backdate && <Badge className="ml-1 bg-purple-100 text-purple-700 text-[10px]">mundur</Badge>}</TableCell>
                        <TableCell className="text-sm font-medium">{r.employee_name}</TableCell>
                        <TableCell className="text-sm">{r.clock_in || '-'}</TableCell>
                        <TableCell className="text-sm">{r.clock_out || '-'}</TableCell>
                        <TableCell><Badge className="bg-slate-100 text-slate-700">{r.clock_in_score || 0}%</Badge></TableCell>
                        <TableCell><Badge className={r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                          {r.status === 'approved' ? 'OK' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                        </Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backdate Access */}
      {tab === 'backdate' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Berikan Akses Absen Mundur</CardTitle>
            <CardDescription>Akses sekali pakai — setelah karyawan absen mundur, akses otomatis hangus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {employees.filter(e => e.is_active).map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8"><AvatarFallback className="bg-[#2E4DA7] text-white text-xs">{getInitials(emp.name)}</AvatarFallback></Avatar>
                    <div><p className="text-sm font-medium">{emp.name}</p><p className="text-xs text-gray-500">{emp.position || emp.email}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    {emp.backdate_token && !emp.backdate_token.used ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Akses Aktif</Badge>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleGrantBackdate(emp.id, emp.name)}>
                        <Undo2 className="w-3 h-3 mr-1.5" />Beri Akses
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      {tab === 'settings' && settings && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="w-5 h-5" />Pengaturan Absensi</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {/* Face Threshold */}
            <div className="space-y-2">
              <Label className="font-medium">Batas Kemiripan Wajah (%)</Label>
              <div className="flex items-center gap-3">
                <Input type="range" min="30" max="99" value={settings.face_threshold}
                  onChange={(e) => setSettings({ ...settings, face_threshold: parseInt(e.target.value) })}
                  className="flex-1" />
                <span className="text-xl font-bold text-[#2E4DA7] w-14 text-center">{settings.face_threshold}%</span>
              </div>
              <p className="text-xs text-gray-500">Di bawah {settings.face_threshold}% → absen perlu approval HRD. Rekomendasi: 60-80%</p>
            </div>

            {/* Work Hours */}
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="grid gap-1.5"><Label className="text-xs">Jam Masuk</Label><Input type="time" value={settings.work_start} onChange={(e) => setSettings({ ...settings, work_start: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Jam Pulang</Label><Input type="time" value={settings.work_end} onChange={(e) => setSettings({ ...settings, work_end: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Mulai Break</Label><Input type="time" value={settings.break_start} onChange={(e) => setSettings({ ...settings, break_start: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label className="text-xs">Selesai Break</Label><Input type="time" value={settings.break_end} onChange={(e) => setSettings({ ...settings, break_end: e.target.value })} /></div>
            </div>

            {/* IP Kantor */}
            <div className="space-y-2">
              <Label className="font-medium">IP Jaringan Kantor</Label>
              <div className="flex flex-wrap gap-2">
                {(settings.office_ips || []).map((ip, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-mono">
                    {ip}
                    <button onClick={() => removeIp(i)} className="hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="Contoh: 103.139.245" className="font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addIp())} />
                <Button variant="outline" onClick={addIp}><Plus className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-gray-500">IP prefix jaringan kantor. Karyawan hanya bisa absen dari IP yang cocok.</p>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div><p className="text-sm font-medium">Izinkan Absen dari Luar Kantor</p><p className="text-xs text-gray-500">Default untuk semua karyawan (bisa di-override per karyawan)</p></div>
                <Switch checked={settings.allow_outside_network} onCheckedChange={(v) => setSettings({ ...settings, allow_outside_network: v })} />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div><p className="text-sm font-medium">Izinkan Absen Mundur Tanggal</p><p className="text-xs text-gray-500">Global setting. Jika off, karyawan perlu akses khusus dari HRD.</p></div>
                <Switch checked={settings.allow_backdate} onCheckedChange={(v) => setSettings({ ...settings, allow_backdate: v })} />
              </div>
            </div>

            <Button onClick={handleSaveSettings} disabled={saving} className="w-full bg-[#2E4DA7] hover:bg-[#2E4DA7]/90">
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
