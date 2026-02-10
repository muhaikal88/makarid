import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FileText, Briefcase, MapPin, Clock, User, Mail, Phone, ExternalLink, Save, Loader2 } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  reviewing: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  shortlisted: 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  interviewed: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100',
  offered: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  hired: 'bg-green-100 text-green-700 hover:bg-green-100',
  rejected: 'bg-red-100 text-red-700 hover:bg-red-100',
};

const statusOptions = [
  { value: 'pending', label: 'Pending (Baru Masuk)' },
  { value: 'reviewing', label: 'Reviewing (Sedang Direview)' },
  { value: 'shortlisted', label: 'Shortlisted (Masuk Shortlist)' },
  { value: 'interviewed', label: 'Interviewed (Sudah Interview)' },
  { value: 'offered', label: 'Offered (Mendapat Penawaran)' },
  { value: 'hired', label: 'Hired (Diterima)' },
  { value: 'rejected', label: 'Rejected (Ditolak)' },
];

const fieldLabels = {
  full_name: 'Nama Lengkap', name: 'Nama', email: 'Email', phone: 'No. Telepon',
  birth_place: 'Tempat Lahir', tempat_lahir: 'Tempat Lahir',
  birth_date: 'Tanggal Lahir', tanggal_lahir: 'Tanggal Lahir',
  education: 'Pendidikan', pendidikan: 'Pendidikan',
  major: 'Jurusan', jurusan: 'Jurusan',
  province: 'Provinsi', provinsi: 'Provinsi',
  city: 'Kota/Kabupaten', kota: 'Kota/Kabupaten',
  district: 'Kecamatan', kecamatan: 'Kecamatan',
  village: 'Kelurahan', kelurahan: 'Kelurahan',
  full_address: 'Alamat Lengkap', alamat: 'Alamat',
  expected_salary: 'Ekspektasi Gaji',
  experience: 'Pengalaman Kerja', pengalaman: 'Pengalaman Kerja',
  gender: 'Jenis Kelamin',
  cover_letter: 'Surat Lamaran',
};

const headerFields = new Set(['full_name', 'name', 'email', 'phone']);

const fieldGroups = [
  {
    title: 'Informasi Pribadi', icon: User,
    fields: ['birth_place', 'tempat_lahir', 'birth_date', 'tanggal_lahir', 'gender', 'education', 'pendidikan', 'major', 'jurusan']
  },
  {
    title: 'Domisili', icon: MapPin,
    fields: ['province', 'provinsi', 'city', 'kota', 'district', 'kecamatan', 'village', 'kelurahan', 'full_address', 'alamat']
  },
  {
    title: 'Pengalaman & Keahlian', icon: Briefcase,
    fields: ['experience', 'pengalaman', 'expected_salary', 'cover_letter']
  },
];

