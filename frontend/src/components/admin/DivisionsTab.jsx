import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Layers, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RefreshControl } from '../RefreshControl';

const API = `${process.env.REACT_APP_BACKEND_URL || ''}/api`;

export const DivisionsTab = () => {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => { fetch(); }, []);
  const fetch = async () => {
    try { const r = await axios.get(`${API}/divisions-session`, { withCredentials: true }); setDivisions(r.data); }
    catch {} finally { setLoading(false); }
  };

  const handleOpen = (d = null) => {
    if (d) { setSelected(d); setForm({ name: d.name, description: d.description || '' }); }
    else { setSelected(null); setForm({ name: '', description: '' }); }
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('Nama divisi wajib diisi'); return; }
    setSaving(true);
    try {
      if (selected) { await axios.put(`${API}/divisions-session/${selected.id}`, form, { withCredentials: true }); toast.success('Divisi diupdate'); }
      else { await axios.post(`${API}/divisions-session`, form, { withCredentials: true }); toast.success('Divisi ditambahkan'); }
      setIsOpen(false); fetch();
    } catch (e) { toast.error(e.response?.data?.detail || 'Gagal'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d) => {
    if (!window.confirm(`Hapus divisi "${d.name}"?`)) return;
    try { await axios.delete(`${API}/divisions-session/${d.id}`, { withCredentials: true }); toast.success('Divisi dihapus'); fetch(); }
    catch { toast.error('Gagal menghapus'); }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E4DA7]"></div></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><p className="text-sm text-gray-500">{divisions.length} divisi</p><RefreshControl onRefresh={fetch} /></div>
        <Button size="sm" className="bg-[#2E4DA7]" onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-1.5" />Tambah Divisi</Button>
      </div>

      {divisions.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="py-12 text-center">
          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada divisi. Tambahkan divisi pertama.</p>
        </CardContent></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {divisions.map(d => (
            <Card key={d.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-1">{d.name}</h3>
                {d.description && <p className="text-xs text-gray-500">{d.description}</p>}
                <div className="flex gap-1 mt-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleOpen(d)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => handleDelete(d)}><Trash2 className="w-3 h-3 mr-1" />Hapus</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>{selected ? 'Edit Divisi' : 'Tambah Divisi Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2"><Label>Nama Divisi *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sales" /></div>
            <div className="grid gap-2"><Label>Deskripsi (opsional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
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
