import React from 'react';
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
import { FileText, Briefcase, MapPin, Clock, Calendar, User, Mail, Phone } from 'lucide-react';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  interview: 'bg-indigo-100 text-indigo-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

const fieldLabels = {
  full_name: 'Nama Lengkap',
  email: 'Email',
  phone: 'No. Telepon',
  birth_place: 'Tempat Lahir',
  birth_date: 'Tanggal Lahir',
  education: 'Pendidikan',
  major: 'Jurusan',
  province: 'Provinsi',
  city: 'Kota/Kabupaten',
  district: 'Kecamatan',
  village: 'Kelurahan',
  full_address: 'Alamat Lengkap',
  expected_salary: 'Ekspektasi Gaji',
  experience: 'Pengalaman Kerja',
  gender: 'Jenis Kelamin',
  marital_status: 'Status Pernikahan',
  religion: 'Agama',
  id_number: 'No. KTP/NIK',
  skills: 'Keahlian',
  references: 'Referensi',
  cover_letter: 'Surat Lamaran',
  linkedin: 'LinkedIn',
  portfolio: 'Portfolio',
  website: 'Website',
  github: 'GitHub',
  availability: 'Ketersediaan Mulai Kerja',
  current_company: 'Perusahaan Saat Ini',
  current_position: 'Posisi Saat Ini',
  reason_for_leaving: 'Alasan Pindah',
  source: 'Sumber Info Lowongan',
};

// Fields displayed in the header card (excluded from main list)
const headerFields = ['full_name', 'email', 'phone'];

// Group definitions for organized display
const fieldGroups = [
  {
    title: 'Informasi Pribadi',
    icon: User,
    fields: ['birth_place', 'birth_date', 'gender', 'marital_status', 'religion', 'id_number', 'education', 'major']
  },
  {
    title: 'Domisili',
    icon: MapPin,
    fields: ['province', 'city', 'district', 'village', 'full_address']
  },
  {
    title: 'Pengalaman & Keahlian',
    icon: Briefcase,
    fields: ['experience', 'current_company', 'current_position', 'reason_for_leaving', 'skills', 'availability']
  },
  {
    title: 'Kontak & Link',
    icon: Mail,
    fields: ['linkedin', 'portfolio', 'website', 'github']
  }
];

const formatFieldLabel = (key) => {
  return fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const formatFieldValue = (key, value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (key === 'expected_salary' && typeof value === 'string') return `Rp ${value}`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const AppDetailDialog = ({
  isOpen,
  onClose,
  selectedApp,
  handleUpdateStatus,
  getInitials
}) => {
  if (!selectedApp) return null;

  const formData = selectedApp.form_data || {};
  const allFormKeys = Object.keys(formData);

  // Collect keys already used in header or groups
  const usedKeys = new Set(headerFields);
  fieldGroups.forEach(g => g.fields.forEach(f => usedKeys.add(f)));

  // Remaining keys not in any group
  const remainingKeys = allFormKeys.filter(k => !usedKeys.has(k) && formatFieldValue(k, formData[k]) !== null);

  // Render a group of fields
  const renderGroup = (title, Icon, keys) => {
    const visibleFields = keys.filter(k => formData[k] && formatFieldValue(k, formData[k]) !== null);
    if (visibleFields.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Icon className="w-4 h-4 text-[#2E4DA7]" />
          <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {visibleFields.map(key => {
            const value = formatFieldValue(key, formData[key]);
            const isLongText = value && value.length > 60;

            if (isLongText) {
              return (
                <div key={key} className="md:col-span-2">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{formatFieldLabel(key)}</span>
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                    {value}
                  </div>
                </div>
              );
            }

            return (
              <div key={key} data-testid={`detail-field-${key}`}>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{formatFieldLabel(key)}</span>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="app-detail-title">
            <FileText className="w-5 h-5 text-[#2E4DA7]" />
            Detail Lamaran
          </DialogTitle>
          <DialogDescription>
            {selectedApp.job_title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4" data-testid="app-detail-content">
          {/* Applicant Header */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <Avatar className="w-14 h-14 bg-[#2E4DA7] shrink-0">
              <AvatarFallback className="bg-[#2E4DA7] text-white text-lg">
                {getInitials(formData.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 truncate" data-testid="app-detail-name">
                {formData.full_name || '-'}
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
            <Badge className={`${statusColors[selectedApp.status] || 'bg-gray-100'} shrink-0`}>
              {selectedApp.status}
            </Badge>
          </div>

          {/* Job & Date Info */}
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

          {/* Status Update */}
          <div className="space-y-2 p-4 bg-white border rounded-xl">
            <Label className="text-sm font-semibold">Update Status Lamaran</Label>
            <Select
              value={selectedApp.status}
              onValueChange={(value) => handleUpdateStatus(selectedApp.id, value)}
            >
              <SelectTrigger data-testid="app-status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending (Baru Masuk)</SelectItem>
                <SelectItem value="reviewed">Reviewed (Sudah Dilihat)</SelectItem>
                <SelectItem value="interview">Interview (Panggilan Interview)</SelectItem>
                <SelectItem value="hired">Hired (Diterima)</SelectItem>
                <SelectItem value="rejected">Rejected (Ditolak)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Field Groups */}
          {fieldGroups.map(group => renderGroup(group.title, group.icon, group.fields))}

          {/* Salary - special display */}
          {formData.expected_salary && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-[#2E4DA7]" />
                <h4 className="font-semibold text-gray-900 text-sm">Ekspektasi Gaji</h4>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-xl font-bold text-emerald-700" data-testid="app-expected-salary">
                  Rp {formData.expected_salary}
                </p>
              </div>
            </div>
          )}

          {/* Remaining Fields (catch-all for custom/unknown fields) */}
          {remainingKeys.length > 0 && renderGroup('Informasi Lainnya', FileText, remainingKeys)}

          {/* CV */}
          {selectedApp.resume_url && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-[#2E4DA7]" />
                <h4 className="font-semibold text-gray-900 text-sm">Curriculum Vitae</h4>
              </div>
              <Button
                variant="outline"
                data-testid="download-cv-btn"
                onClick={() => window.open(`${process.env.REACT_APP_BACKEND_URL}${selectedApp.resume_url}`, '_blank')}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Download CV
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} data-testid="app-detail-close-btn">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
