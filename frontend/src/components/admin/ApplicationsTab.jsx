import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Checkbox } from '../ui/checkbox';
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
import { FileText, ChevronRight, GitCompareArrows, X, Trash2, AlertTriangle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  reviewing: 'bg-blue-100 text-blue-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  interviewed: 'bg-indigo-100 text-indigo-700',
  offered: 'bg-emerald-100 text-emerald-700',
  hired: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export const ApplicationsTab = ({
  filteredApplications,
  applications,
  jobs,
  filterStatus,
  setFilterStatus,
  filterJob,
  setFilterJob,
  filterDepartment,
  setFilterDepartment,
  searchApp,
  setSearchApp,
  language,
  handleOpenAppDetail,
  handleCompare,
  handleDeleteApp,
  getInitials,
  formatDate
}) => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [exporting, setExporting] = useState(false);

  const departments = useMemo(() => {
    const depts = new Set();
    jobs.forEach(j => { if (j.department) depts.add(j.department); });
    return [...depts].sort();
  }, [jobs]);

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedApps = filteredApplications.filter(a => selectedIds.has(a.id));

  const isAllSelected = filteredApplications.length > 0 && selectedIds.size === filteredApplications.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredApplications.length;

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);
    try {
      const response = await axios.post(
        `${API}/applications-session/export`,
        { application_ids: [...selectedIds] },
        { withCredentials: true, responseType: 'blob' }
      );

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'Export_Lamaran.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Berhasil export ${selectedIds.size} data lamaran`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Gagal export data lamaran');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900" data-testid="applications-tab-title">
          {language === 'id' ? 'Daftar Lamaran' : 'Applications'}
          <span className="text-sm font-normal text-gray-400 ml-2">
            ({filteredApplications.length})
          </span>
        </h2>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" data-testid="filter-status-select">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterJob} onValueChange={setFilterJob}>
          <SelectTrigger className="w-48" data-testid="filter-job-select">
            <SelectValue placeholder="Posisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Posisi</SelectItem>
            {jobs.map(j => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {departments.length > 0 && (
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48" data-testid="filter-department-select">
              <SelectValue placeholder="Departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          placeholder="Cari nama atau email..."
          value={searchApp}
          onChange={(e) => setSearchApp(e.target.value)}
          className="w-64"
          data-testid="search-applications-input"
        />
      </div>

      {/* Select All + Export bar */}
      {filteredApplications.length > 0 && (
        <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <div onClick={toggleSelectAll} className="cursor-pointer flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                className="border-gray-300"
                data-testid="select-all-checkbox"
              />
              <span className="text-sm text-gray-700 select-none">
                {isAllSelected
                  ? (language === 'id' ? 'Batal pilih semua' : 'Deselect all')
                  : (language === 'id' ? 'Pilih semua' : 'Select all')}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedIds.size} dari {filteredApplications.length} dipilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleExport}
                disabled={exporting}
                data-testid="export-excel-btn"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {exporting ? 'Mengexport...' : `Export Excel (${selectedIds.size})`}
              </Button>
            )}
          </div>
        </div>
      )}

      {filteredApplications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500" data-testid="no-applications-msg">
              {language === 'id' ? 'Belum ada lamaran' : 'No applications yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="applications-list">
          {filteredApplications.map(app => {
            const isChecked = selectedIds.has(app.id);
            return (
              <Card
                key={app.id}
                className={`border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isChecked ? 'ring-2 ring-[#2E4DA7] bg-blue-50/30' : ''}`}
                data-testid={`application-card-${app.id}`}
                onClick={() => handleOpenAppDetail(app)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Checkbox */}
                      <div onClick={(e) => toggleSelect(app.id, e)} className="shrink-0">
                        <Checkbox
                          checked={isChecked}
                          data-testid={`compare-check-${app.id}`}
                          className="border-gray-300"
                        />
                      </div>
                      <Avatar className="w-12 h-12 bg-[#2E4DA7]">
                        <AvatarFallback className="bg-[#2E4DA7] text-white">
                          {getInitials(app.applicant_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-gray-900">{app.applicant_name}</h3>
                        <p className="text-sm text-gray-500">{app.applicant_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-[#2E4DA7]">{app.job_title}</p>
                          {app.job_department && (
                            <span className="text-xs text-gray-400">/ {app.job_department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge className={statusColors[app.status] || 'bg-gray-100'}>
                          {app.status}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(app.created_at)}</p>
                      </div>
                      {app.resume_url && (
                        <a
                          href={`${process.env.REACT_APP_BACKEND_URL}${app.resume_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`download-resume-${app.id}`}
                        >
                          <FileText className="w-5 h-5 text-gray-600" />
                        </a>
                      )}
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        data-testid={`delete-app-${app.id}`}
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(app); setDeleteConfirmText(''); }}
                        title="Hapus lamaran"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Compare Bar */}
      {selectedIds.size >= 2 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2E4DA7] text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4"
          data-testid="compare-bar"
        >
          <div className="flex items-center gap-3">
            {selectedApps.slice(0, 4).map(app => (
              <Avatar key={app.id} className="w-8 h-8 border-2 border-white -ml-2 first:ml-0">
                <AvatarFallback className="bg-white text-[#2E4DA7] text-xs font-bold">
                  {getInitials(app.applicant_name)}
                </AvatarFallback>
              </Avatar>
            ))}
            <span className="text-sm font-medium ml-1">
              {selectedIds.size} dipilih
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            className="bg-white text-[#2E4DA7] hover:bg-white/90 font-semibold"
            data-testid="compare-btn"
            onClick={() => handleCompare([...selectedIds])}
          >
            <GitCompareArrows className="w-4 h-4 mr-1.5" />
            Bandingkan
          </Button>

          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            data-testid="clear-selection-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(''); } }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600" data-testid="delete-confirm-title">
              <AlertTriangle className="w-5 h-5" />
              Hapus Lamaran
            </DialogTitle>
            <DialogDescription className="pt-2">
              Lamaran dari <strong>{deleteTarget?.applicant_name}</strong> untuk posisi <strong>{deleteTarget?.job_title}</strong> akan dipindahkan ke tempat sampah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-sm text-gray-600">
              Ketik <strong className="text-red-600 font-mono">HAPUS</strong> untuk konfirmasi:
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Ketik HAPUS"
              data-testid="delete-confirm-input"
              autoFocus
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }} data-testid="delete-cancel-btn">
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== 'HAPUS'}
              data-testid="delete-confirm-btn"
              onClick={() => {
                handleDeleteApp(deleteTarget.id);
                setDeleteTarget(null);
                setDeleteConfirmText('');
              }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Hapus Lamaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