const formatLabel = (key) => fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const AppDetailDialog = ({ isOpen, onClose, selectedApp, handleUpdateStatus, getInitials }) => {
  const [newStatus, setNewStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!selectedApp) return null;

  const formData = selectedApp.form_data || {};
  const currentStatus = newStatus || selectedApp.status;
  const hasChanged = newStatus && newStatus !== selectedApp.status;

  // Collect keys used in groups
  const usedKeys = new Set(headerFields);
  fieldGroups.forEach(g => g.fields.forEach(f => usedKeys.add(f)));

  const remainingKeys = Object.keys(formData).filter(
    k => !usedKeys.has(k) && formatValue(k, formData[k]) !== null
  );

  const handleSave = async () => {
    if (!hasChanged) return;
    setSaving(true);
    try {
      await handleUpdateStatus(selectedApp.id, newStatus);
      setNewStatus(null);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewStatus(null);
    onClose(false);
  };

  const renderGroup = (title, Icon, keys) => {
    const visible = keys.filter(k => formData[k] && formatValue(k, formData[k]) !== null);
    if (visible.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Icon className="w-4 h-4 text-[#2E4DA7]" />
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {visible.map(key => {
            const value = formatValue(key, formData[key]);
            const isLong = value && value.length > 60;
            return (
              <div key={key} className={isLong ? 'md:col-span-2' : ''} data-testid={`detail-field-${key}`}>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{formatLabel(key)}</span>
                {isLong ? (
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">{value}</div>
                ) : (
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const resumeUrl = selectedApp.resume_url;
  const fullResumeUrl = resumeUrl ? `${process.env.REACT_APP_BACKEND_URL}${resumeUrl}` : null;
  const ext = resumeUrl ? resumeUrl.split('.').pop()?.toLowerCase() : '';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="app-detail-title">
            <FileText className="w-5 h-5 text-[#2E4DA7]" />
            Detail Lamaran
          </DialogTitle>
          <DialogDescription>{selectedApp.job_title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4" data-testid="app-detail-content">
          {/* Header */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <Avatar className="w-14 h-14 bg-[#2E4DA7] shrink-0">
              <AvatarFallback className="bg-[#2E4DA7] text-white text-lg">
                {getInitials(formData.full_name || formData.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="app-detail-name">
                {formData.full_name || formData.name || '-'}
              </h3>
              {formData.email && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" /> {formData.email}
                </p>
              )}
              {formData.phone && (
                <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {formData.phone}
                </p>
              )}
            </div>
            <Badge className={statusColors[selectedApp.status] || 'bg-gray-100 hover:bg-gray-100'}>
              {selectedApp.status}
            </Badge>
          </div>

          {/* Job Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 bg-blue-50/60 rounded-lg">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Posisi</span>
              <p className="text-sm font-semibold text-[#2E4DA7] mt-0.5" data-testid="app-detail-job-title">
                {selectedApp.job_title}
              </p>
            </div>
            {selectedApp.job?.department && (
              <div className="p-3 bg-blue-50/60 rounded-lg">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Departemen</span>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedApp.job.department}</p>
              </div>
            )}
            <div className="p-3 bg-blue-50/60 rounded-lg">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Tanggal Melamar</span>
              <p className="text-sm font-semibold text-gray-800 mt-0.5" data-testid="app-detail-date">
                {formatDate(selectedApp.created_at)}
              </p>
            </div>
          </div>

          {/* Field Groups */}
          {fieldGroups.map(g => renderGroup(g.title, g.icon, g.fields))}

          {/* Remaining Fields */}
          {remainingKeys.length > 0 && renderGroup('Informasi Lainnya', FileText, remainingKeys)}

          {/* CV Preview */}
          {fullResumeUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#2E4DA7]" />
                  <h4 className="font-semibold text-gray-900 text-sm">Curriculum Vitae</h4>
                </div>
                <Button
                  variant="ghost" size="sm" data-testid="download-cv-btn"
                  onClick={() => window.open(fullResumeUrl, '_blank')}
                  className="text-xs text-[#2E4DA7]"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Buka di tab baru
                </Button>
              </div>
              {isImage ? (
                <div className="rounded-lg overflow-hidden border bg-slate-50">
                  <img
                    src={fullResumeUrl} alt="CV"
                    className="w-full h-auto max-h-[500px] object-contain"
                    data-testid="cv-preview-image"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<p class="p-8 text-center text-gray-500">Gagal memuat gambar CV</p>'; }}
                  />
                </div>
              ) : isPdf ? (
                <div className="rounded-lg overflow-hidden border bg-slate-50">
                  <iframe
                    src={fullResumeUrl} title="CV Preview"
                    className="w-full h-[500px]"
                    data-testid="cv-preview-pdf"
                  />
                </div>
              ) : (
                <Button variant="outline" data-testid="download-cv-fallback" onClick={() => window.open(fullResumeUrl, '_blank')} className="w-full">
                  <FileText className="w-4 h-4 mr-2" /> Download CV ({ext?.toUpperCase()})
                </Button>
              )}
            </div>
          )}

          {/* Status Update */}
          <div className="space-y-3 p-4 bg-white border rounded-xl">
            <Label className="text-sm font-semibold">Update Status Lamaran</Label>
            <div className="flex gap-3">
              <Select value={currentStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="flex-1" data-testid="app-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSave}
                disabled={!hasChanged || saving}
                className="bg-[#2E4DA7] hover:bg-[#2E4DA7]/90"
                data-testid="save-status-btn"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan
              </Button>
            </div>
            {hasChanged && (
              <p className="text-xs text-amber-600">
                Status akan diubah dari <b>{selectedApp.status}</b> ke <b>{newStatus}</b>. Klik Simpan untuk menyimpan perubahan.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="app-detail-close-btn">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
