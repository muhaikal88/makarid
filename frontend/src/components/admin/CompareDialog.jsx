import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
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
import { FileText, ExternalLink } from 'lucide-react';

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
  current_company: 'Perusahaan Saat Ini',
  current_position: 'Posisi Saat Ini',
  availability: 'Ketersediaan',
};

const getLabel = (key) => fieldLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (key === 'expected_salary') return `Rp ${value}`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const getInitials = (name) => {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
};

const CvPreview = ({ resumeUrl }) => {
  if (!resumeUrl) return <span className="text-sm text-gray-400">Tidak ada CV</span>;

  const url = `${process.env.REACT_APP_BACKEND_URL}${resumeUrl}`;
  const ext = resumeUrl.split('.').pop()?.toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';

  return (
    <div className="space-y-2">
      {isImage && (
        <img src={url} alt="CV" className="w-full h-48 object-contain rounded border bg-slate-50" />
      )}
      {isPdf && (
        <iframe src={url} title="CV" className="w-full h-48 rounded border" />
      )}
      {!isImage && !isPdf && (
        <div className="h-20 flex items-center justify-center bg-slate-50 rounded border">
          <FileText className="w-6 h-6 text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">.{ext?.toUpperCase()}</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-[#2E4DA7]"
        onClick={() => window.open(url, '_blank')}
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        Buka di tab baru
      </Button>
    </div>
  );
};

export const CompareDialog = ({ isOpen, onClose, compareApps, handleUpdateStatus }) => {
  if (!compareApps || compareApps.length === 0) return null;

  const allKeys = new Set();
  compareApps.forEach(app => {
    Object.keys(app.form_data || {}).forEach(k => allKeys.add(k));
  });
  const rows = [...allKeys];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-fit max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2" data-testid="compare-dialog-title">
            <FileText className="w-5 h-5 text-[#2E4DA7]" />
            Bandingkan Lamaran ({compareApps.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" data-testid="compare-table">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50">
                  <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide p-4 border-b border-r min-w-[160px] bg-slate-50 sticky left-0 z-20">
                    Field
                  </th>
                  {compareApps.map(app => (
                    <th key={app.id} className="p-4 border-b min-w-[240px] max-w-[300px] bg-slate-50">
                      <div className="flex flex-col items-center gap-2">
                        <Avatar className="w-12 h-12 bg-[#2E4DA7]">
                          <AvatarFallback className="bg-[#2E4DA7] text-white">
                            {getInitials(app.form_data?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 text-sm">{app.form_data?.full_name || '-'}</p>
                          <p className="text-xs text-[#2E4DA7]">{app.job_title}</p>
                        </div>
                        <Badge className={`${statusColors[app.status] || 'bg-gray-100'} text-xs`}>
                          {app.status}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Posisi */}
                <tr className="border-b hover:bg-blue-50/30">
                  <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0">Posisi Dilamar</td>
                  {compareApps.map(app => (
                    <td key={app.id} className="p-3 text-sm text-gray-800">{app.job_title}</td>
                  ))}
                </tr>

                {/* Departemen */}
                <tr className="border-b bg-slate-50/50 hover:bg-blue-50/30">
                  <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0">Departemen</td>
                  {compareApps.map(app => (
                    <td key={app.id} className="p-3 text-sm text-gray-800">{app.job?.department || app.job_department || '-'}</td>
                  ))}
                </tr>

                {/* Tanggal Melamar */}
                <tr className="border-b hover:bg-blue-50/30">
                  <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0">Tanggal Melamar</td>
                  {compareApps.map(app => (
                    <td key={app.id} className="p-3 text-sm text-gray-800">
                      {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  ))}
                </tr>

                {/* Dynamic form_data rows */}
                {rows.map((key, idx) => (
                  <tr key={key} className={`border-b hover:bg-blue-50/30 ${idx % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                    <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0">
                      {getLabel(key)}
                    </td>
                    {compareApps.map(app => {
                      const val = formatValue(key, app.form_data?.[key]);
                      const isLong = val.length > 50;
                      return (
                        <td key={app.id} className="p-3 text-sm text-gray-800 align-top">
                          {isLong ? (
                            <div className="max-h-24 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap">{val}</div>
                          ) : (
                            <span className={key === 'expected_salary' ? 'font-semibold text-emerald-700' : ''}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* CV Preview row */}
                <tr className="border-b">
                  <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0 align-top">CV / Resume</td>
                  {compareApps.map(app => (
                    <td key={app.id} className="p-3 align-top">
                      <CvPreview resumeUrl={app.resume_url} />
                    </td>
                  ))}
                </tr>

                {/* Status Update row */}
                <tr className="bg-slate-50">
                  <td className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide border-r bg-white sticky left-0 align-top">
                    Update Status
                  </td>
                  {compareApps.map(app => (
                    <td key={app.id} className="p-4 align-top">
                      <Select
                        value={app.status}
                        onValueChange={(value) => handleUpdateStatus(app.id, value)}
                      >
                        <SelectTrigger className="w-full" data-testid={`compare-status-${app.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
