import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Building2, Plus, Edit, Trash2, MapPin, Wifi, X, Navigation, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const OutletsTab = () => {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', office_ips: [], is_active: true,
    latitude: '', longitude: '', radius_meters: 100, geo_enabled: false
  });
  const [newIp, setNewIp] = useState('');

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => {
    try { const r = await axios.get(`${API}/outlets-session`, { withCredentials: true }); setOutlets(r.data); }
    catch {} finally { setLoading(false); }
  };

  const handleOpen = (o = null) => {
    if (o) {
      setSelected(o);
      setForm({
        name: o.name, address: o.address || '', phone: o.phone || '',
        office_ips: o.office_ips || [], is_active: o.is_active !== false,
        latitude: o.latitude || '', longitude: o.longitude || '',
        radius_meters: o.radius_meters || 100, geo_enabled: o.geo_enabled || false
      });
    } else {
      setSelected(null);
      setForm({ name: '', address: '', phone: '', office_ips: [], is_active: true, latitude: '', longitude: '', radius_meters: 100, geo_enabled: false });
    }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Nama outlet wajib diisi'); return; }
    if (form.geo_enabled && (!form.latitude || !form.longitude)) { toast.error('Koordinat wajib diisi jika geolokasi diaktifkan'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        radius_meters: parseInt(form.radius_meters) || 100
      };
      if (selected) { await axios.put(`${API}/outlets-session/${selected.id}`, payload, { withCredentials: true }); toast.success('Outlet diupdate'); }
      else { await axios.post(`${API}/outlets-session`, payload, { withCredentials: true }); toast.success('Outlet ditambahkan'); }
      setIsOpen(false); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (o) => {
    if (!window.confirm(`Hapus outlet "${o.name}"?`)) return;
    try { await axios.delete(`${API}/outlets-session/${o.id}`, { withCredentials: true }); toast.success('Outlet dihapus'); fetchData(); }
    catch { toast.error('Gagal menghapus'); }
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Browser tidak support GPS'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm({ ...form, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) });
        toast.success('Koordinat berhasil diambil dari GPS Anda');
      },
      () => toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.'),
      { enableHighAccuracy: true }
    );
  };

  const getMapsUrl = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{outlets.length} outlet</p>
        <Button size="sm" className="bg-[#2E4DA7]" onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-1.5" />Tambah Outlet</Button>
      </div>

      {outlets.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada outlet. Tambahkan outlet pertama.</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {outlets.map(o => (
            <Card key={o.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-sm">{o.name}</h3>
                    {o.address && <p className="text-xs text-gray-500 flex items-start gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0 mt-0.5" />{o.address}</p>}
                  </div>
                  <Badge className={o.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}>{o.is_active !== false ? 'Aktif' : 'Nonaktif'}</Badge>
                </div>

                {/* IP Info */}
                {o.office_ips?.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Wifi className="w-3 h-3 text-blue-500 mt-0.5" />
                    {o.office_ips.map((ip, i) => <span key={i} className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{ip}</span>)}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Wifi className="w-3 h-3" />Bebas IP</p>
                )}

                {/* Geo Info */}
                {o.geo_enabled && o.latitude && o.longitude ? (
                  <div className="mt-2 p-2 bg-emerald-50 rounded text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 flex items-center gap-1"><Navigation className="w-3 h-3" />Geolokasi aktif — radius {o.radius_meters || 100}m</span>
                      <a href={getMapsUrl(o.latitude, o.longitude)} target="_blank" rel="noopener noreferrer" className="text-blue-600 flex items-center gap-0.5 hover:underline">
                        <ExternalLink className="w-3 h-3" />Maps
                      </a>
                    </div>
                    <p className="text-emerald-600 font-mono mt-0.5">{o.latitude}, {o.longitude}</p>
                  </div>
                ) : o.latitude && o.longitude ? (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1"><Navigation className="w-3 h-3" />Koordinat tersimpan (geolokasi nonaktif)</p>
                ) : null}

                <div className="flex gap-1 mt-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpen(o)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(o)}><Trash2 className="w-3 h-3 mr-1" />Hapus</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? 'Edit Outlet' : 'Tambah Outlet Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Nama Outlet *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Lucky Cell Ciracas" /></div>
            <div className="grid gap-2"><Label>Alamat</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Telepon</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>

            {/* IP Section */}
            <div className="grid gap-2">
              <Label>IP Address Kantor (opsional)</Label>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {form.office_ips.map((ip, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                    {ip}<button onClick={() => setForm({ ...form, office_ips: form.office_ips.filter((_, idx) => idx !== i) })}><X className="w-3 h-3 hover:text-red-500" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="103.139.245" className="font-mono"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newIp.trim()) { setForm({ ...form, office_ips: [...form.office_ips, newIp.trim()] }); setNewIp(''); } } }} />
                <Button variant="outline" onClick={() => { if (newIp.trim()) { setForm({ ...form, office_ips: [...form.office_ips, newIp.trim()] }); setNewIp(''); } }}><Plus className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-gray-500">Kosongkan jika bebas IP.</p>
            </div>

            {/* Geolocation Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Batasan Lokasi GPS</Label>
                  <p className="text-xs text-gray-500">Karyawan hanya bisa absen dalam radius tertentu dari titik ini</p>
                </div>
                <Switch checked={form.geo_enabled} onCheckedChange={(v) => setForm({ ...form, geo_enabled: v })} />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Latitude</Label>
                  <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-6.308123" className="font-mono" />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Longitude</Label>
                  <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="106.864512" className="font-mono" />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Radius (meter)</Label>
                <div className="flex items-center gap-3">
                  <Input type="number" min="10" max="5000" value={form.radius_meters} onChange={(e) => setForm({ ...form, radius_meters: e.target.value })} className="w-28" />
                  <div className="flex gap-1">
                    {[50, 100, 200, 500, 1000].map(r => (
                      <Button key={r} type="button" size="sm" variant={parseInt(form.radius_meters) === r ? 'default' : 'outline'}
                        className={`h-7 text-xs ${parseInt(form.radius_meters) === r ? 'bg-[#2E4DA7]' : ''}`}
                        onClick={() => setForm({ ...form, radius_meters: r })}>
                        {r >= 1000 ? `${r/1000}km` : `${r}m`}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="text-xs" onClick={getMyLocation}>
                  <Navigation className="w-3 h-3 mr-1.5" />Ambil Lokasi Saya
                </Button>
                {form.latitude && form.longitude && (
                  <a href={getMapsUrl(form.latitude, form.longitude)} target="_blank" rel="noopener noreferrer">
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1.5" />Lihat di Maps
                    </Button>
                  </a>
                )}
              </div>
              <p className="text-xs text-gray-500">{form.geo_enabled ? 'Karyawan wajib berada dalam radius saat absen.' : 'Nonaktif — karyawan bisa absen dari lokasi mana saja.'}</p>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Outlet Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#2E4DA7]">{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
